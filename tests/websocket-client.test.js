import { initMultiplayer, updatePlayerPosition, handlePlayerDisconnect } from '../src/multiplayer';
import * as THREE from 'three';

// Mock THREE Group
jest.mock('three', () => {
  return {
    Group: jest.fn().mockImplementation(() => ({
      position: { x: 0, y: 0, z: 0, copy: jest.fn(), set: jest.fn() },
      rotation: { y: 0, set: jest.fn() },
      children: [],
      add: jest.fn()
    })),
    Scene: jest.fn().mockImplementation(() => ({
      children: [],
      add: jest.fn(),
      remove: jest.fn()
    })),
    Vector3: jest.fn().mockImplementation(() => ({
      x: 0, y: 0, z: 0,
      set: jest.fn(),
      clone: jest.fn().mockReturnThis(),
      multiplyScalar: jest.fn().mockReturnThis()
    })),
    SphereGeometry: jest.fn(),
    MeshPhongMaterial: jest.fn(),
    Mesh: jest.fn().mockImplementation(() => ({
      position: { x: 0, y: 0, z: 0, copy: jest.fn(), set: jest.fn() },
      userData: {},
      name: ''
    }))
  };
});

// Mock the rat.js module
jest.mock('../src/rat.js', () => ({
  createRat: jest.fn(() => {
    const mockTHREE = require('three');
    return new mockTHREE.Group();
  })
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockOn = jest.fn().mockImplementation((event, callback) => {
    // Store callbacks for testing
    if (event === 'playerConnected') {
      mockPlayerConnectedCallback = callback;
    } else if (event === 'playerPositionUpdate') {
      mockPositionUpdateCallback = callback;
    }
    return mockSocketObject;
  });
  
  const mockEmit = jest.fn();
  
  // Create mock socket object
  const mockSocketObject = {
    on: mockOn,
    emit: mockEmit,
    id: 'test-socket-id'
  };
  
  // Export mock socketIO constructor
  return {
    io: jest.fn(() => mockSocketObject)
  };
});

// Store callbacks for testing
let mockPlayerConnectedCallback;
let mockPositionUpdateCallback;

describe('WebSocket Client Tests', () => {
  let scene, localRat;
  
  beforeEach(() => {
    // Reset callback variables
    mockPlayerConnectedCallback = null;
    mockPositionUpdateCallback = null;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock scene and player
    scene = new THREE.Scene();
    localRat = new THREE.Group();
    localRat.position.set(0, 0, 0);
    localRat.rotation.y = 0;
    localRat.health = 100;
    scene.add(localRat);
  });
  
  test('should initialize the multiplayer system', () => {
    // Set env variables to ensure socket code runs
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    // Run the function
    const { socket, players } = initMultiplayer(scene, localRat);
    
    // Socket should be initialized
    expect(socket).toBeDefined();
    expect(socket.id).toBe('test-socket-id');
    
    // Socket event handlers should be registered
    expect(socket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('playerConnected', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('playerDisconnected', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('playerPositionUpdate', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('playerHealthUpdate', expect.any(Function));
    
    // Players map should be initialized
    expect(players).toEqual({});
    
    // Reset env
    process.env.NODE_ENV = originalEnv;
  });
  
  test('should update player position', () => {
    // Mock socket object for test
    const mockSocket = { emit: jest.fn() };
    
    // Create a new position for the local rat
    localRat.position.x = 10;
    localRat.position.y = 5;
    localRat.position.z = 15;
    localRat.rotation.y = 0.5;
    
    // Update the position
    updatePlayerPosition(mockSocket, localRat);
    
    // Socket should emit position update
    expect(mockSocket.emit).toHaveBeenCalledWith('updatePosition', {
      position: { x: 10, y: 5, z: 15 },
      rotation: { y: 0.5 }
    });
  });
  
  test('should add a new remote player when connected', () => {
    // Set env variables to ensure socket code runs
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const { players } = initMultiplayer(scene, localRat);
    
    // Verify callback was stored
    expect(mockPlayerConnectedCallback).toBeDefined();
    
    // Call the callback with a new player ID
    mockPlayerConnectedCallback('new-player-id');
    
    // Players map should contain the new player
    expect(players['new-player-id']).toBeDefined();
    
    // Reset env
    process.env.NODE_ENV = originalEnv;
  });
  
  test('should handle player disconnection', () => {
    // Add a player to the scene
    const remoteRat = new THREE.Group();
    scene.add(remoteRat);
    const players = { 'player-to-disconnect': remoteRat };
    
    // Handle disconnection
    handlePlayerDisconnect(scene, players, 'player-to-disconnect');
    
    // Player should be removed from the players map
    expect(players['player-to-disconnect']).toBeUndefined();
    
    // Scene.remove should have been called
    expect(scene.remove).toHaveBeenCalledWith(remoteRat);
  });
  
  test('should update remote player position', () => {
    // Set env variables to ensure socket code runs
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const { players } = initMultiplayer(scene, localRat);
    
    // Verify callback was stored
    expect(mockPositionUpdateCallback).toBeDefined();
    
    // Add a player to the scene
    const remoteRat = new THREE.Group();
    scene.add(remoteRat);
    players['remote-player-id'] = remoteRat;
    
    // Call the callback with position data
    mockPositionUpdateCallback({
      id: 'remote-player-id',
      position: { x: 20, y: 10, z: 30 },
      rotation: { y: 1.5 }
    });
    
    // Remote player position should be updated
    expect(remoteRat.position.x).toBe(20);
    expect(remoteRat.position.y).toBe(10);
    expect(remoteRat.position.z).toBe(30);
    expect(remoteRat.rotation.y).toBe(1.5);
    
    // Reset env
    process.env.NODE_ENV = originalEnv;
  });
}); 