// Last updated: 2025-03-20T03:43:34.644Z
import * as THREE from 'three';
import { createRat } from './rat.js';
import { CollisionSystem } from './collision.js';
import { fireCheeseGun } from './combat.js';
import { debugLog, DEBUG_CATEGORIES } from './debug.js';
import { SOUND_EFFECTS } from './game/AudioSetup.js';

// Export movement patterns for external use
export const MOVEMENT_PATTERNS = {
    PATROL: 'patrol',   // Back and forth in a line
    CIRCLE: 'circle',   // Move in a circle
    RANDOM: 'random',   // Random movement
    STATIONARY: 'stationary' // Doesn't move
};

// NPC properties
const NPC_COUNT = 20; // Increased from 5 to 20
const NPC_HEALTH = 100; // Changed from 30 to 100 to make percentages clearer
const NPC_MOVEMENT_SPEED = 0.02;
const NPC_DETECTION_RADIUS = 5;
const NPC_HITBOX_WIDTH = 0.7;  // Matches trench coat width
const NPC_HITBOX_HEIGHT = 1.2; // Matches full height
const NPC_HITBOX_DEPTH = 0.5;  // Matches coat depth
const NPC_FIRE_RATE = 1000; // One shot per second

// Store last fire times for NPCs
const npcLastFireTimes = new Map();

// Add at the top of the file after imports
const usedSpawnPositions = new Set();

// Add scene initialization tracking
let isSceneInitialized = false;

// Define spawn zones at module scope
const spawnZones = [
    // Main street intersections with smaller radius to prevent bunching
    { x: -60, z: -30, radius: 2.5 },
    { x: -20, z: -30, radius: 2.5 },
    { x: 20, z: -30, radius: 2.5 },
    { x: 60, z: -30, radius: 2.5 },
    { x: -60, z: 30, radius: 2.5 },
    { x: -20, z: 30, radius: 2.5 },
    { x: 20, z: 30, radius: 2.5 },
    { x: 60, z: 30, radius: 2.5 },
    
    // Street segments with smaller radius
    { x: -40, z: -30, radius: 2 },
    { x: 0, z: -30, radius: 2 },
    { x: 40, z: -30, radius: 2 },
    { x: -40, z: 30, radius: 2 },
    { x: 0, z: 30, radius: 2 },
    { x: 40, z: 30, radius: 2 },
    
    // Vertical streets with distributed points
    { x: -60, z: -15, radius: 2 },
    { x: -60, z: 0, radius: 2 },
    { x: -60, z: 15, radius: 2 },
    { x: -20, z: -15, radius: 2 },
    { x: -20, z: 0, radius: 2 },
    { x: -20, z: 15, radius: 2 },
    { x: 20, z: -15, radius: 2 },
    { x: 20, z: 0, radius: 2 },
    { x: 20, z: 15, radius: 2 },
    { x: 60, z: -15, radius: 2 },
    { x: 60, z: 0, radius: 2 },
    { x: 60, z: 15, radius: 2 },
    
    // Additional points along horizontal streets
    { x: -50, z: -30, radius: 2 },
    { x: -30, z: -30, radius: 2 },
    { x: -10, z: -30, radius: 2 },
    { x: 10, z: -30, radius: 2 },
    { x: 30, z: -30, radius: 2 },
    { x: 50, z: -30, radius: 2 },
    { x: -50, z: 30, radius: 2 },
    { x: -30, z: 30, radius: 2 },
    { x: -10, z: 30, radius: 2 },
    { x: 10, z: 30, radius: 2 },
    { x: 30, z: 30, radius: 2 },
    { x: 50, z: 30, radius: 2 },
    
    // Central area points
    { x: -40, z: 0, radius: 2 },
    { x: -30, z: 0, radius: 2 },
    { x: -10, z: 0, radius: 2 },
    { x: 0, z: 0, radius: 2 },
    { x: 10, z: 0, radius: 2 },
    { x: 30, z: 0, radius: 2 },
    { x: 40, z: 0, radius: 2 }
];

/**
 * Initialize the NPC system with scene components
 * @param {THREE.Scene} scene - The scene containing NPCs
 * @param {CollisionSystem} collisionSystem - The collision system
 * @param {SewerMap} map - The map containing buildings
 */
