const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const THREE = require('three');
const { ServerCollisionSystem } = require('./src/server/collision.js');
const { createMap } = require('./src/server/map.js');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Constants
const MAX_PLAYERS = 20;
const CULLING_DISTANCE = 100;
const POSITION_UPDATE_INTERVAL = 50; // 20 updates per second

// Create a dummy scene for the map
const scene = new THREE.Scene();

// Create the game map and collision system
const map = createMap();
map.init(scene); // Initialize the map with the scene
const collisionSystem = new ServerCollisionSystem(map);

// Active players map to store connected players
const activePlayers = new Map();

// Setup WebSocket server
function setupWebSocketServer(io) {
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
      lastUpdate: Date.now(),
      lastPosition: spawnPoint // Store last valid position
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
    
    // Handle position updates with culling and collision validation
    socket.on('updatePosition', (data) => {
      const player = activePlayers.get(socket.id);
      if (player) {
        // Calculate movement from last position
        const movement = new THREE.Vector3(
          data.position.x - player.lastPosition.x,
          data.position.y - player.lastPosition.y,
          data.position.z - player.lastPosition.z
        );

        console.log('Position update received:', {
          playerId: socket.id,
          position: data.position,
          movement: movement,
          lastPosition: player.lastPosition
        });

        // Convert position to THREE.Vector3
        const position = new THREE.Vector3(
          data.position.x,
          data.position.y,
          data.position.z
        );

        // Validate the new position
        const validation = collisionSystem.validatePosition(position, movement);
        
        console.log('Position validation result:', {
          playerId: socket.id,
          isValid: validation.isValid,
          reason: validation.reason,
          originalPosition: position,
          adjustedPosition: validation.adjustedPosition
        });
        
        if (!validation.isValid) {
          // If position is invalid, use the adjusted position
          player.position = validation.adjustedPosition;
          // Send the corrected position back to the client
          socket.emit('positionCorrection', {
            position: validation.adjustedPosition
          });
          console.log('Sent position correction to client:', {
            playerId: socket.id,
            correctedPosition: validation.adjustedPosition
          });
        } else {
          // Position is valid, update it
          player.position = data.position;
        }

        player.rotation = data.rotation;
        player.lastUpdate = Date.now();
        player.lastPosition = player.position.clone();
        
        // Only broadcast to nearby players
        activePlayers.forEach((otherPlayer, otherId) => {
          if (otherId !== socket.id) {
            const dx = player.position.x - otherPlayer.position.x;
            const dz = player.position.z - otherPlayer.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= CULLING_DISTANCE) {
              io.to(otherId).emit('playerPositionUpdate', {
                id: socket.id,
                position: player.position,
                rotation: player.rotation
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

// Helper function to find a safe spawn point
function findSafeSpawnPoint(activePlayers) {
  // Simple spawn point selection - can be improved with actual map data
  const spawnPoints = [
    { x: 0, y: 1, z: 0 },
    { x: 5, y: 1, z: 5 },
    { x: -5, y: 1, z: -5 },
    { x: 5, y: 1, z: -5 },
    { x: -5, y: 1, z: 5 }
  ];
  
  // Find the spawn point furthest from other players
  let bestPoint = spawnPoints[0];
  let maxDistance = 0;
  
  activePlayers.forEach(player => {
    spawnPoints.forEach(point => {
      const dx = point.x - player.position.x;
      const dz = point.z - player.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance > maxDistance) {
        maxDistance = distance;
        bestPoint = point;
      }
    });
  });
  
  return bestPoint;
}

// Start the server
const PORT = process.env.PORT || 3000;
setupWebSocketServer(io);
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 