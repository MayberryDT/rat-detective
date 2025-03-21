const THREE = require('three');

class ServerCollisionSystem {
  constructor() {
    this.collisionDistance = 2.0; // Increased from 1.0 for better collision detection
    this.playerRadius = 1.0; // Player's collision radius
    this.rayDirections = [
      new THREE.Vector3(1, 0, 0),   // Right
      new THREE.Vector3(-1, 0, 0),  // Left
      new THREE.Vector3(0, 0, 1),   // Forward
      new THREE.Vector3(0, 0, -1),  // Backward
      new THREE.Vector3(1, 0, 1).normalize(),   // Diagonal right-forward
      new THREE.Vector3(-1, 0, 1).normalize(),  // Diagonal left-forward
      new THREE.Vector3(1, 0, -1).normalize(),  // Diagonal right-backward
      new THREE.Vector3(-1, 0, -1).normalize()  // Diagonal left-backward
    ];
    this.raycaster = new THREE.Raycaster();
    this.safetyMargin = 0.5; // Added safety margin to prevent wall clipping
  }

  init() {
    console.log('ServerCollisionSystem initialized with collision distance:', this.collisionDistance);
  }

  validatePosition(position, collisionObjects) {
    const adjustedPosition = position.clone();
    let collisionDetected = false;

    // Check collision in all directions
    for (const direction of this.rayDirections) {
      this.raycaster.set(position, direction);
      const intersects = this.raycaster.intersectObjects(collisionObjects, true);

      if (intersects.length > 0) {
        const distance = intersects[0].distance;
        if (distance < this.collisionDistance + this.playerRadius) {
          collisionDetected = true;
          // Calculate the push-back vector
          const pushBack = direction.clone()
            .multiplyScalar(this.collisionDistance + this.playerRadius + this.safetyMargin - distance);
          adjustedPosition.add(pushBack);
        }
      }
    }

    return {
      isValid: !collisionDetected,
      adjustedPosition
    };
  }

  detectWallCollision(position, direction, collisionObjects) {
    this.raycaster.set(position, direction);
    const intersects = this.raycaster.intersectObjects(collisionObjects, true);

    if (intersects.length > 0) {
      const distance = intersects[0].distance;
      return distance < this.collisionDistance + this.playerRadius;
    }

    return false;
  }

  getCollisionObjects(scene) {
    const collisionObjects = [];
    
    // Traverse the scene to find all objects with collision flags
    scene.traverse((object) => {
      if (object.userData && object.userData.isCollider) {
        collisionObjects.push(object);
      }
    });

    return collisionObjects;
  }
}

module.exports = { ServerCollisionSystem }; 