function initNPCSystem(scene, collisionSystem, map) {
    if (!scene || !collisionSystem || !map) {
        console.error('Missing required components for NPC system initialization');
        return;
    }
    scene.userData.collisionSystem = collisionSystem;
    scene.userData.map = map;
    isSceneInitialized = true;
}

// NPC class for AI-controlled rat characters
export class NPC {
  constructor(scene, position, options = {}) {
    // Create rat model with NPC options
    const { ratGroup, ratMesh } = createRat({ 
      color: options.color || 0xFF0000, // Default red
      isNPC: true 
    });
    this.rat = ratGroup;
    this.ratMesh = ratMesh;
    this.scene = scene;
    
    // Set initial position - adjust y to account for rat model height
    const adjustedPosition = position.clone();
    adjustedPosition.y = 0; // Set to ground level since rat model is already positioned correctly
    this.rat.position.copy(adjustedPosition);
    
    // Set NPC properties
    this.health = NPC_HEALTH;
    this.maxHealth = NPC_HEALTH;
    this.speed = options.speed || 0.03;
    this.pattern = options.pattern || MOVEMENT_PATTERNS.PATROL;
    this.patrolDistance = options.patrolDistance || 5;
    this.patrolAxis = options.patrolAxis || 'x';
    
    // Movement state
    this.direction = 1;
    this.startPosition = position.clone();
    this.currentAngle = 0;
    this.circleRadius = options.circleRadius || 3;
    this.lastRandomChange = 0;
    this.randomDirection = new THREE.Vector3(
      Math.random() * 2 - 1,
      0,
      Math.random() * 2 - 1
    ).normalize();
    
    // Add rat to scene
    scene.add(this.rat);
    this.rat.name = 'npc-rat';
    
    // Setup collision properties
    this.rat.userData = {
      isNPC: true,
      health: this.health,
      maxHealth: this.maxHealth,
      hitboxWidth: NPC_HITBOX_WIDTH,
      hitboxHeight: NPC_HITBOX_HEIGHT,
      hitboxDepth: NPC_HITBOX_DEPTH
    };
    
    // Add health display using same system as player
    this.createHealthDisplay();
  }
  
