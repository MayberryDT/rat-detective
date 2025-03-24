// Last updated: 2025-03-20T03:43:34.643Z
// Only import socket.io-client in browser environment
import { io } from 'socket.io-client';
import * as THREE from 'three';
import { createRat } from './rat.js';
import { debugLog, DEBUG_CATEGORIES } from './debug.js';

// Define the server URL based on environment
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3000';

// Prevent multiple connections in development
let socket = null;

// Constants
const CULLING_DISTANCE = 100; // Must match server value
const CONNECTION_OPTIONS = {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: false,
  upgrade: true,
  path: '/socket.io/',
  query: {
    clientTime: Date.now(),
    clientVersion: '1.0.0'
  }
};

/**
 * Initialize the multiplayer system
 * @param {THREE.Scene} scene - The ThreeJS scene
 * @param {THREE.Group} localRat - The local player's rat model
 * @return {Object} The socket and players map
 */
export function initMultiplayer(scene, localRat) {
  debugLog(DEBUG_CATEGORIES.SCENE, 'Starting multiplayer initialization');

  // If we already have a socket connection, return it
  if (socket) {
    debugLog(DEBUG_CATEGORIES.SCENE, 'Reusing existing socket connection', { socketId: socket.id });
    return { socket, players: new Map() };
  }

  debugLog(DEBUG_CATEGORIES.SCENE, 'Creating new socket connection', {
    url: SERVER_URL,
    options: CONNECTION_OPTIONS
  });
  
  // Connect to the WebSocket server with options
  try {
    socket = io(SERVER_URL, CONNECTION_OPTIONS);
    debugLog(DEBUG_CATEGORIES.SCENE, 'Socket created', {
      id: socket.id,
      connected: socket.connected
    });

    // Add connection event handlers
    socket.on('connect', () => {
      debugLog(DEBUG_CATEGORIES.SCENE, 'Socket connected successfully', { socketId: socket.id });
    });

    socket.on('connect_error', (error) => {
      debugLog(DEBUG_CATEGORIES.SCENE, 'Socket connection error', { error: error.message });
    });

    socket.on('disconnect', (reason) => {
      debugLog(DEBUG_CATEGORIES.SCENE, 'Socket disconnected', { reason });
    });

    socket.on('reconnect', (attemptNumber) => {
      debugLog(DEBUG_CATEGORIES.SCENE, 'Socket reconnected', { attemptNumber });
    });

    socket.on('reconnect_error', (error) => {
      debugLog(DEBUG_CATEGORIES.SCENE, 'Socket reconnection error', { error: error.message });
    });

    socket.on('reconnect_failed', () => {
      debugLog(DEBUG_CATEGORIES.SCENE, 'Socket reconnection failed');
    });

  } catch (error) {
    console.error('Failed to create socket:', error);
    throw error;
  }

  // Map to store other players' rat models
  const players = new Map();
  
  // Handle server full condition
  socket.on('serverFull', () => {
    console.log('Server is full! Try again later.');
    alert('Server is full! Maximum 20 players. Please try again later.');
  });
  
  // Handle spawn point assignment
  socket.on('spawnPoint', (spawnPoint) => {
    localRat.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
  });
  
  // Handle new player connection
  socket.on('playerConnected', (data) => {
    console.log('New player connected:', data.id);
    
    // Only create model if within culling distance
    const dx = data.position.x - localRat.position.x;
    const dz = data.position.z - localRat.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance <= CULLING_DISTANCE) {
      // Create a new rat model for the connected player
      const { ratGroup } = createRat({ isNPC: false });
      ratGroup.position.copy(data.position);
      if (data.rotation) ratGroup.rotation.y = data.rotation.y;
      scene.add(ratGroup);
      
      // Store the remote rat model
      players.set(data.id, ratGroup);
    }
  });
  
  // Handle player disconnection
  socket.on('playerDisconnected', (playerId) => {
    console.log('Player disconnected:', playerId);
    
    // Remove the disconnected player if it exists
    const ratModel = players.get(playerId);
    if (ratModel) {
      scene.remove(ratModel);
      players.delete(playerId);
    }
  });
  
  // Handle position updates from other players
  socket.on('playerPositionUpdate', (data) => {
    const remoteRat = players.get(data.id);
    
    // Calculate distance to player
    const dx = data.position.x - localRat.position.x;
    const dz = data.position.z - localRat.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance <= CULLING_DISTANCE) {
      // Player is within view distance
      if (!remoteRat) {
        // Create new rat model if doesn't exist
        const { ratGroup } = createRat({ isNPC: false });
        ratGroup.position.copy(data.position);
        if (data.rotation) ratGroup.rotation.y = data.rotation.y;
        scene.add(ratGroup);
        players.set(data.id, ratGroup);
      } else {
        // Update existing rat model
        remoteRat.position.copy(data.position);
        if (data.rotation) remoteRat.rotation.y = data.rotation.y;
      }
    } else {
      // Player is outside view distance, remove if exists
      if (remoteRat) {
        scene.remove(remoteRat);
        players.delete(data.id);
      }
    }
  });
  
  // Handle health updates from other players
  socket.on('playerHealthUpdate', (data) => {
    const remoteRat = players.get(data.id);
    if (remoteRat) {
      remoteRat.health = data.health;
      // TODO: Update health bar or visual indicator
    }
  });
  
  // Handle shooting events from other players
  socket.on('playerShoot', (data) => {
    const remoteRat = players.get(data.id);
    if (remoteRat) {
      // TODO: Show shooting animation/effects
      console.log('Remote player shot:', data);
    }
  });
  
  // Clean up socket on HMR
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (socket) {
        console.log('Cleaning up socket connection on HMR update');
        socket.disconnect();
        socket = null;
      }
    });
  }

  // Explicitly attempt connection
  debugLog(DEBUG_CATEGORIES.SCENE, 'Attempting socket connection');
  socket.connect();

  // Debug connection state
  debugLog(DEBUG_CATEGORIES.SCENE, 'Initial socket state', {
    id: socket.id,
    connected: socket.connected,
    disconnected: socket.disconnected,
    transport: socket.io?.engine?.transport?.name
  });

  return { socket, players };
}

/**
 * Update the local player's position on the server
 * @param {Object} socket - The socket.io client instance
 * @param {THREE.Group} localRat - The local player's rat model
 */
export function updatePlayerPosition(socket, localRat) {
  if (!socket || !localRat) return;
  
  // Send position update to server
  socket.emit('updatePosition', {
    position: {
      x: localRat.position.x,
      y: localRat.position.y,
      z: localRat.position.z
    },
    rotation: {
      y: localRat.rotation.y
    }
  });
}

/**
 * Update the local player's health on the server
 * @param {Object} socket - The socket.io client instance
 * @param {THREE.Group} localRat - The local player's rat model
 */
export function updatePlayerHealth(socket, localRat) {
  if (!socket || !localRat) return;
  
  // Send health update to server
  socket.emit('updateHealth', {
    health: localRat.health
  });
}

/**
 * Broadcast a shooting event to other players
 * @param {Object} socket - The socket.io client instance
 * @param {THREE.Vector3} position - The position of the shot
 * @param {THREE.Vector3} direction - The direction of the shot
 */
export function broadcastShoot(socket, position, direction) {
  if (!socket) return;
  
  socket.emit('playerShoot', {
    position: {
      x: position.x,
      y: position.y,
      z: position.z
    },
    direction: {
      x: direction.x,
      y: direction.y,
      z: direction.z
    }
  });
} 