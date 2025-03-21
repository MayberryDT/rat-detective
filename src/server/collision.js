import * as THREE from 'three';

export class ServerCollisionSystem {
  constructor(map) {
    this.map = map;
    this.raycaster = new THREE.Raycaster();
    this.collisionDistance = 1.0; // Match client-side collision distance
    console.log('ServerCollisionSystem initialized with collision distance:', this.collisionDistance);
  }

  validatePosition(position, movement) {
    const result = {
      isValid: true,
      adjustedPosition: position.clone(),
      reason: null
    };

    // Skip validation if no movement
    if (movement.length() < 0.001) {
      return result;
    }

    // Get potential wall objects
    const collisionObjects = this.map.getAllCollisionObjects().filter(obj => {
      const isCollider = (
        obj.userData?.isPipeSide === true || 
        obj.userData?.colliderType === 'wall' ||
        obj.name?.includes('wall') ||
        obj.name?.includes('pipe')
      );
      if (isCollider) {
        console.log('Found collision object:', obj.name, obj.userData);
      }
      return isCollider;
    });

    console.log('Found collision objects:', collisionObjects.length);
    if (collisionObjects.length === 0) {
      console.warn('No collision objects found! This might be why walls are not working.');
    }

    // Cast rays at multiple heights
    const rayHeights = [0.3, 0.9, 1.5]; // Lower, middle, and upper body
    
    // Cast rays in multiple directions to catch walls we might be inside of
    const rayDirections = [
      movement.clone().normalize(), // Movement direction
      new THREE.Vector3(1, 0, 0),  // Right
      new THREE.Vector3(-1, 0, 0), // Left
      new THREE.Vector3(0, 0, 1),  // Forward
      new THREE.Vector3(0, 0, -1), // Back
      new THREE.Vector3(1, 0, 1).normalize(),  // Forward-Right
      new THREE.Vector3(-1, 0, 1).normalize(), // Forward-Left
      new THREE.Vector3(1, 0, -1).normalize(), // Back-Right
      new THREE.Vector3(-1, 0, -1).normalize() // Back-Left
    ];

    let closestHit = null;
    let minDistance = Infinity;

    for (const height of rayHeights) {
      for (const direction of rayDirections) {
        const rayStart = position.clone().add(new THREE.Vector3(0, height, 0));
        this.raycaster.set(rayStart, direction);
        
        const intersects = this.raycaster.intersectObjects(collisionObjects, false);
        
        if (intersects.length > 0) {
          const hit = intersects[0];
          
          // Skip end caps
          if (hit.object.userData?.isEndCap) {
            continue;
          }
          
          // Check if this is the closest hit
          if (hit.distance < minDistance && hit.distance < this.collisionDistance) {
            minDistance = hit.distance;
            closestHit = hit;
            console.log('Found closer hit:', {
              distance: hit.distance,
              object: hit.object.name,
              point: hit.point
            });
          }
        }
      }
    }

    if (closestHit) {
      result.isValid = false;
      result.reason = 'wall_collision';
      
      // Get the collision normal
      const normal = closestHit.face.normal.clone();
      normal.transformDirection(closestHit.object.matrixWorld);
      
      // Calculate the pushback direction (away from wall)
      const pushbackDistance = this.collisionDistance - minDistance;
      const pushback = normal.multiplyScalar(pushbackDistance);
      
      // Adjust position to prevent wall clipping
      result.adjustedPosition.add(pushback);
      
      console.log('Wall collision detected:', {
        originalPosition: position,
        adjustedPosition: result.adjustedPosition,
        pushback: pushback,
        normal: normal
      });
    }

    return result;
  }
} 