  // Create a health bar above the NPC using same style as player
  createHealthDisplay() {
    // Create a health bar container
    const healthBar = new THREE.Group();
    
    // Create the background bar - more translucent
    const bgGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.05);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      transparent: true,
      opacity: 0.4
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    
    // Create the health indicator - more translucent
    const healthGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.05);
    const healthMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00FF00,
      transparent: true,
      opacity: 0.6
    });
    const indicator = new THREE.Mesh(healthGeometry, healthMaterial);
    
    // Add to health bar group
    healthBar.add(background);
    healthBar.add(indicator);
    
    // Position above the rat's head
    healthBar.position.y = 1.2;
    
    // Add to rat and store references
    this.rat.add(healthBar);
    this.rat.userData.healthBar = healthBar;
    this.rat.userData.healthIndicator = indicator;
  }
  
  // Update health display to match player's style
  updateHealthDisplay() {
    if (!this.rat.userData.healthIndicator) return;
    
    const healthPercent = this.health / this.maxHealth;
    const indicator = this.rat.userData.healthIndicator;
    
    // Update scale and position
    indicator.scale.x = Math.max(0, healthPercent);
    indicator.position.x = (healthPercent - 1) / 2;
    
    // Update color based on health
    const color = indicator.material.color;
    if (healthPercent > 0.6) {
      color.setHex(0x00FF00); // Green
    } else if (healthPercent > 0.3) {
      color.setHex(0xFFFF00); // Yellow
    } else {
      color.setHex(0xFF0000); // Red
    }
  }
  
  // Take damage from a hit
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.rat.userData.health = this.health;
    this.updateHealthDisplay();
    
    // Flash red to indicate damage
    if (this.ratMesh) {
      flashNPC(this.ratMesh);
    }
    
    // Check if NPC is defeated
    if (this.health <= 0) {
      this.die();
    }
    
    return this.health;
  }
  
  // Handle NPC death similar to player death
  die() {
    // Drop the rat to the ground
    this.pattern = MOVEMENT_PATTERNS.STATIONARY;
    this.rat.rotation.z = Math.PI / 2; // Lay on side
    
    // Hide health bar
    if (this.rat.userData.healthBar) {
      this.rat.userData.healthBar.visible = false;
    }
    
    // Disable AI and collisions
    this.rat.userData.isDead = true;
    
    console.log('[COMBAT] NPC defeated');
    
    // Remove NPC after a delay
    setTimeout(() => {
      if (this.rat.parent === this.scene) {
        this.scene.remove(this.rat);
      }
    }, 3000);
  }
  
  // Update NPC based on its movement pattern
  update() {
    if (this.health <= 0) return; // Don't move if dead
    
    switch (this.pattern) {
      case MOVEMENT_PATTERNS.PATROL:
        this.updatePatrolMovement();
        break;
      case MOVEMENT_PATTERNS.CIRCLE:
        this.updateCircleMovement();
        break;
      case MOVEMENT_PATTERNS.RANDOM:
        this.updateRandomMovement();
        break;
      case MOVEMENT_PATTERNS.STATIONARY:
        // Do nothing, NPC stays in place
        break;
    }
  }
  
  // Update patrol movement (back and forth in a line)
  updatePatrolMovement() {
    // Get current position on the patrol axis
    const currentPos = this.rat.position[this.patrolAxis];
    const startPos = this.startPosition[this.patrolAxis];
    
    // Check if we need to reverse direction
    if (currentPos >= startPos + this.patrolDistance) {
      this.direction = -1;
      this.rat.rotation.y = Math.PI; // Turn around
    } else if (currentPos <= startPos - this.patrolDistance) {
      this.direction = 1;
      this.rat.rotation.y = 0; // Turn around
    }
    
    // Move in the current direction
    this.rat.position[this.patrolAxis] += this.speed * this.direction;
  }
  
  // Update circle movement
  updateCircleMovement() {
    // Update the angle based on speed
    this.currentAngle += this.speed;
    
    // Calculate new position
    this.rat.position.x = this.startPosition.x + Math.cos(this.currentAngle) * this.circleRadius;
    this.rat.position.z = this.startPosition.z + Math.sin(this.currentAngle) * this.circleRadius;
    
    // Face the direction of movement
    this.rat.rotation.y = this.currentAngle + Math.PI / 2;
  }
  
  // Update random movement
  updateRandomMovement() {
    const now = Date.now();
    
    // Change direction randomly every 2-4 seconds
    if (now - this.lastRandomChange > 2000 + Math.random() * 2000) {
      this.randomDirection.set(
        Math.random() * 2 - 1,
        0,
        Math.random() * 2 - 1
      ).normalize();
      
      // Face the new direction
      this.rat.rotation.y = Math.atan2(this.randomDirection.x, this.randomDirection.z);
      
      this.lastRandomChange = now;
    }
    
    // Move in the current random direction
    this.rat.position.x += this.randomDirection.x * this.speed;
    this.rat.position.z += this.randomDirection.z * this.speed;
  }
}

/**
 * Update NPC AI behavior
 * @param {THREE.Object3D} npc - The NPC to update
 * @param {THREE.Object3D} player - The player object
 * @param {CollisionSystem} collisionSystem - The collision system
 */
