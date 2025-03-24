import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug logging configuration
const DEBUG = {
  CONNECTIONS: true,
  PLAYER_UPDATES: true,
  CULLING: true,
  SPAWN: true,
  COMBAT: true
};

function debugLog(category, message, data = {}) {
  if (DEBUG[category]) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][${category}] ${message}`, data);
  }
}

const app = express();
const server = createServer(app);

// Add a route handler for the root path
app.get('/', (req, res) => {
  res.send('Rat Detective WebSocket Server Running');
});

// More permissive CORS in development
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://your-production-domain.com']  // Update with your production domain
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

debugLog('CONNECTIONS', 'Setting up server with CORS origins:', { corsOrigins });

// Apply CORS middleware to Express app
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  wsEngine: WebSocketServer,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true
});

// Add connection event logging before any handlers
io.engine.on('connection_error', (err) => {
  debugLog('CONNECTIONS', 'Connection error:', { 
    error: err.message,
    code: err.code,
    context: err.context,
    stack: err.stack
  });
});

io.on('connect', (socket) => {
  debugLog('CONNECTIONS', 'Raw socket connected', { socketId: socket.id });
});

io.engine.on('initial_headers', (headers, req) => {
  debugLog('CONNECTIONS', 'Initial headers:', { 
    headers: headers,
    url: req.url,
    method: req.method,
    query: req.query
  });
});

io.engine.on('headers', (headers, req) => {
  debugLog('CONNECTIONS', 'Headers:', { 
    headers: headers,
    url: req.url,
    method: req.method,
    query: req.query
  });
});

// Serve static files from the dist directory for production
// In development, Vite will handle static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// Constants for game configuration
const MAX_PLAYERS = 20;
const MAP_SIZE = 1000; // Size of the map in units
const SPAWN_POINTS = generateSpawnPoints();
const CULLING_DISTANCE = 100; // Distance at which to cull distant players

// Generate spawn points around the map
function generateSpawnPoints() {
  const points = [];
  const numPoints = MAX_PLAYERS * 2; // Generate extra spawn points for flexibility
  
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: (Math.random() - 0.5) * MAP_SIZE,
      y: 0, // Ground level
      z: (Math.random() - 0.5) * MAP_SIZE
    });
  }
  return points;
}

// Find a safe spawn point away from other players
function findSafeSpawnPoint(activePlayers) {
  for (const point of SPAWN_POINTS) {
    let isSafe = true;
    for (const [_, player] of activePlayers) {
      const dx = point.x - player.position.x;
      const dz = point.z - player.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < CULLING_DISTANCE) {
        isSafe = false;
        break;
      }
    }
    if (isSafe) return point;
  }
  return SPAWN_POINTS[0]; // Fallback to first point if no safe spot found
}

// Active players map to store connected players
const activePlayers = new Map();

// Setup WebSocket server
export function setupWebSocketServer(io) {
  debugLog('CONNECTIONS', 'WebSocket server initialized');

  io.on('connection', (socket) => {
    debugLog('CONNECTIONS', 'Raw socket connected', { 
      socketId: socket.id,
      transport: socket.conn.transport.name,
      remoteAddress: socket.handshake.address,
      headers: socket.handshake.headers
    });

    // Handle ping messages for latency debugging
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Check if server is full
    if (activePlayers.size >= MAX_PLAYERS) {
      debugLog('CONNECTIONS', 'Server full - rejecting connection', { socketId: socket.id });
      socket.emit('serverFull');
      socket.disconnect(true);
      return;
    }

    debugLog('CONNECTIONS', 'New player connected', { 
      socketId: socket.id, 
      totalPlayers: activePlayers.size + 1,
      transport: socket.conn.transport.name,
      query: socket.handshake.query
    });
    
    // Find safe spawn point and add player
    const spawnPoint = findSafeSpawnPoint(activePlayers);
    debugLog('SPAWN', 'Found spawn point for player', { 
      socketId: socket.id, 
      spawnPoint,
      attempts: SPAWN_POINTS.length 
    });

    activePlayers.set(socket.id, {
      id: socket.id,
      health: 100,
      position: spawnPoint,
      rotation: { y: 0 },
      lastUpdate: Date.now()
    });
    
    // Send spawn point to new player
    socket.emit('spawnPoint', spawnPoint);
    
    // Notify all clients about the new player
    socket.broadcast.emit('playerConnected', {
      id: socket.id,
      position: spawnPoint
    });
    
    // Send existing players to the new player (with culling)
    let visiblePlayers = 0;
    activePlayers.forEach((player, playerId) => {
      if (playerId !== socket.id) {
        const dx = spawnPoint.x - player.position.x;
        const dz = spawnPoint.z - player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance <= CULLING_DISTANCE) {
          visiblePlayers++;
          socket.emit('playerConnected', {
            id: playerId,
            position: player.position,
            rotation: player.rotation,
            health: player.health
          });
        }
      }
    });
    
    debugLog('CULLING', 'Sent visible players to new player', {
      socketId: socket.id,
      visiblePlayers,
      totalPlayers: activePlayers.size
    });
    
    // Handle position updates with culling
    socket.on('updatePosition', (data) => {
      const player = activePlayers.get(socket.id);
      if (player) {
        const oldPosition = { ...player.position };
        player.position = data.position;
        player.rotation = data.rotation;
        player.lastUpdate = Date.now();
        
        if (DEBUG.PLAYER_UPDATES) {
          const movement = {
            dx: data.position.x - oldPosition.x,
            dy: data.position.y - oldPosition.y,
            dz: data.position.z - oldPosition.z
          };
          debugLog('PLAYER_UPDATES', 'Player position updated', {
            socketId: socket.id,
            movement,
            newPosition: data.position
          });
        }
        
        // Only broadcast to nearby players
        let updatedPlayers = 0;
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = data.position.x - otherPlayer.position.x;
            const dz = data.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              updatedPlayers++;
              io.to(otherId).emit('playerPositionUpdate', {
                id: socket.id,
                position: data.position,
                rotation: data.rotation
              });
            }
          }
        });

        if (DEBUG.CULLING) {
          debugLog('CULLING', 'Position update broadcast', {
            socketId: socket.id,
            updatedPlayers,
            totalPlayers: activePlayers.size - 1
          });
        }
      }
    });
    
    // Handle health updates
    socket.on('updateHealth', (data) => {
      const player = activePlayers.get(socket.id);
      if (player) {
        const oldHealth = player.health;
        player.health = data.health;
        
        debugLog('COMBAT', 'Player health updated', {
          socketId: socket.id,
          oldHealth,
          newHealth: data.health,
          change: data.health - oldHealth
        });
        
        // Only broadcast to nearby players
        let updatedPlayers = 0;
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = player.position.x - otherPlayer.position.x;
            const dz = player.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              updatedPlayers++;
              io.to(otherId).emit('playerHealthUpdate', {
                id: socket.id,
                health: data.health
              });
            }
          }
        });

        debugLog('CULLING', 'Health update broadcast', {
          socketId: socket.id,
          updatedPlayers,
          totalPlayers: activePlayers.size - 1
        });
      }
    });
    
    // Handle player shooting with culling
    socket.on('playerShoot', (data) => {
      const player = activePlayers.get(socket.id);
      if (player) {
        debugLog('COMBAT', 'Player shot', {
          socketId: socket.id,
          position: data.position,
          direction: data.direction
        });

        // Only broadcast to nearby players
        let updatedPlayers = 0;
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = data.position.x - otherPlayer.position.x;
            const dz = data.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              updatedPlayers++;
              io.to(otherId).emit('playerShoot', {
                id: socket.id,
                position: data.position,
                direction: data.direction
              });
            }
          }
        });

        debugLog('CULLING', 'Shot event broadcast', {
          socketId: socket.id,
          updatedPlayers,
          totalPlayers: activePlayers.size - 1
        });
      }
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
      debugLog('CONNECTIONS', 'Player disconnected', { 
        socketId: socket.id,
        remainingPlayers: activePlayers.size - 1
      });
      
      const player = activePlayers.get(socket.id);
      if (player) {
        // Only notify nearby players of disconnection
        let notifiedPlayers = 0;
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = player.position.x - otherPlayer.position.x;
            const dz = player.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              notifiedPlayers++;
              io.to(otherId).emit('playerDisconnected', socket.id);
            }
          }
        });
        
        debugLog('CULLING', 'Disconnect broadcast', {
          socketId: socket.id,
          notifiedPlayers,
          totalPlayers: activePlayers.size - 1
        });
        
        // Remove player from active players
        activePlayers.delete(socket.id);
      }
    });
  });
  
  // Add transport change logging
  io.engine.on('connection', (socket) => {
    debugLog('CONNECTIONS', 'Engine connection established', {
      id: socket.id,
      transport: socket.transport.name,
      protocol: socket.protocol
    });

    socket.on('upgrade', (transport) => {
      debugLog('CONNECTIONS', 'Socket transport upgraded', {
        from: socket.transport.name,
        to: transport.name,
        socketId: socket.id
      });
    });
  });
  
  // Cleanup inactive players every 30 seconds
  setInterval(() => {
    const now = Date.now();
    let removedPlayers = 0;
    activePlayers.forEach((player, id) => {
      if (now - player.lastUpdate > 30000) { // 30 seconds timeout
        debugLog('CONNECTIONS', 'Removing inactive player', {
          socketId: id,
          lastUpdate: new Date(player.lastUpdate).toISOString(),
          inactiveDuration: (now - player.lastUpdate) / 1000
        });
        const socket = io.sockets.sockets.get(id);
        if (socket) {
          socket.disconnect(true);
        }
        activePlayers.delete(id);
        removedPlayers++;
      }
    });
    
    if (removedPlayers > 0) {
      debugLog('CONNECTIONS', 'Inactive player cleanup complete', {
        removedPlayers,
        remainingPlayers: activePlayers.size
      });
    }
  }, 30000);
}

// Apply WebSocket setup
setupWebSocketServer(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  debugLog('CONNECTIONS', 'Server started', { 
    port: PORT, 
    environment: process.env.NODE_ENV || 'development',
    maxPlayers: MAX_PLAYERS,
    cullingDistance: CULLING_DISTANCE
  });
}); 