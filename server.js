import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CORS_ORIGIN 
      : '*',
    methods: ['GET', 'POST']
  },
  wsEngine: WebSocketServer
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
  io.on('connection', (socket) => {
    // Check if server is full
    if (activePlayers.size >= MAX_PLAYERS) {
      socket.emit('serverFull');
      socket.disconnect(true);
      return;
    }

    console.log(`New player connected: ${socket.id}`);
    
    // Find safe spawn point and add player
    const spawnPoint = findSafeSpawnPoint(activePlayers);
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
    activePlayers.forEach((player, playerId) => {
      if (playerId !== socket.id) {
        const dx = spawnPoint.x - player.position.x;
        const dz = spawnPoint.z - player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance <= CULLING_DISTANCE) {
          socket.emit('playerConnected', {
            id: playerId,
            position: player.position,
            rotation: player.rotation,
            health: player.health
          });
        }
      }
    });
    
    // Handle position updates with culling
    socket.on('updatePosition', (data) => {
      const player = activePlayers.get(socket.id);
      if (player) {
        player.position = data.position;
        player.rotation = data.rotation;
        player.lastUpdate = Date.now();
        
        // Only broadcast to nearby players
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = data.position.x - otherPlayer.position.x;
            const dz = data.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              io.to(otherId).emit('playerPositionUpdate', {
                id: socket.id,
                position: data.position,
                rotation: data.rotation
              });
            }
          }
        });
      }
    });
    
    // Handle health updates
    socket.on('updateHealth', (data) => {
      const player = activePlayers.get(socket.id);
      if (player) {
        player.health = data.health;
        
        // Only broadcast to nearby players
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = player.position.x - otherPlayer.position.x;
            const dz = player.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              io.to(otherId).emit('playerHealthUpdate', {
                id: socket.id,
                health: data.health
              });
            }
          }
        });
      }
    });
    
    // Handle player shooting with culling
    socket.on('playerShoot', (data) => {
      const player = activePlayers.get(socket.id);
      if (player) {
        // Only broadcast to nearby players
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = data.position.x - otherPlayer.position.x;
            const dz = data.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              io.to(otherId).emit('playerShoot', {
                id: socket.id,
                position: data.position,
                direction: data.direction
              });
            }
          }
        });
      }
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      const player = activePlayers.get(socket.id);
      if (player) {
        // Only notify nearby players of disconnection
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = player.position.x - otherPlayer.position.x;
            const dz = player.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              io.to(otherId).emit('playerDisconnected', socket.id);
            }
          }
        });
        
        // Remove player from active players
        activePlayers.delete(socket.id);
      }
    });
  });
  
  // Cleanup inactive players every 30 seconds
  setInterval(() => {
    const now = Date.now();
    activePlayers.forEach((player, id) => {
      if (now - player.lastUpdate > 30000) { // 30 seconds timeout
        const socket = io.sockets.sockets.get(id);
        if (socket) {
          socket.disconnect(true);
        }
        activePlayers.delete(id);
      }
    });
  }, 30000);
}

// Apply WebSocket setup
setupWebSocketServer(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 