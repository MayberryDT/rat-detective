import { setupWebSocketServer } from '../server.js';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

describe('Multiplayer Scaling Tests', () => {
  let io, serverSocket, clientSockets = [], httpServer;
  const PORT = 3001;
  const TOTAL_PLAYERS = 50;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      wsEngine: WebSocketServer
    });
    setupWebSocketServer(io);
    httpServer.listen(PORT, () => {
      // Create 50 client sockets
      const connectPromises = Array(TOTAL_PLAYERS).fill().map(() => {
        return new Promise((resolve) => {
          const clientSocket = Client(`http://localhost:${PORT}`, {
            transports: ['websocket'],
            forceNew: true
          });
          clientSocket.on('connect', () => {
            clientSockets.push(clientSocket);
            resolve();
          });
        });
      });
      
      Promise.all(connectPromises).then(() => done());
    });
  });

  afterAll(() => {
    clientSockets.forEach(socket => socket.close());
    io.close();
    httpServer.close();
  });

  test('should handle 50 players connecting simultaneously', (done) => {
    expect(clientSockets.length).toBe(TOTAL_PLAYERS);
    done();
  });

  test('should broadcast position updates to all players efficiently', (done) => {
    let updateCount = 0;
    const expectedUpdates = TOTAL_PLAYERS - 1; // Each player should receive updates from all others

    // Setup listener on first client
    clientSockets[0].on('playerPositionUpdate', (data) => {
      updateCount++;
      if (updateCount === expectedUpdates) {
        expect(updateCount).toBe(expectedUpdates);
        done();
      }
    });

    // Have all other clients send position updates
    clientSockets.slice(1).forEach(socket => {
      socket.emit('updatePosition', {
        position: { x: Math.random(), y: Math.random(), z: Math.random() },
        rotation: { y: Math.random() }
      });
    });
  }, 5000);

  test('should handle player disconnections gracefully', (done) => {
    let disconnectCount = 0;
    const expectedDisconnects = 5; // Test with 5 disconnections

    // Setup disconnect listeners on remaining players
    clientSockets.slice(expectedDisconnects).forEach(socket => {
      socket.on('playerDisconnected', () => {
        disconnectCount++;
        if (disconnectCount === expectedDisconnects) {
          expect(disconnectCount).toBe(expectedDisconnects);
          done();
        }
      });
    });

    // Disconnect 5 players
    clientSockets.slice(0, expectedDisconnects).forEach(socket => {
      socket.close();
    });
  });

  test('should maintain consistent game state across all players', (done) => {
    const testPlayer = clientSockets[10];
    let stateUpdateCount = 0;
    const expectedUpdates = clientSockets.length - 11; // All remaining players should receive update

    clientSockets.slice(11).forEach(socket => {
      socket.on('playerHealthUpdate', (data) => {
        expect(data.health).toBe(50);
        stateUpdateCount++;
        if (stateUpdateCount === expectedUpdates) {
          done();
        }
      });
    });

    testPlayer.emit('updateHealth', { health: 50 });
  });
}); 