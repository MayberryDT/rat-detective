// Last updated: 2025-03-20T03:43:34.643Z
// Only import socket.io-client in browser environment
import { io } from 'socket.io-client';
import * as THREE from 'three';
import { createRat } from './rat.js';

// Define the server URL - use relative URL in production, localhost for development
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3000';

/**
 * Initialize the multiplayer system
 * @param {THREE.Scene} scene - The ThreeJS scene
 * @param {THREE.Group} localRat - The local player's rat model
 * @return {Object} The socket and players map
 */
export function initMultiplayer(scene, localRat) {
  console.log('Initializing multiplayer...');
  
  // Connect to the WebSocket server
  const socket = io(SERVER_URL);
  
  // Map to store other players' rat models
  const players = {};
  
  // Handle socket connection
  socket.on('connect', () => {
    console.log('Connected to server with ID:', socket.id);
    
    // Initialize position update interval
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      setInterval(() => {
        updatePlayerPosition(socket, localRat);
      }, 50); // 20 updates per second
    }
  });
  
  // Handle new player connection
  socket.on('playerConnected', (playerId) => {
    console.log('New player connected:', playerId);
    
    // Create a new rat model for the connected player
    const { ratGroup } = createRat({ isNPC: false });
    scene.add(ratGroup);
    
    // Store the remote rat model
    players[playerId] = ratGroup;
  });
  
  // Handle player disconnection
  socket.on('playerDisconnected', (playerId) => {
    console.log('Player disconnected:', playerId);
    
    // Remove the disconnected player
    handlePlayerDisconnect(scene, players, playerId);
  });
  
  // Handle position updates from other players
  socket.on('playerPositionUpdate', (data) => {
    const remoteRat = players[data.id];
    if (remoteRat) {
      // Update position
      remoteRat.position.x = data.position.x;
      remoteRat.position.y = data.position.y;
      remoteRat.position.z = data.position.z;
      
      // Update rotation
      remoteRat.rotation.y = data.rotation.y;
    }
  });
  
  // Handle health updates from other players
  socket.on('playerHealthUpdate', (data) => {
    const remoteRat = players[data.id];
    if (remoteRat) {
      remoteRat.health = data.health;
    }
  });
  
  // Handle shooting events from other players
  socket.on('playerShoot', (data) => {
    // TODO: Implement visual effects for remote shooting
    console.log('Remote player shot:', data);
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
 * Handle a player disconnection
 * @param {THREE.Scene} scene - The ThreeJS scene
 * @param {Object} players - Map of connected players
 * @param {string} playerId - The ID of the disconnected player
 */
export function handlePlayerDisconnect(scene, players, playerId) {
  const remoteRat = players[playerId];
  if (remoteRat) {
    // Remove the rat model from the scene
    scene.remove(remoteRat);
    
    // Remove player from the players map
    delete players[playerId];
  }
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