function updateNPCAI(npc, player, collisionSystem) {
    // Skip if NPC is dead
    if (npc.userData.health <= 0) return;

    // Get distance to player
    const distanceToPlayer = npc.position.distanceTo(player.position);
    let movement = new THREE.Vector3();

    // Update AI state based on conditions
    if (npc.userData.aiState === 'retreat' && Date.now() < npc.userData.retreatTime) {
        // Move away from player during retreat
        const direction = new THREE.Vector3()
            .subVectors(npc.position, player.position)
            .normalize();
        movement.copy(direction.multiplyScalar(0.1));
        npc.rotation.y = Math.atan2(direction.x, direction.z) + Math.PI;
    } else if (distanceToPlayer < NPC_DETECTION_RADIUS) {
        // If player is close, face them and try to shoot
        const direction = new THREE.Vector3()
            .subVectors(player.position, npc.position)
            .normalize();
        npc.rotation.y = Math.atan2(direction.x, direction.z) + Math.PI;
        
        // Try to shoot at player
        const now = Date.now();
        const lastFireTime = npcLastFireTimes.get(npc) || 0;
        if (now - lastFireTime >= NPC_FIRE_RATE) {
            // Create projectile
            const geometry = new THREE.SphereGeometry(0.12);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0xFFD700,
                emissive: 0x996515,
                emissiveIntensity: 0.3
            });
            const projectile = new THREE.Mesh(geometry, material);
            
            // Position at NPC's head
            projectile.position.copy(npc.position);
            projectile.position.y += 1.5;
            
            // Set direction towards player with minimal randomness for better accuracy
            const shootDirection = direction.clone();
            shootDirection.x += (Math.random() - 0.5) * 0.01;
            shootDirection.y += (Math.random() - 0.5) * 0.01;
            shootDirection.z += (Math.random() - 0.5) * 0.01;
            shootDirection.normalize();
            
            // Move projectile forward to prevent self-collision
            projectile.position.add(shootDirection.clone().multiplyScalar(1));
            
            // Set projectile properties
            projectile.name = 'cheese-projectile';
            projectile.userData.damage = 10;
            projectile.userData.speed = 2.0;
            projectile.userData.direction = shootDirection;
            projectile.userData.fromNPC = true;
            
            // Add to scene
            npc.parent.add(projectile);
            
            // Update last fire time
            npcLastFireTimes.set(npc, now);
        }
        
        // Move randomly to make it harder to hit
        if (Math.random() < 0.05) {
            movement.set(
                (Math.random() - 0.5) * 0.2,
                0,
                (Math.random() - 0.5) * 0.2
            );
        }
    } else {
        // Default patrol behavior
        movement.set(
            Math.sin(Date.now() * 0.001) * 0.02,
            0,
            Math.cos(Date.now() * 0.001) * 0.02
        );
    }

    // Check for collisions before applying movement
    if (movement.length() > 0) {
        const collision = collisionSystem.checkCollision(npc.position, movement);
        if (collision.hasCollision) {
            if (collision.adjustedMovement.length() > 0) {
                npc.position.add(collision.adjustedMovement);
            }
        } else {
            npc.position.add(movement);
        }
    }
}

// Update all NPCs
function updateNPCs(scene, player, collisionSystem) {
    scene.children.forEach(child => {
        if (child.name === 'npc-rat') {
            // Skip if NPC is already dead
            if (child.userData.health <= 0) return;

            // Update AI state with collision detection
            updateNPCAI(child, player, collisionSystem);
            
            // Check for projectile hits
            scene.children.forEach(projectile => {
                if (projectile.name === 'cheese-projectile' && !projectile.userData.hasCollided) {
                    // Create a hitbox that matches the rat's trench coat shape
                    const npcBounds = new THREE.Box3();
                    const center = child.position.clone();
                    center.y += NPC_HITBOX_HEIGHT / 2; // Center the hitbox vertically
                    
                    npcBounds.setFromCenterAndSize(
                        center,
                        new THREE.Vector3(
                            NPC_HITBOX_WIDTH, // Width (x) - matches trench coat
                            NPC_HITBOX_HEIGHT, // Height (y) - full height
                            NPC_HITBOX_DEPTH  // Depth (z) - matches coat depth
                        )
                    );

                    const projectileBounds = new THREE.Box3().setFromObject(projectile);
                    
                    if (npcBounds.intersectsBox(projectileBounds)) {
                        // Mark projectile as collided to prevent multiple hits
                        projectile.userData.hasCollided = true;
                        
                        // Apply damage
                        damageNPC(scene, child, projectile.userData.damage);
                        scene.remove(projectile);
                    }
                }
            });
            
            // Make health bar face camera
            if (child.userData.healthBar) {
                child.userData.healthBar.lookAt(player.position);
            }
        }
    });
}

/**
 * Try to find a valid spawn point in a specific zone
 * @param {Object} zone - The zone to try spawning in
 * @param {CollisionSystem} collisionSystem - The collision system
 * @param {Set} usedPositions - Set of used positions
 * @returns {THREE.Vector3|null} - Valid spawn point or null
 */
