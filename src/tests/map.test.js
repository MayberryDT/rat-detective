import { Scene, Vector3 } from 'three';
import { SewerMap } from '../map';
import { CollisionSystem } from '../collision';

describe('SewerMap', () => {
  let map;
  let scene;
  
  beforeEach(() => {
    map = new SewerMap();
    scene = new Scene();
    // Mock the mapGroup.add method to prevent actual ThreeJS operations
    map.mapGroup = {
      add: jest.fn(),
      children: []
    };
  });

  test('creates a multi-level sewer map', () => {
    map.init(scene);
    
    // Test map dimensions
    expect(map.getWidth()).toBeGreaterThan(100); // At least 100 units wide
    expect(map.getLength()).toBeGreaterThan(100); // At least 100 units long
    expect(map.getLevels()).toBeGreaterThanOrEqual(3); // At least 3 levels
    
    // Test map elements
    expect(map.getPlatforms().length).toBeGreaterThan(0);
    expect(map.getTunnels().length).toBeGreaterThan(0);
    expect(map.getSpawnPoints().length).toBeGreaterThanOrEqual(50); // Support for 50 players
  });

  test('provides valid spawn points', () => {
    map.init(scene);
    
    const spawnPoint = map.getRandomSpawnPoint();
    expect(spawnPoint).toBeInstanceOf(Vector3);
    expect(spawnPoint.y).toBeGreaterThan(0); // Above ground level
  });

  test('should correctly create pipes with proper structure', () => {
    // Call the pipe creation method
    map.createPipes();
    
    // Verify that pipes were created
    expect(map.pipes.length).toBeGreaterThan(0);
    
    // Verify each pipe has the isPipeWall flag
    map.pipes.forEach(pipe => {
      expect(pipe.userData.isPipeWall).toBe(true);
    });
  });

  test('should expose the getPlatforms and getRamps methods', () => {
    // Verify methods exist
    expect(typeof map.getPlatforms).toBe('function');
    expect(typeof map.getRamps).toBe('function');
    
    // Test method returns
    expect(Array.isArray(map.getPlatforms())).toBe(true);
    expect(Array.isArray(map.getRamps())).toBe(true);
  });

  test('init method should add all elements to the scene', () => {
    // Replace mapGroup.add with a spy
    const addSpy = jest.spyOn(map.mapGroup, 'add');
    
    // Setup floor mock
    const floorMock = { position: { y: -0.5 }, name: 'floor' };
    jest.spyOn(map, 'createFloor').mockReturnValue(floorMock);
    
    // Mock other creation methods to prevent actual creation
    jest.spyOn(map, 'createWalls').mockImplementation(() => {});
    jest.spyOn(map, 'createPlatforms').mockImplementation(() => {});
    jest.spyOn(map, 'createRamps').mockImplementation(() => {});
    jest.spyOn(map, 'createPipes').mockImplementation(() => {});
    
    // Call init
    map.init(scene);
    
    // Verify that scene.add was called with mapGroup
    expect(scene.children.length).toBe(1);
    expect(scene.children[0]).toBe(map.mapGroup);
    
    // Verify floor was added to mapGroup
    expect(addSpy).toHaveBeenCalledWith(floorMock);
  });
});

describe('CollisionSystem', () => {
  let collisionSystem;
  let map;
  
  beforeEach(() => {
    map = new SewerMap();
    const scene = new Scene();
    map.init(scene);
    collisionSystem = new CollisionSystem(map);
  });

  test('detects wall collisions', () => {
    const playerPosition = new Vector3(0, 1, 0);
    const movement = new Vector3(map.getWidth() / 2 + 1, 0, 0); // Move past the map's center to hit a wall
    
    // Force the player to be at the center
    map.mapGroup.position.set(-map.getWidth() / 4, 0, 0);
    
    const collision = collisionSystem.checkCollision(playerPosition, movement);
    expect(collision.hasCollision).toBe(true);
    expect(collision.adjustedMovement).toBeDefined();
  });

  test('allows valid movement', () => {
    const playerPosition = new Vector3(0, 1, 0);
    const movement = new Vector3(0, 0, 1); // Move in open space
    
    const collision = collisionSystem.checkCollision(playerPosition, movement);
    expect(collision.hasCollision).toBe(false);
    expect(collision.adjustedMovement).toEqual(movement);
  });

  test('prevents falling through floors', () => {
    const playerPosition = new Vector3(0, 1, 0);
    const movement = new Vector3(0, -2, 0); // Try to fall through floor
    
    const collision = collisionSystem.checkCollision(playerPosition, movement);
    expect(collision.hasCollision).toBe(true);
    expect(collision.adjustedMovement.y).toBeGreaterThan(-1);
  });

  test('allows jumping onto platforms', () => {
    const playerPosition = new Vector3(0, 1, 0);
    const platform = map.getPlatforms()[0];
    const jumpMovement = new Vector3(
      platform.position.x - playerPosition.x,
      platform.position.y - playerPosition.y + 1, // +1 to land on top
      platform.position.z - playerPosition.z
    );
    
    const collision = collisionSystem.checkCollision(playerPosition, jumpMovement);
    expect(collision.hasCollision).toBe(false);
  });
}); 