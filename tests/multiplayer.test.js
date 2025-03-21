import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from '../server.js';

describe('Multiplayer Scaling Tests', () => {
  let io, serverSocket, clientSockets = [], httpServer;
  const PORT = 3001;
  const MAX_PLAYERS = 20;
  const CULLING_DISTANCE = 100;

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
      done();
    });
  });

  afterAll(() => {
    clientSockets.forEach(socket => socket.close());
    io.close();
    httpServer.close();
  });

  beforeEach(() => {
    clientSockets = [];
  });

  test('should handle 20 players connecting simultaneously', async () => {
    // Connect 20 players
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const socket = Client(`http://localhost:${PORT}`, {
        transports: ['websocket'],
        forceNew: true
      });
      await new Promise(resolve => socket.on('connect', resolve));
      clientSockets.push(socket);
    }
    expect(clientSockets.length).toBe(MAX_PLAYERS);
  });

  test('should reject connections beyond 20 players', (done) => {
    // Try to connect a 21st player
    const extraSocket = Client(`http://localhost:${PORT}`, {
      transports: ['websocket'],
      forceNew: true
    });

    extraSocket.on('serverFull', () => {
      extraSocket.close();
      done();
    });
  });

  test('should handle dynamic join/leave', async () => {
    // Connect 10 initial players
    for (let i = 0; i < 10; i++) {
      const socket = Client(`http://localhost:${PORT}`, {
        transports: ['websocket'],
        forceNew: true
      });
      await new Promise(resolve => socket.on('connect', resolve));
      clientSockets.push(socket);
    }

    // Disconnect 5 players
    for (let i = 0; i < 5; i++) {
      clientSockets[i].close();
    }
    clientSockets = clientSockets.slice(5);

    // Connect 5 new players
    for (let i = 0; i < 5; i++) {
      const socket = Client(`http://localhost:${PORT}`, {
        transports: ['websocket'],
        forceNew: true
      });
      await new Promise(resolve => socket.on('connect', resolve));
      clientSockets.push(socket);
    }

    expect(clientSockets.length).toBe(10);
  });

  test('should only send updates to nearby players within culling distance', (done) => {
    let nearbyUpdates = 0;
    let farUpdates = 0;

    // Create two players
    const player1 = Client(`http://localhost:${PORT}`, {
      transports: ['websocket'],
      forceNew: true
    });
    const player2 = Client(`http://localhost:${PORT}`, {
      transports: ['websocket'],
      forceNew: true
    });

    player1.on('connect', () => {
      player2.on('connect', () => {
        // Position updates for nearby player
        player1.emit('updatePosition', {
          position: { x: 0, y: 0, z: 0 },
          rotation: { y: 0 }
        });

        // Position updates for far player
        player1.emit('updatePosition', {
          position: { x: CULLING_DISTANCE * 2, y: 0, z: CULLING_DISTANCE * 2 },
          rotation: { y: 0 }
        });

        player2.on('playerPositionUpdate', (data) => {
          const dx = data.position.x;
          const dz = data.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance <= CULLING_DISTANCE) {
            nearbyUpdates++;
          } else {
            farUpdates++;
          }

          if (nearbyUpdates === 1 && farUpdates === 0) {
            player1.close();
            player2.close();
            done();
          }
        });
      });
    });
  });
}); 