function trySpawnInZone(zone, collisionSystem, usedPositions) {
    // Try multiple angles and distances within the zone
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2; // Evenly distribute angles
        for (let j = 0; j < 3; j++) {
            const distance = (j + 1) * (zone.radius / 3); // Try different distances from center
            const testPoint = new THREE.Vector3(
                zone.x + Math.cos(angle) * distance,
                0,
                zone.z + Math.sin(angle) * distance
            );
            
            // Check if point is valid
            const collision = collisionSystem.checkCollision(testPoint, new THREE.Vector3(0, 0, 0));
            if (!collision.hasCollision) {
                // Check minimum distance from other NPCs
                let tooClose = false;
                for (const usedPos of usedPositions) {
                    const [usedX, usedZ] = usedPos.split(',').map(Number);
                    const usedPosition = new THREE.Vector3(usedX, 0, usedZ);
                    if (testPoint.distanceTo(usedPosition) < 5) { // Reduced minimum distance
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
                    return testPoint;
                }
            }
        }
    }
    return null;
}

/**
 * Handle NPC death and respawn
 */
function handleNPCDeath(scene, npc) {
    // Drop the rat to the ground
    npc.rotation.z = Math.PI / 2;
    
    // Hide health bar
    if (npc.userData.healthBar) {
        npc.userData.healthBar.visible = false;
    }
    
    // Disable AI and collisions
    npc.userData.isDead = true;
    
    // Stop all movement
    npc.userData.velocity = new THREE.Vector3(0, 0, 0);
    npc.userData.isGrounded = true;
    
    // Respawn after delay
    setTimeout(() => {
        // Reset health and state
        npc.userData.health = npc.userData.maxHealth;
        npc.userData.isDead = false;
        
        // Reset health bar
        npc.userData.healthBar.visible = true;
        if (npc.userData.healthIndicator) {
            npc.userData.healthIndicator.scale.x = 1;
            npc.userData.healthIndicator.position.x = 0;
            npc.userData.healthIndicator.material.color.setHex(0x00FF00);
        }
        
        // Reset rotation
        npc.rotation.z = 0;
        
        // Get collision system and map from scene
        const collisionSystem = scene.userData.collisionSystem;
        const map = scene.userData.map;
        
        if (!collisionSystem || !map) {
            console.error('Missing required scene components for NPC respawn');
            return;
        }

        // Try to find a spawn point
        let spawnPoint = null;
        
        // First try street intersections
        const streetIntersections = spawnZones.filter(zone => zone.radius === 2.5);
        for (const zone of streetIntersections) {
            spawnPoint = trySpawnInZone(zone, collisionSystem, usedSpawnPositions);
            if (spawnPoint) break;
        }
        
        // If no intersection works, try street segments
        if (!spawnPoint) {
            const streetSegments = spawnZones.filter(zone => zone.radius === 2);
            for (const zone of streetSegments) {
                spawnPoint = trySpawnInZone(zone, collisionSystem, usedSpawnPositions);
                if (spawnPoint) break;
            }
        }
        
        // If still no point found, try a spiral pattern around the origin
        if (!spawnPoint) {
            const spiralAttempts = 20;
            const spiralSpacing = 5;
            for (let i = 0; i < spiralAttempts; i++) {
                const angle = i * 0.5;
                const radius = spiralSpacing * (i / spiralAttempts);
                const testPoint = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    0,
                    Math.sin(angle) * radius
                );
                
                const collision = collisionSystem.checkCollision(testPoint, new THREE.Vector3(0, 0, 0));
                if (!collision.hasCollision) {
                    spawnPoint = testPoint;
                    break;
                }
            }
        }
        
        if (spawnPoint) {
            // Remove old position from used positions if it exists
            const oldPosKey = `${npc.position.x.toFixed(2)},${npc.position.z.toFixed(2)}`;
            usedSpawnPositions.delete(oldPosKey);
            
            // Update to new position
            npc.position.copy(spawnPoint);
            npc.position.y = 0.1; // Start slightly above ground
            
            // Add new position to used positions
            const newPosKey = `${spawnPoint.x.toFixed(2)},${spawnPoint.z.toFixed(2)}`;
            usedSpawnPositions.add(newPosKey);
            
            // Reset velocity and movement state
            npc.userData.velocity = new THREE.Vector3(0, 0, 0);
            npc.userData.isGrounded = true;
        } else {
            // Last resort - use a random position along the map edges
            const edge = Math.floor(Math.random() * 4);
            const pos = Math.random() * 160 - 80; // -80 to 80
            
            switch(edge) {
                case 0: // North
                    spawnPoint = new THREE.Vector3(pos, 0, -90);
                    break;
                case 1: // South
                    spawnPoint = new THREE.Vector3(pos, 0, 90);
                    break;
                case 2: // East
                    spawnPoint = new THREE.Vector3(-90, 0, pos);
                    break;
                case 3: // West
                    spawnPoint = new THREE.Vector3(90, 0, pos);
                    break;
            }
            
            npc.position.copy(spawnPoint);
            npc.position.y = 0.1;
        }
    }, 3000);
}

