// Last updated: 2025-03-20T03:43:34.639Z
import { Raycaster, Vector3 } from 'three';

export class CollisionSystem {
  constructor(map) {
    this.map = map;
    this.raycaster = new Raycaster();
    this.collisionDistance = 1.0; // Increased from 0.2 to 1.0 for better detection
    this.projectileCollisionDistance = 0.1;
    this.isGrounded = false;
    
    // Initialize debug mode
    this.debugMode = true;  // Set to true to enable detailed logging
    
    console.log('Collision system initialized - DEBUG VERSION 23');
    
    // Store debug stats
    this.stats = {
      totalCollisions: 0,
      wallCollisions: 0,
      floorCollisions: 0,
      pipeCollisions: 0,
      ceilingCollisions: 0,
      rampCollisions: 0,
      projectileCollisions: 0,
      lastCollisionTime: 0,
      lastUpdateTime: 0
    };
  }

  debugLog(message, data = {}) {
    if (this.debugMode) {
      console.log(`[Collision Debug] ${message}`, data);
    }
  }

  checkCollision(position, movement) {
    const result = {
      hasCollision: false,
      adjustedMovement: movement.clone(),
      isGrounded: false
    };

    this.debugLog('Starting collision check', {
      position: position.clone(),
      movement: movement.clone()
    });

    // Add debouncing for collision stats to prevent rapid updates
    const now = Date.now();
    const updateInterval = 500; // Only update stats every 500ms
    const shouldUpdateStats = now - this.stats.lastUpdateTime > updateInterval;
    
    if (shouldUpdateStats) {
      this.stats.lastUpdateTime = now;
    }

    // Check wall collisions FIRST and return early if there's a collision
    const wallCollision = this.checkWallCollisions(position, movement);
    if (wallCollision.hasCollision) {
      result.hasCollision = true;
      result.adjustedMovement.copy(wallCollision.adjustedMovement);
      
      this.debugLog('Wall collision detected', {
        originalMovement: movement.clone(),
        adjustedMovement: result.adjustedMovement.clone(),
        collisionNormal: wallCollision.collisionNormal,
        isPipeCollision: wallCollision.isPipeCollision
      });
      
      if (shouldUpdateStats) {
        if (wallCollision.isPipeCollision) {
          this.stats.pipeCollisions++;
        } else {
          this.stats.wallCollisions++;
        }
        this.stats.totalCollisions++;
      }
      
      return result;  // Return immediately after wall collision
    }

    // Only check ceiling and floor if no wall collision

    // Check for ceiling collisions
    const ceilingCollision = this.checkCeilingCollisions(position, movement);
    if (ceilingCollision.hasCollision) {
      result.hasCollision = true;
      result.adjustedMovement.y = ceilingCollision.adjustedMovement.y;
      
      if (shouldUpdateStats) {
        this.stats.ceilingCollisions++;
      }
    }

    // Check floor collisions last
    const floorCollision = this.checkFloorCollisions(position, movement);
    if (floorCollision.hasCollision) {
      result.hasCollision = true;
      result.adjustedMovement.y = floorCollision.adjustedMovement.y;
      result.isGrounded = true;
      
      if (shouldUpdateStats) {
        this.stats.floorCollisions++;
      }
    }

    if (result.hasCollision && shouldUpdateStats) {
      this.stats.totalCollisions++;
      
      // Update debug info in DOM if available
      if (typeof window !== 'undefined' && document.getElementById('debug-info')) {
        const debugElement = document.getElementById('debug-info');
        debugElement.innerHTML = `
          Version: 23<br>
          Collisions: ${this.stats.totalCollisions}<br>
          Walls: ${this.stats.wallCollisions}<br>
          Floors: ${this.stats.floorCollisions}<br>
          Pipes: ${this.stats.pipeCollisions}<br>
          Ceiling: ${this.stats.ceilingCollisions}<br>
          Ramps: ${this.stats.rampCollisions}<br>
          Projectiles: ${this.stats.projectileCollisions}
        `;
      }
    }

    this.isGrounded = result.isGrounded;
    return result;
  }

  checkCeilingCollisions(position, movement) {
    const result = {
      hasCollision: false,
      adjustedMovement: movement.clone()
    };

    // Only check ceiling collisions if we're moving upward
    if (movement.y <= 0) {
      return result;
    }

    // Get ceiling objects with a simple filter
    const collisionObjects = this.map.getAllCollisionObjects().filter(obj => {
      return (
        obj.userData?.isPipeCeiling === true || 
        obj.userData?.colliderType === 'ceiling' ||
        obj.name?.includes('ceiling')
      );
    });

    if (collisionObjects.length === 0) {
      return result;
    }
    
    // Just use a single ray from the player's head
    const rayOrigin = position.clone().add(new Vector3(0, 1.0, 0));
    const rayDirection = new Vector3(0, 1, 0);
    
    // Check for ceiling collision
    this.raycaster.set(rayOrigin, rayDirection);
    const intersects = this.raycaster.intersectObjects(collisionObjects, false);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      
      // Only register collisions when very close (0.5 units)
      if (hit.distance < 0.5) {
        result.hasCollision = true;
        result.adjustedMovement.y = 0; // Stop upward motion
      }
    }

