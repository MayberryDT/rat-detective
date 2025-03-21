import { jest } from '@jest/globals';

// Mock ThreeJS
jest.mock('three', () => ({
  Scene: jest.fn(),
  Group: jest.fn(),
  Vector3: jest.fn(() => ({
    copy: jest.fn(),
    set: jest.fn()
  }))
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn()
  }))
}));

// Mock window
global.window = {
  location: {
    origin: 'http://localhost:3000'
  }
};

// Mock alert
global.alert = jest.fn(); 