/**
 * Flash the NPC to indicate damage
 */
function flashNPC(npc) {
    // If already flashing or no material, skip
    if (npc.userData.isFlashing || !npc.material) {
        return;
    }

    // Mark as flashing
    npc.userData.isFlashing = true;

    // Store original material if not already stored
    if (!npc.userData.originalMaterial) {
        npc.userData.originalMaterial = npc.material.clone();
    }

    // Apply flash effect
    npc.material.emissive.setHex(0xFF0000);
    npc.material.emissiveIntensity = 0.8;
    
    setTimeout(() => {
        if (npc.userData.originalMaterial) {
            npc.material = npc.userData.originalMaterial.clone();
            npc.userData.isFlashing = false;
        }
    }, 150);
}

/**
 * Apply damage to an NPC
 */
function damageNPC(scene, npc, damage) {
    // Skip if NPC is already dead
    if (npc.userData.isDead || npc.userData.health <= 0) return;

    // Apply damage
    const damageAmount = 25; // Fixed damage amount like player
    
    // Find the NPC instance
    const npcInstance = scene.children
        .find(child => child === npc || (child.type === 'Group' && child.children.includes(npc)));
    
    if (npcInstance && npcInstance.userData.isNPC) {
        // Apply damage through the NPC class instance
        npcInstance.userData.health = Math.max(0, npcInstance.userData.health - damageAmount);
        
        // Update health bar
        if (npcInstance.userData.healthIndicator) {
            const healthPercent = npcInstance.userData.health / npcInstance.userData.maxHealth;
            const indicator = npcInstance.userData.healthIndicator;
            
            // Update scale and position
            indicator.scale.x = Math.max(0, healthPercent);
            indicator.position.x = (healthPercent - 1) / 2;
            
            // Update color based on health
            const color = indicator.material.color;
            if (healthPercent > 0.6) {
                color.setHex(0x00FF00); // Green
            } else if (healthPercent > 0.3) {
                color.setHex(0xFFFF00); // Yellow
            } else {
                color.setHex(0xFF0000); // Red
            }
        }
        
        // Visual feedback
        flashNPC(npc);
        
        // Create hit effect
        const hitPosition = npc.position.clone();
        hitPosition.y += NPC_HITBOX_HEIGHT / 2;
        createImpactEffect(scene, hitPosition, true);
        
        // Handle death if health is depleted
        if (npcInstance.userData.health <= 0) {
            // Play death sound
            if (scene.userData.audioManager) {
                scene.userData.audioManager.playSound(SOUND_EFFECTS.RAT_DEATH);
            }
            handleNPCDeath(scene, npc);
        } else {
            // Play hit sound
            if (scene.userData.audioManager) {
                scene.userData.audioManager.playSound(SOUND_EFFECTS.RAT_HIT);
            }
            npc.userData.aiState = 'retreat';
            npc.userData.retreatTime = Date.now() + 1000;
        }
    }
}

/**
 * Create impact effect for hits
 */
