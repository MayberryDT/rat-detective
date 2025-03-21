// Last updated: 2025-03-20T03:43:34.642Z
import { BoxGeometry, Mesh, MeshPhongMaterial, Vector3, Group } from 'three';
import * as THREE from 'three';

export class SewerMap {
  constructor() {
    this.width = 200;  // Larger map for city layout
    this.length = 200;
    this.buildings = [];
    this.walls = [];
    this.mapGroup = new Group();
  }

  init(scene) {
    // Create base floor
    const floor = this.createFloor();
    this.mapGroup.add(floor);

    // Create outer walls
    this.createWalls();
    this.walls.forEach(wall => this.mapGroup.add(wall));

    // Create buildings
    this.createBuildings();
    this.buildings.forEach(building => this.mapGroup.add(building));

    scene.add(this.mapGroup);
  }

  createFloor() {
    const geometry = new BoxGeometry(this.width, 1, this.length);
    const material = new MeshPhongMaterial({ color: 0x808080 });
    const floor = new Mesh(geometry, material);
    floor.position.y = -0.5;
    floor.name = 'floor';
    floor.userData = {
      isPipeFloor: false,
      isCollider: true,
      colliderType: 'floor'
    };
    return floor;
  }

  createWalls() {
    const wallHeight = 20;
    const wallThickness = 2;
    const material = new MeshPhongMaterial({ color: 0x606060 });

    // North wall
    const northWall = new Mesh(
      new BoxGeometry(this.width + wallThickness * 2, wallHeight, wallThickness),
      material
    );
    northWall.position.set(0, wallHeight / 2, -this.length / 2);
    northWall.name = 'wall';
    northWall.userData = {
      isCollider: true,
      colliderType: 'wall'
    };
    this.walls.push(northWall);

    // South wall
    const southWall = new Mesh(
      new BoxGeometry(this.width + wallThickness * 2, wallHeight, wallThickness),
      material
    );
    southWall.position.set(0, wallHeight / 2, this.length / 2);
    southWall.name = 'wall';
    southWall.userData = {
      isCollider: true,
      colliderType: 'wall'
    };
    this.walls.push(southWall);

    // East wall
    const eastWall = new Mesh(
      new BoxGeometry(wallThickness, wallHeight, this.length + wallThickness * 2),
      material
    );
    eastWall.position.set(this.width / 2, wallHeight / 2, 0);
    eastWall.name = 'wall';
    eastWall.userData = {
      isCollider: true,
      colliderType: 'wall'
    };
    this.walls.push(eastWall);

    // West wall
    const westWall = new Mesh(
      new BoxGeometry(wallThickness, wallHeight, this.length + wallThickness * 2),
      material
    );
    westWall.position.set(-this.width / 2, wallHeight / 2, 0);
    westWall.name = 'wall';
    westWall.userData = {
      isCollider: true,
      colliderType: 'wall'
    };
    this.walls.push(westWall);
  }