    return result;
  }

  checkWallCollisions(position, movement) {
    const result = {
      hasCollision: false,
      adjustedMovement: movement.clone(),
      isPipeCollision: false,
      collisionNormal: null
    };

    this.debugLog('Checking wall collisions', {
      position: position.clone(),
      movement: movement.clone(),
      collisionDistance: this.collisionDistance
    });

    // Get potential wall objects with a simpler filter
    const collisionObjects = this.map.getAllCollisionObjects().filter(obj => {
      return (
        obj.userData?.isPipeSide === true || 
        obj.userData?.colliderType === 'wall' ||
        obj.name?.includes('wall')
      );
    });

    this.debugLog('Found wall objects', {
      count: collisionObjects.length
    });

    // Cast rays at multiple heights
    const rayHeights = [0.3, 0.9, 1.5]; // Lower, middle, and upper body
    
    // Cast rays in multiple directions to catch walls we might be inside of
    const rayDirections = [
      movement.clone().normalize(), // Movement direction
      new Vector3(1, 0, 0),  // Right
      new Vector3(-1, 0, 0), // Left
      new Vector3(0, 0, 1),  // Forward
      new Vector3(0, 0, -1), // Back
      new Vector3(1, 0, 1).normalize(),  // Forward-Right
      new Vector3(-1, 0, 1).normalize(), // Forward-Left
      new Vector3(1, 0, -1).normalize(), // Back-Right
      new Vector3(-1, 0, -1).normalize() // Back-Left
    ];

    let closestHit = null;
    let minDistance = Infinity;

    for (const height of rayHeights) {
      for (const direction of rayDirections) {
        const rayStart = position.clone().add(new Vector3(0, height, 0));
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
            
            this.debugLog('Found potential collision', {
              height,
              direction: direction.clone(),
              distance: hit.distance,
              objectName: hit.object.name,
              objectType: hit.object.userData?.colliderType
            });
          }
        }
      }
    }

    if (closestHit) {
      result.hasCollision = true;
      result.isPipeCollision = closestHit.object.userData?.isPipeSide || 
                              closestHit.object.name?.includes('pipe');
      
      // Get the collision normal and ensure it's properly oriented in world space
      const normal = closestHit.face.normal.clone();
      normal.transformDirection(closestHit.object.matrixWorld);
      result.collisionNormal = normal;
      
      this.debugLog('Processing collision response', {
        collisionNormal: normal.clone(),
        distance: minDistance,
        objectName: closestHit.object.name
      });
      
      // Calculate the pushback direction (away from wall)
      const pushbackDistance = this.collisionDistance - minDistance;
      const pushback = normal.multiplyScalar(pushbackDistance);
      
      // First push back from wall
      result.adjustedMovement.add(pushback);
      
      // Then calculate sliding
      const dot = movement.dot(normal);
      if (dot < 0) {
        const slide = movement.clone().sub(normal.multiplyScalar(dot));
        const friction = 0.8;
        
        // Apply sliding while maintaining pushback
        result.adjustedMovement.add(slide.multiplyScalar(friction));
        
        this.debugLog('Calculated response', {
          pushback: pushback.clone(),
          slide: slide.clone(),
          finalAdjustedMovement: result.adjustedMovement.clone()
        });
      }
    }

    return result;
  }

  checkFloorCollisions(position, movement) {
    const result = {
      hasCollision: false,
      adjustedMovement: movement.clone(),
      isGrounded: false
    };

    // Make sure to include the floor, which is in the mapGroup but might not be returned by getAllCollisionObjects
    const floor = this.map.mapGroup.children.find(obj => obj.name === 'floor');
    
    // Get ramps and floors separately for specialized handling
    const ramps = this.map.getAllCollisionObjects().filter(obj => 
      obj.name?.includes('ramp')
    );
    
    const floors = [
      floor, // Explicitly include the main floor
      ...this.map.getAllCollisionObjects().filter(obj => {
        return (
          obj.userData?.isPipeFloor === true || 
          obj.userData?.colliderType === 'floor' ||
          obj.name?.includes('floor') ||
          obj.name?.includes('platform')
        );
      })
    ].filter(obj => obj); // Filter out any undefined objects

    // Cast rays for ramp detection
    const rayOrigins = [];
    // Use a grid pattern for better ramp collision
    for (let x = -0.3; x <= 0.3; x += 0.2) {
      for (let z = -0.3; z <= 0.3; z += 0.2) {
        rayOrigins.push(position.clone().add(new Vector3(x, 0.2, z)));
      }
    }
    
    // For moving up ramps, add forward-facing rays based on movement direction
    let moveDir = null;
    if (Math.abs(movement.x) > 0.01 || Math.abs(movement.z) > 0.01) {
      moveDir = new Vector3(movement.x, 0, movement.z).normalize();
      // Add rays forward of the player at different heights for ramp detection
      for (let h = 0.1; h <= 0.5; h += 0.1) {
        for (let d = 0.2; d <= 0.6; d += 0.2) {
          rayOrigins.push(position.clone().add(moveDir.clone().multiplyScalar(d)).add(new Vector3(0, h, 0)));
        }
      }
    }
    
    const rayDirection = new Vector3(0, -1, 0);

    // First check ramps with proper slope handling
    let onRamp = false;
    let rampNormal = null;
    let rampPoint = null;
    let lowestRampDistance = Infinity;
    
    // Find the ramp collision points
    const rampCollisions = [];
    
    for (const rayOrigin of rayOrigins) {
      this.raycaster.set(rayOrigin, rayDirection);
      const intersects = this.raycaster.intersectObjects(ramps, false);
      
      if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.distance < 1.8) { // Higher threshold for ramps
          rampCollisions.push({
            point: hit.point,
            normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld),
            distance: hit.distance
          });
          
          // Track the lowest (closest to ground) ramp point
          if (hit.distance < lowestRampDistance) {
            lowestRampDistance = hit.distance;
            rampPoint = hit.point;
            rampNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
          }
          onRamp = true;
        }
      }
    }
    
    if (onRamp && rampNormal && moveDir) {
      result.hasCollision = true;
      result.isGrounded = true;
      
      // Calculate the angle between the ramp normal and up vector
      const up = new Vector3(0, 1, 0);
      const angle = rampNormal.angleTo(up);
      
      // Project movement onto ramp surface
      const horizontalMovement = new Vector3(movement.x, 0, movement.z);
      const horizontalSpeed = horizontalMovement.length();
      
      if (horizontalSpeed > 0) {
        // Calculate how much we need to move up based on the ramp angle
        const verticalAdjustment = Math.tan(angle) * horizontalSpeed;
        
        // Project movement along ramp surface
        result.adjustedMovement.y = Math.max(verticalAdjustment, movement.y);
        
        // If moving down, allow downward movement
        if (movement.y < 0) {
          result.adjustedMovement.y = movement.y;
        }
        
        // Slightly reduce horizontal speed when moving up ramps
        const speedMultiplier = 1 - (angle / (Math.PI * 0.5)) * 0.3;
        result.adjustedMovement.x *= speedMultiplier;
        result.adjustedMovement.z *= speedMultiplier;
      } else if (movement.y < 0) {
        // If only moving down, follow ramp surface
        result.adjustedMovement.y = 0;
      }
      
      // For stats tracking
      this.stats.rampCollisions++;
      return result;
    }

    // Then check regular floors
    let minDistance = Infinity;
    let hitObject = null;

    for (const rayOrigin of rayOrigins) {
      this.raycaster.set(rayOrigin, rayDirection);
      const intersects = this.raycaster.intersectObjects(floors, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        
        if (hit.distance < minDistance) {
          minDistance = hit.distance;
          hitObject = hit.object;
        }
      }
    }

    if (hitObject && minDistance < 1.2) {
      result.hasCollision = true;
      result.isGrounded = true;
      
      // If moving downward, stop vertical movement
      if (movement.y < 0) {
        result.adjustedMovement.y = 0;
      }
    }

    return result;
  }

  checkProjectileCollision(position, movement) {
    const result = {
      hasCollision: false,
      adjustedMovement: movement.clone(),
      collisionPoint: null,
      collisionNormal: null
    };

    // Get potential wall objects
    const collisionObjects = this.map.getAllCollisionObjects().filter(obj => {
      return (
        obj.userData?.isPipeSide === true || 
        obj.userData?.colliderType === 'wall' ||
        obj.name?.includes('wall')
      );
    });

    // For projectiles, we use a single precise ray
    const direction = movement.clone().normalize();
    
    // Set up the ray starting slightly behind the current position to avoid self-collisions
    const rayStart = position.clone().sub(direction.multiplyScalar(0.05));
    this.raycaster.set(rayStart, direction);
    
    // Get all intersections
    const intersects = this.raycaster.intersectObjects(collisionObjects, false);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      
      // Skip end caps
      if (hit.object.userData?.isEndCap) {
        return result;
      }
      
      // Check if the collision is within our movement distance
      const movementLength = movement.length();
      if (hit.distance <= movementLength + this.projectileCollisionDistance) {
        result.hasCollision = true;
        result.collisionPoint = hit.point;
        
        // Get the collision normal
        const normal = hit.face.normal.clone();
        normal.transformDirection(hit.object.matrixWorld);
        result.collisionNormal = normal;
        
        // Adjust movement to stop at collision point
        result.adjustedMovement.copy(direction.multiplyScalar(hit.distance - this.projectileCollisionDistance));
        
        // Update stats
        this.stats.projectileCollisions++;
      }
    }

    return result;
  }

  isPlayerGrounded() {
    return this.isGrounded;
  }
} 