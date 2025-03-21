const { BoxGeometry, Mesh, MeshPhongMaterial, Vector3, Group } = require('three');
const THREE = require('three');

class ServerMap {
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
      new BoxGeometry(this.width, wallHeight, wallThickness),
      material
    );
    northWall.position.set(0, wallHeight / 2 - 0.5, -this.length / 2);
    northWall.name = 'northWall';
    northWall.userData = {
      isCollider: true,
      colliderType: 'wall'
    };
    this.walls.push(northWall);

    // South wall
    const southWall = new Mesh(
      new BoxGeometry(this.width, wallHeight, wallThickness),
      material
    );
    southWall.position.set(0, wallHeight / 2 - 0.5, this.length / 2);
    southWall.name = 'southWall';
    southWall.userData = {
      isCollider: true,
      colliderType: 'wall'
    };
    this.walls.push(southWall);

    // East wall
    const eastWall = new Mesh(
      new BoxGeometry(wallThickness, wallHeight, this.length),
      material
    );
    eastWall.position.set(this.width / 2, wallHeight / 2 - 0.5, 0);
    eastWall.name = 'eastWall';
    eastWall.userData = {
      isCollider: true,
      colliderType: 'wall'
    };
    this.walls.push(eastWall);

    // West wall
    const westWall = new Mesh(
      new BoxGeometry(wallThickness, wallHeight, this.length),
      material
    );
    westWall.position.set(-this.width / 2, wallHeight / 2 - 0.5, 0);
    westWall.name = 'westWall';
    westWall.userData = {
      isCollider: true,
      colliderType: 'wall'
    };
    this.walls.push(westWall);
  }

  createBuildings() {
    // Create some buildings for cover
    const buildingMaterial = new MeshPhongMaterial({ color: 0x404040 });
    
    // Building 1
    const building1 = new Mesh(
      new BoxGeometry(20, 15, 20),
      buildingMaterial
    );
    building1.position.set(30, 7, 30);
    building1.name = 'building1';
    building1.userData = {
      isCollider: true,
      colliderType: 'building'
    };
    this.buildings.push(building1);

    // Building 2
    const building2 = new Mesh(
      new BoxGeometry(20, 15, 20),
      buildingMaterial
    );
    building2.position.set(-30, 7, -30);
    building2.name = 'building2';
    building2.userData = {
      isCollider: true,
      colliderType: 'building'
    };
    this.buildings.push(building2);

    // Building 3
    const building3 = new Mesh(
      new BoxGeometry(20, 15, 20),
      buildingMaterial
    );
    building3.position.set(30, 7, -30);
    building3.name = 'building3';
    building3.userData = {
      isCollider: true,
      colliderType: 'building'
    };
    this.buildings.push(building3);

    // Building 4
    const building4 = new Mesh(
      new BoxGeometry(20, 15, 20),
      buildingMaterial
    );
    building4.position.set(-30, 7, 30);
    building4.name = 'building4';
    building4.userData = {
      isCollider: true,
      colliderType: 'building'
    };
    this.buildings.push(building4);
  }

  getAllCollisionObjects() {
    return [...this.walls, ...this.buildings];
  }

  getBuildings() {
    return this.buildings;
  }

  getRandomSpawnPoint() {
    const x = (Math.random() - 0.5) * (this.width - 40);
    const z = (Math.random() - 0.5) * (this.length - 40);
    return new Vector3(x, 1, z);
  }
}

function createMap() {
  return new ServerMap();
}

module.exports = { createMap }; 