  createBuildings() {
    // City grid layout parameters
    const buildingMaterials = [
      new MeshPhongMaterial({ color: 0x505050 }), // Dark gray
      new MeshPhongMaterial({ color: 0x606060 }), // Medium gray
      new MeshPhongMaterial({ color: 0x707070 })  // Light gray
    ];
    
    // Define main streets layout (create a maze-like pattern)
    // These are the main streets that divide the city into blocks
    const mainStreets = [
      // X-axis streets (horizontal on the map)
      { start: new Vector3(-90, 0, -30), end: new Vector3(90, 0, -30), width: 10 },
      { start: new Vector3(-90, 0, 30), end: new Vector3(90, 0, 30), width: 10 },
      
      // Z-axis streets (vertical on the map)
      { start: new Vector3(-60, 0, -90), end: new Vector3(-60, 0, 90), width: 10 },
      { start: new Vector3(-20, 0, -90), end: new Vector3(-20, 0, 90), width: 10 },
      { start: new Vector3(20, 0, -90), end: new Vector3(20, 0, 90), width: 10 },
      { start: new Vector3(60, 0, -90), end: new Vector3(60, 0, 90), width: 10 }
    ];
    
    // Add some diagonal and curved streets for more realism
    const secondaryStreets = [
      // Diagonal streets
      { start: new Vector3(-80, 0, -80), end: new Vector3(-40, 0, -40), width: 8 },
      { start: new Vector3(40, 0, -40), end: new Vector3(80, 0, -80), width: 8 },
      { start: new Vector3(-80, 0, 80), end: new Vector3(-40, 0, 40), width: 8 },
      { start: new Vector3(40, 0, 40), end: new Vector3(80, 0, 80), width: 8 },
      
      // Additional connecting streets
      { start: new Vector3(-50, 0, -10), end: new Vector3(-30, 0, -10), width: 7 },
      { start: new Vector3(30, 0, -10), end: new Vector3(50, 0, -10), width: 7 },
      { start: new Vector3(-50, 0, 10), end: new Vector3(-30, 0, 10), width: 7 },
      { start: new Vector3(30, 0, 10), end: new Vector3(50, 0, 10), width: 7 },
      { start: new Vector3(-10, 0, -50), end: new Vector3(-10, 0, -30), width: 7 },
      { start: new Vector3(-10, 0, 30), end: new Vector3(-10, 0, 50), width: 7 },
      { start: new Vector3(10, 0, -50), end: new Vector3(10, 0, -30), width: 7 },
      { start: new Vector3(10, 0, 30), end: new Vector3(10, 0, 50), width: 7 }
    ];

    // Create buildings of various sizes in the remaining spaces
    const buildings = [
      // Northeast quadrant buildings
      { position: new Vector3(40, 0, -50), size: [15, 25, 15] },
      { position: new Vector3(75, 0, -50), size: [20, 20, 15] },
      { position: new Vector3(40, 0, -80), size: [12, 30, 12] },
      { position: new Vector3(75, 0, -80), size: [18, 15, 15] },
      { position: new Vector3(55, 0, -65), size: [10, 22, 10] },
      { position: new Vector3(25, 0, -65), size: [12, 18, 12] },
      
      // Northwest quadrant buildings
      { position: new Vector3(-40, 0, -50), size: [15, 18, 15] },
      { position: new Vector3(-75, 0, -50), size: [20, 22, 15] },
      { position: new Vector3(-40, 0, -80), size: [12, 25, 12] },
      { position: new Vector3(-75, 0, -80), size: [18, 20, 15] },
      { position: new Vector3(-55, 0, -65), size: [10, 28, 10] },
      { position: new Vector3(-25, 0, -65), size: [12, 24, 12] },
      
      // Southeast quadrant buildings
      { position: new Vector3(40, 0, 50), size: [15, 30, 15] },
      { position: new Vector3(75, 0, 50), size: [20, 15, 15] },
      { position: new Vector3(40, 0, 80), size: [12, 20, 12] },
      { position: new Vector3(75, 0, 80), size: [18, 25, 15] },
      { position: new Vector3(55, 0, 65), size: [10, 35, 10] },
      { position: new Vector3(25, 0, 65), size: [12, 28, 12] },
      
      // Southwest quadrant buildings
      { position: new Vector3(-40, 0, 50), size: [15, 22, 15] },
      { position: new Vector3(-75, 0, 50), size: [20, 18, 15] },
      { position: new Vector3(-40, 0, 80), size: [12, 28, 12] },
      { position: new Vector3(-75, 0, 80), size: [18, 15, 15] },
      { position: new Vector3(-55, 0, 65), size: [10, 32, 10] },
      { position: new Vector3(-25, 0, 65), size: [12, 26, 12] },
      
      // Central area - taller buildings as skyscrapers
      { position: new Vector3(-40, 0, 0), size: [15, 35, 15] },
      { position: new Vector3(40, 0, 0), size: [15, 40, 15] },
      { position: new Vector3(0, 0, -40), size: [15, 45, 15] },
      { position: new Vector3(0, 0, 40), size: [15, 30, 15] },
      { position: new Vector3(-20, 0, -20), size: [12, 38, 12] },
      { position: new Vector3(20, 0, -20), size: [12, 42, 12] },
      { position: new Vector3(-20, 0, 20), size: [12, 36, 12] },
      { position: new Vector3(20, 0, 20), size: [12, 40, 12] },
      
      // Additional buildings scattered around
      { position: new Vector3(-40, 0, -15), size: [10, 20, 10] },
      { position: new Vector3(40, 0, -15), size: [10, 25, 10] },
      { position: new Vector3(-40, 0, 15), size: [10, 15, 10] },
      { position: new Vector3(40, 0, 15), size: [10, 30, 10] },
      { position: new Vector3(-15, 0, -40), size: [10, 22, 10] },
      { position: new Vector3(15, 0, -40), size: [10, 28, 10] },
      { position: new Vector3(-15, 0, 40), size: [10, 18, 10] },
      { position: new Vector3(15, 0, 40), size: [10, 24, 10] },
      
      // New inner ring of buildings
      { position: new Vector3(0, 0, 0), size: [8, 50, 8] },
      { position: new Vector3(-30, 0, -30), size: [10, 32, 10] },
      { position: new Vector3(30, 0, -30), size: [10, 36, 10] },
      { position: new Vector3(-30, 0, 30), size: [10, 34, 10] },
      { position: new Vector3(30, 0, 30), size: [10, 38, 10] },
      
      // Smaller buildings in various locations
      { position: new Vector3(-80, 0, -15), size: [8, 12, 8] },
      { position: new Vector3(80, 0, -15), size: [8, 15, 8] },
      { position: new Vector3(-80, 0, 15), size: [8, 18, 8] },
      { position: new Vector3(80, 0, 15), size: [8, 10, 8] },
      { position: new Vector3(-15, 0, -80), size: [8, 14, 8] },
      { position: new Vector3(15, 0, -80), size: [8, 16, 8] },
      { position: new Vector3(-15, 0, 80), size: [8, 12, 8] },
      { position: new Vector3(15, 0, 80), size: [8, 20, 8] },
      
      // New alleyway buildings
      { position: new Vector3(-60, 0, -35), size: [6, 25, 6] },
      { position: new Vector3(60, 0, -35), size: [6, 28, 6] },
      { position: new Vector3(-60, 0, 35), size: [6, 22, 6] },
      { position: new Vector3(60, 0, 35), size: [6, 30, 6] },
      { position: new Vector3(-35, 0, -60), size: [6, 24, 6] },
      { position: new Vector3(35, 0, -60), size: [6, 26, 6] },
      { position: new Vector3(-35, 0, 60), size: [6, 20, 6] },
      { position: new Vector3(35, 0, 60), size: [6, 32, 6] }
    ];
    
    // Create each building with proper collision data
    buildings.forEach((buildingConfig, index) => {
      const material = buildingMaterials[index % buildingMaterials.length];
      
      // Calculate dimensions
      const [width, height, depth] = buildingConfig.size;
      const { x, z } = buildingConfig.position;
      
      // Create building as a single mesh with collision data
      const building = new Mesh(
        new BoxGeometry(width, height, depth),
        material
      );
      
      // Position the building
      // The y position needs to be half the height so it sits on the ground
      building.position.set(x, height / 2, z);
      building.name = `building-${index}`;
    
      // Add collision data
      building.userData = {
      isCollider: true,
        colliderType: 'wall' // Buildings act like walls for collision
      };
      
      this.buildings.push(building);
    });
  }

  getAllCollisionObjects() {
    // Return all objects that can be collided with
    const collisionObjects = [];
    
    // Add floor
    const floor = this.mapGroup.children.find(child => child.name === 'floor');
    if (floor) collisionObjects.push(floor);
    
    // Add walls
    collisionObjects.push(...this.walls);
    
    // Add buildings
    collisionObjects.push(...this.buildings);
    
    return collisionObjects;
  }

  getBuildings() {
    return this.buildings;
  }

  getRandomSpawnPoint() {
    // Spawn in the center of the city
    return new Vector3(0, 1, 0);
  }
} 