function createImpactEffect(scene, position, isNPCHit = false) {
    const particleCount = 8;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 0.1;
        
        positions[i * 3] = position.x + Math.cos(angle) * radius;
        positions[i * 3 + 1] = position.y + Math.sin(angle) * radius;
        positions[i * 3 + 2] = position.z;
        
        velocities.push(new THREE.Vector3(
            Math.cos(angle) * 0.15,
            Math.sin(angle) * 0.15,
            0
        ));
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xFF0000,
        size: 0.08,
        transparent: true,
        opacity: 0.8
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.name = 'impact-effect';
    scene.add(particles);
    
    // Animate and remove the effect
    let lifetime = 0;
    const maxLifetime = 300;
    
    function animateParticles() {
        lifetime += 16.67; // Approximately 60fps
        
        if (lifetime >= maxLifetime) {
            scene.remove(particles);
            return;
        }
        
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
            
            // Add gravity effect
            velocities[i].y -= 0.001;
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        material.opacity = 0.8 * (1 - lifetime / maxLifetime);
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
}

/**
 * Add a health bar to an NPC
 */
function addHealthBar(npc) {
    // Remove existing health bar if present
    if (npc.userData.healthBar) {
        npc.remove(npc.userData.healthBar);
    }

    const healthBar = new THREE.Group();
    
    // Background bar - more translucent
    const bgGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.05); // Slightly smaller and thinner
    const bgMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.4 // More translucent background
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    
    // Health indicator - more translucent
    const healthGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.05);
    const healthMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00FF00,
        transparent: true,
        opacity: 0.6 // More translucent but still visible
    });
    const indicator = new THREE.Mesh(healthGeometry, healthMaterial);
    
    healthBar.add(background);
    healthBar.add(indicator);
    
    // Position closer to head
    healthBar.position.y = 1.2; // Reduced from 1.5 to be closer to head
    
    // Add to NPC and store references
    npc.add(healthBar);
    npc.userData.healthBar = healthBar;
    npc.userData.healthIndicator = indicator;
    
    // Ensure health values are initialized
    if (typeof npc.userData.health === 'undefined') {
        npc.userData.health = NPC_HEALTH;
        npc.userData.maxHealth = NPC_HEALTH;
    }
}

/**
 * Create a single NPC at the specified position
 * @param {THREE.Scene} scene - The scene to add the NPC to
 * @param {THREE.Vector3} position - The spawn position
 * @param {Object} options - Additional options for NPC creation
 * @returns {NPC} The created NPC instance
 */
function createNPC(scene, position, options = {}) {
    return new NPC(scene, position, options);
}

/**
 * Create multiple NPCs in the scene
 * @param {THREE.Scene} scene - The scene to add NPCs to
 * @param {CollisionSystem} collisionSystem - The collision system
 * @param {number} count - Number of NPCs to create (default: NPC_COUNT)
 * @returns {Array} Array of created NPCs
 */
function createNPCs(scene, collisionSystem, count = NPC_COUNT) {
    if (!scene || !collisionSystem) {
        console.error('Missing required components for NPC creation');
        return [];
    }

    const createdNPCs = [];

    for (let i = 0; i < count; i++) {
        let spawnPoint = null;
        
        // Try to find a valid spawn point
        for (const zone of spawnZones) {
            spawnPoint = trySpawnInZone(zone, collisionSystem, usedSpawnPositions);
            if (spawnPoint) break;
        }
        
        // If no valid point found in zones, use a random edge position
        if (!spawnPoint) {
            const edge = Math.floor(Math.random() * 4);
            const pos = Math.random() * 160 - 80; // -80 to 80
            
            switch(edge) {
                case 0: // North
                    spawnPoint = new THREE.Vector3(pos, 0, -90);
                    break;
                case 1: // South
                    spawnPoint = new THREE.Vector3(pos, 0, 90);
                    break;
                case 2: // East
                    spawnPoint = new THREE.Vector3(-90, 0, pos);
                    break;
                case 3: // West
                    spawnPoint = new THREE.Vector3(90, 0, pos);
                    break;
            }
        }
        
        if (spawnPoint) {
            // Create NPC with random movement pattern
            const patterns = Object.values(MOVEMENT_PATTERNS);
            const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            const npc = createNPC(scene, spawnPoint, {
                pattern: randomPattern,
                speed: NPC_MOVEMENT_SPEED * (0.8 + Math.random() * 0.4), // Random speed variation
                color: new THREE.Color(0.8 + Math.random() * 0.2, 0, 0) // Random red variation
            });
            
            createdNPCs.push(npc);
            
            // Add spawn point to used positions
            const posKey = `${spawnPoint.x.toFixed(2)},${spawnPoint.z.toFixed(2)}`;
            usedSpawnPositions.add(posKey);
        }
    }

    return createdNPCs;
}

// Export all necessary functions at the end of the file
export {
    createNPC,
    createNPCs,
    updateNPCs,
    handleNPCDeath,
    damageNPC,
    addHealthBar,
    flashNPC,
    createImpactEffect,
    initNPCSystem,
    NPC_HITBOX_WIDTH,
    NPC_HITBOX_HEIGHT,
    NPC_HITBOX_DEPTH
}; 