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
    floor.receiveShadow = true;
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
    
    // Window material (darker than building for contrast)
    const windowMaterial = new MeshPhongMaterial({ 
      color: 0x303030,
      shininess: 0,
      flatShading: true,
      side: THREE.FrontSide
    });

    // Create a single window geometry to be reused
    const windowGeometry = new BoxGeometry(1, 1, 1); // Unit size, will be scaled
    windowGeometry.computeVertexNormals();

    // Create door geometry
    const doorGeometry = new BoxGeometry(1, 1, 1); // Unit size, will be scaled
    doorGeometry.computeVertexNormals();

    // Temporary matrices for instance calculations
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
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
      
      // Create building
      const building = new Mesh(
        new BoxGeometry(width, height, depth),
        material
      );
      
      building.position.set(x, height / 2, z);
      building.name = `building-${index}`;
      building.castShadow = true;
      building.receiveShadow = true;
      
      building.userData = {
        isCollider: true,
        colliderType: 'wall'
      };
      
      this.buildings.push(building);

      // Window parameters
      const windowWidth = Math.min(width * 0.12, 1.2);
      const windowHeight = Math.min(height * 0.08, 1.0);
      const windowDepth = 0.15;
      const doorWidth = Math.min(width * 0.25, 2.0);
      const doorHeight = Math.min(height * 0.3, 2.5);
      const doorDepth = 0.2;

      // Calculate total number of windows needed for this building
      const sides = [
        { axis: 'x', offset: width/2, dir: 1, rotation: -Math.PI/2 },
        { axis: 'x', offset: -width/2, dir: -1, rotation: Math.PI/2 },
        { axis: 'z', offset: depth/2, dir: 1, rotation: Math.PI },
        { axis: 'z', offset: -depth/2, dir: -1, rotation: 0 }
      ];

      // Pre-calculate window count
      let totalWindowCount = 0;
      sides.forEach(side => {
        const faceWidth = side.axis === 'x' ? depth : width;
        const numWindowsHorizontal = Math.max(2, Math.floor(faceWidth / (windowWidth * 1.2)));
        const numWindowsVertical = Math.max(3, Math.floor((height - doorHeight) / (windowHeight * 1.2)));
        totalWindowCount += numWindowsHorizontal * numWindowsVertical;
      });

      // Create instanced mesh with exact count needed
      const buildingWindows = new THREE.InstancedMesh(
        windowGeometry,
        windowMaterial,
        totalWindowCount
      );
      let instanceCount = 0;

      // Process each side
      sides.forEach(side => {
        const faceWidth = side.axis === 'x' ? depth : width;
        const numWindowsHorizontal = Math.max(2, Math.floor(faceWidth / (windowWidth * 1.2)));
        const spacing = Math.min(windowWidth * 1.2, (faceWidth * 0.9) / numWindowsHorizontal);
        const startHeight = height * 0.15;
        const numWindowsVertical = Math.max(3, Math.floor((height - doorHeight) / (windowHeight * 1.2)));
        const verticalSpacing = ((height - doorHeight - startHeight) * 0.9) / (numWindowsVertical - 1);

        // Create windows using instancing
        for (let row = 0; row < numWindowsVertical; row++) {
          for (let col = 0; col < numWindowsHorizontal; col++) {
            const windowX = (col - (numWindowsHorizontal-1)/2) * spacing;
            const windowY = startHeight + row * verticalSpacing;

            // Skip if window would be where door is
            if (side.axis === 'z' && side.offset < 0 && 
                row === 0 && Math.abs(windowX) < doorWidth/2) {
              continue;
            }

            // Skip if window would be outside building bounds
            if (Math.abs(windowX) + windowWidth/2 > faceWidth/2) {
              continue;
            }

            // Set position based on side
            if (side.axis === 'x') {
              position.set(
                side.offset - (windowDepth/2 * side.dir),
                windowY - height/2,
                Math.max(-depth/2 + windowWidth/2, Math.min(depth/2 - windowWidth/2, windowX))
              );
            } else {
              position.set(
                Math.max(-width/2 + windowWidth/2, Math.min(width/2 - windowWidth/2, windowX)),
                windowY - height/2,
                side.offset - (windowDepth/2 * side.dir)
              );
            }

            // Set rotation
            quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side.rotation);

            // Set scale
            scale.set(windowWidth, windowHeight, windowDepth);

            // Create matrix for this instance
            matrix.compose(position, quaternion, scale);

            // Set the matrix for this instance
            buildingWindows.setMatrixAt(instanceCount, matrix);
            instanceCount++;
          }
        }
      });

      // Always add windows, with correct instance count
      buildingWindows.count = instanceCount;
      buildingWindows.instanceMatrix.needsUpdate = true;
      building.add(buildingWindows);

      // Add door (single mesh since there's only one per building)
      const door = new Mesh(doorGeometry, windowMaterial);
      door.scale.set(doorWidth, doorHeight, doorDepth);
      door.position.set(0, -height/2 + doorHeight/2, -depth/2 + doorDepth/2);
      building.add(door);

      // Optimize the building's geometry
      building.updateMatrix();
      building.geometry.computeBoundingSphere();
      building.geometry.computeBoundingBox();
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