// Mock socket.io
jest.mock('socket.io', () => {
  const mockSocketObj = {
    on: jest.fn((event, callback) => {
      if (event === 'connection') {
        // Store the connection callback for later use
        connectionCallback = callback;
      }
      return mockSocketObj;
    }),
    emit: jest.fn(),
    broadcast: {
      emit: jest.fn()
    }
  };
  
  return {
    Server: jest.fn(() => mockSocketObj)
  };
});

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockClientObj = {
    on: jest.fn(),
    emit: jest.fn(),
    id: 'test-client-id',
    disconnect: jest.fn()
  };
  
  return jest.fn(() => mockClientObj);
});

// Mock HTTP createServer
jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((callback) => {
      if (callback) callback();
      return {
        address: jest.fn(() => ({ port: 12345 })),
        close: jest.fn()
      };
    })
  }))
}));

// Import after mocks are defined
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { setupWebSocketServer } = require('../server');

// Store connection callback for tests
let connectionCallback;

// Mock the socket object for the server
const mockSocket = {
  id: 'test-socket-id',
  on: jest.fn(),
  emit: jest.fn(),
  broadcast: {
    emit: jest.fn()
  }
};

describe('WebSocket Server Tests', () => {
  let io, clientSocket;
  let httpServer;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create HTTP server
    httpServer = createServer();
    
    // Create Socket.IO server
    io = new Server(httpServer);
    
    // Apply WebSocket server logic
    setupWebSocketServer(io);
    
    // Start server and get client
    httpServer.listen();
    clientSocket = Client();
    
    // Manually trigger connection callback
    if (connectionCallback) {
      connectionCallback(mockSocket);
    }
  });

  afterEach(() => {
    // Clear mocks and reset callbacks
    connectionCallback = null;
  });

  test('should connect a client to the server', () => {
    // Verify that playerConnected event is emitted on connection
    expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('playerConnected', mockSocket.id);
  });

  test('should assign a unique ID to connected player', () => {
    // Find the getPlayerId handler
    const handlers = mockSocket.on.mock.calls;
    const getPlayerIdHandler = handlers.find(([event]) => event === 'getPlayerId')?.[1];
    
    expect(getPlayerIdHandler).toBeDefined();
    
    // Mock callback
    const callback = jest.fn();
    
    // Call the handler
    getPlayerIdHandler(callback);
    
    // Verify callback was called with socket ID
    expect(callback).toHaveBeenCalledWith(mockSocket.id);
  });

  test('should update player position', () => {
    // Find position update handler
    const handlers = mockSocket.on.mock.calls;
    const updatePositionHandler = handlers.find(([event]) => event === 'updatePosition')?.[1];
    
    expect(updatePositionHandler).toBeDefined();
    
    // Test data
    const testPosition = { x: 10, y: 1, z: 5 };
    const testRotation = { y: 0.5 };
    
    // Call handler
    updatePositionHandler({ position: testPosition, rotation: testRotation });
    
    // Verify broadcast
    expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('playerPositionUpdate', {
      id: mockSocket.id,
      position: testPosition,
      rotation: testRotation
    });
  });

  test('should handle player shooting', () => {
    // Find shooting handler
    const handlers = mockSocket.on.mock.calls;
    const playerShootHandler = handlers.find(([event]) => event === 'playerShoot')?.[1];
    
    expect(playerShootHandler).toBeDefined();
    
    // Test data
    const testData = {
      position: { x: 1, y: 2, z: 3 },
      direction: { x: 0, y: 0, z: -1 }
    };
    
    // Call handler
    playerShootHandler(testData);
    
    // Verify broadcast
    expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('playerShoot', {
      id: mockSocket.id,
      position: testData.position,
      direction: testData.direction
    });
  });

  test('should handle health updates', () => {
    // Find health update handler
    const handlers = mockSocket.on.mock.calls;
    const updateHealthHandler = handlers.find(([event]) => event === 'updateHealth')?.[1];
    
    expect(updateHealthHandler).toBeDefined();
    
    // Test health update
    const testHealth = 75;
    
    // Call handler
    updateHealthHandler({ health: testHealth });
    
    // Verify broadcast
    expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('playerHealthUpdate', {
      id: mockSocket.id,
      health: testHealth
    });
  });
}); 