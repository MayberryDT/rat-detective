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

    // Create buildings and sewer environment
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
    const buildingMaterial = new MeshPhongMaterial({ color: 0x404040 });
    
    // Central buildings
    const centralBuildings = [
      { size: [30, 20, 30], pos: [0, 10, 0], name: 'centralTower' },
      { size: [20, 15, 20], pos: [0, 7, 20], name: 'northTower' },
      { size: [20, 15, 20], pos: [0, 7, -20], name: 'southTower' },
      { size: [20, 15, 20], pos: [20, 7, 0], name: 'eastTower' },
      { size: [20, 15, 20], pos: [-20, 7, 0], name: 'westTower' }
    ];

    // Corner buildings
    const cornerBuildings = [
      { size: [15, 12, 15], pos: [40, 6, 40], name: 'northEastCorner' },
      { size: [15, 12, 15], pos: [-40, 6, 40], name: 'northWestCorner' },
      { size: [15, 12, 15], pos: [40, 6, -40], name: 'southEastCorner' },
      { size: [15, 12, 15], pos: [-40, 6, -40], name: 'southWestCorner' }
    ];

    // Mid-side buildings
    const midSideBuildings = [
      { size: [15, 10, 15], pos: [0, 5, 40], name: 'northMid' },
      { size: [15, 10, 15], pos: [0, 5, -40], name: 'southMid' },
      { size: [15, 10, 15], pos: [40, 5, 0], name: 'eastMid' },
      { size: [15, 10, 15], pos: [-40, 5, 0], name: 'westMid' }
    ];

    // Create all buildings
    [...centralBuildings, ...cornerBuildings, ...midSideBuildings].forEach(building => {
      const mesh = new Mesh(
        new BoxGeometry(...building.size),
        buildingMaterial
      );
      mesh.position.set(...building.pos);
      mesh.name = building.name;
      mesh.userData = {
        isCollider: true,
        colliderType: 'building'
      };
      this.buildings.push(mesh);
    });

    // Add sewer pipes and tunnels
    const pipeMaterial = new MeshPhongMaterial({ color: 0x808080 });
    
    // Horizontal pipes
    for (let x = -80; x <= 80; x += 40) {
      const pipe = new Mesh(
        new BoxGeometry(100, 2, 2),
        pipeMaterial
      );
      pipe.position.set(x, 1, 0);
      pipe.name = `horizontalPipe_${x}`;
      pipe.userData = {
        isCollider: true,
        colliderType: 'pipe'
      };
      this.buildings.push(pipe);
    }

    // Vertical pipes
    for (let z = -80; z <= 80; z += 40) {
      const pipe = new Mesh(
        new BoxGeometry(2, 2, 100),
        pipeMaterial
      );
      pipe.position.set(0, 1, z);
      pipe.name = `verticalPipe_${z}`;
      pipe.userData = {
        isCollider: true,
        colliderType: 'pipe'
      };
      this.buildings.push(pipe);
    }

    // Add some smaller obstacles and cover
    const obstacleMaterial = new MeshPhongMaterial({ color: 0x606060 });
    const obstacles = [
      { size: [5, 3, 5], pos: [10, 1.5, 10], name: 'obstacle1' },
      { size: [5, 3, 5], pos: [-10, 1.5, 10], name: 'obstacle2' },
      { size: [5, 3, 5], pos: [10, 1.5, -10], name: 'obstacle3' },
      { size: [5, 3, 5], pos: [-10, 1.5, -10], name: 'obstacle4' }
    ];

    obstacles.forEach(obstacle => {
      const mesh = new Mesh(
        new BoxGeometry(...obstacle.size),
        obstacleMaterial
      );
      mesh.position.set(...obstacle.pos);
      mesh.name = obstacle.name;
      mesh.userData = {
        isCollider: true,
        colliderType: 'obstacle'
      };
      this.buildings.push(mesh);
    });
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