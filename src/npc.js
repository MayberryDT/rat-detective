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
const NPC_COUNT = 5; // How many NPCs to create
const NPC_HEALTH = 100; // Changed from 30 to 100 to make percentages clearer
const NPC_MOVEMENT_SPEED = 0.02;
const NPC_DETECTION_RADIUS = 5;
const NPC_HITBOX_WIDTH = 0.7;  // Matches trench coat width
const NPC_HITBOX_HEIGHT = 1.2; // Matches full height
const NPC_HITBOX_DEPTH = 0.5;  // Matches coat depth
const NPC_FIRE_RATE = 1000; // One shot per second

// Store last fire times for NPCs
const npcLastFireTimes = new Map();

// NPC class for AI-controlled rat characters
export class NPC {
  constructor(scene, position, options = {}) {
    // Create rat model with NPC options
    const { ratGroup } = createRat({ 
      color: options.color || 0xFF0000, // Default red
      isNPC: true 
    });
    this.rat = ratGroup;
    this.scene = scene;
    
    // Set initial position
    this.rat.position.copy(position);
    
    // Set NPC properties
    this.health = options.health || 100;
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
    
    // Add health display
    this.createHealthDisplay();
  }
  
  // Set the rat's color (not needed anymore as we set it during creation)
  setColor(color) {
    this.rat.traverse(child => {
      if (child instanceof THREE.Mesh && child.material) {
        // Clone the material to avoid affecting other rats
        child.material = child.material.clone();
        child.material.color.set(color);
      }
    });
  }
  
  // Create a health bar above the NPC
  createHealthDisplay() {
    // Create a health bar container
    this.healthBar = new THREE.Group();
    
    // Create the background bar
    const bgGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    this.healthBackground = new THREE.Mesh(bgGeometry, bgMaterial);
    
    // Create the actual health indicator
    const healthGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
    const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
    this.healthIndicator = new THREE.Mesh(healthGeometry, healthMaterial);
    
    // Add to health bar group
    this.healthBar.add(this.healthBackground);
    this.healthBar.add(this.healthIndicator);
    
    // Position the health bar above the rat
    this.healthBar.position.y = 1.5;
    
    // Add to rat
    this.rat.add(this.healthBar);
  }
  
  // Update health display
  updateHealthDisplay() {
    // Scale the health indicator based on remaining health percentage
    const healthPercent = this.health / 100;
    this.healthIndicator.scale.x = healthPercent;
    this.healthIndicator.position.x = (healthPercent - 1) / 2;
    
    // Change color based on health
    if (healthPercent > 0.6) {
      this.healthIndicator.material.color.set(0x00FF00); // Green
    } else if (healthPercent > 0.3) {
      this.healthIndicator.material.color.set(0xFFFF00); // Yellow
    } else {
      this.healthIndicator.material.color.set(0xFF0000); // Red
    }
  }
  
  // Take damage from a hit
  takeDamage(amount) {
    this.health -= amount;
    this.updateHealthDisplay();
    
    // Flash red to indicate damage
    this.flash(0xFF0000);
    
    // Check if NPC is defeated
    if (this.health <= 0) {
      this.die();
    }
    
    return this.health;
  }
  
  // Flash the rat a color to indicate damage or healing
  flash(color) {
    const originalColor = this.rat.children[0]?.material?.color.clone();
    
    if (originalColor) {
      // Flash to the damage color
      this.setColor(color);
      
      // Return to original color after a short delay
      setTimeout(() => {
        this.setColor(originalColor);
      }, 200);
    }
  }
  
  // Handle NPC death
  die() {
    // Add death animation or effects here
    
    // Drop the rat to the ground
    this.pattern = MOVEMENT_PATTERNS.STATIONARY;
    this.rat.rotation.z = Math.PI / 2; // Lay on side
    
    // Hide health bar
    this.healthBar.visible = false;
    
    // Remove NPC after a delay
    setTimeout(() => {
      this.scene.remove(this.rat);
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
            // Reduce spread even further for better accuracy
            shootDirection.x += (Math.random() - 0.5) * 0.01; // Reduced from 0.03
            shootDirection.y += (Math.random() - 0.5) * 0.01; // Reduced from 0.02
            shootDirection.z += (Math.random() - 0.5) * 0.01; // Reduced from 0.03
            shootDirection.normalize();
            
            // Move projectile forward to prevent self-collision
            projectile.position.add(shootDirection.clone().multiplyScalar(1));
            
            // Set projectile properties
            projectile.name = 'cheese-projectile';
            projectile.userData.damage = 10;
            projectile.userData.speed = 2.0;
            projectile.userData.direction = shootDirection;
            projectile.userData.fromNPC = true; // Mark as NPC projectile
            
            // Debug log for NPC shooting
            debugLog(DEBUG_CATEGORIES.COMBAT, 'NPC shooting at player', {
                npcPos: npc.position.clone(),
                playerPos: player.position.clone(),
                shootDirection: shootDirection.clone(),
                distance: npc.position.distanceTo(player.position)
            });
            
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
            // Only move if we have an adjusted movement that doesn't collide
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
 * Find a valid spawn point that doesn't collide with geometry
 * @param {CollisionSystem} collisionSystem - The collision system
 * @param {Set} usedPositions - Set of positions already used
 * @param {number} attempts - Maximum number of attempts to find valid position
 * @returns {THREE.Vector3} Valid spawn position or null if none found
 */
function findValidSpawnPoint(collisionSystem, usedPositions = new Set(), attempts = 20) {
    // Define safe spots in different areas of the map
    const safeSpots = [
        new THREE.Vector3(30, 0, 30),    // Northeast
        new THREE.Vector3(-30, 0, 30),   // Northwest
        new THREE.Vector3(30, 0, -30),   // Southeast
        new THREE.Vector3(-30, 0, -30),  // Southwest
        new THREE.Vector3(0, 0, 50),     // North
        new THREE.Vector3(0, 0, -50),    // South
        new THREE.Vector3(50, 0, 0),     // East
        new THREE.Vector3(-50, 0, 0),    // West
        new THREE.Vector3(40, 0, 40),    // Far Northeast
        new THREE.Vector3(-40, 0, 40),   // Far Northwest
        new THREE.Vector3(40, 0, -40),   // Far Southeast
        new THREE.Vector3(-40, 0, -40),  // Far Southwest
    ];

    // Try safe spots first
    for (const spot of safeSpots) {
        // Skip if this position is already used
        const posKey = `${spot.x},${spot.y},${spot.z}`;
        if (usedPositions.has(posKey)) {
            continue;
        }

        // Check if there's space above (not inside a building)
        const upwardCollision = collisionSystem.checkCollision(
            spot,
            new THREE.Vector3(0, 1, 0)
        );
        
        if (!upwardCollision.hasCollision) {
            // Add a small random offset to prevent perfect alignment
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                0,
                (Math.random() - 0.5) * 4
            );
            const finalPosition = spot.clone().add(offset);
            
            // Mark this area as used
            usedPositions.add(posKey);
            console.log('Found valid spawn at safe spot:', finalPosition);
            return finalPosition;
        }
    }

    // If safe spots don't work, try random positions with minimum distance from other NPCs
    for (let i = 0; i < attempts; i++) {
        const testPosition = new THREE.Vector3(
            Math.random() * 160 - 80,  // -80 to 80 (slightly inward from map edges)
            0,                         // Ground level
            Math.random() * 160 - 80   // -80 to 80
        );
        
        // Check minimum distance from used positions
        let tooClose = false;
        for (const posKey of usedPositions) {
            const [x, y, z] = posKey.split(',').map(Number);
            const usedPos = new THREE.Vector3(x, y, z);
            if (testPosition.distanceTo(usedPos) < 10) { // Minimum 10 units apart
                tooClose = true;
                break;
            }
        }
        if (tooClose) continue;

        // Check if there's space above (not inside a building)
        const upwardCollision = collisionSystem.checkCollision(
            testPosition,
            new THREE.Vector3(0, 1, 0)
        );
        
        if (!upwardCollision.hasCollision) {
            const posKey = `${testPosition.x},${testPosition.y},${testPosition.z}`;
            usedPositions.add(posKey);
            console.log('Found valid spawn at random position:', testPosition);
            return testPosition;
        }

        if (i === attempts - 1) {
            console.log('Collision test results:', {
                position: testPosition,
                upwardCollision
            });
        }
    }
    
    console.warn('Could not find valid spawn point after', attempts, 'attempts');
    return new THREE.Vector3(0, 0, 0);
}

/**
 * Create a new NPC at a valid position
 */
function createNPC(scene, collisionSystem, position = null) {
    // If no position provided, find a valid spawn point
    if (!position) {
        position = findValidSpawnPoint(collisionSystem);
    }
    
    // Create the rat with random appearance
    const { ratGroup } = createRat({ isNPC: true });
    
    // Set NPC properties
    ratGroup.name = 'npc-rat';
    ratGroup.userData.health = NPC_HEALTH;
    ratGroup.userData.maxHealth = NPC_HEALTH;
    ratGroup.userData.aiState = 'idle';
    
    // Position the NPC
    ratGroup.position.copy(position);
    
    // Add health bar
    addHealthBar(ratGroup);
    
    scene.add(ratGroup);
    console.log('Created NPC at position:', position);
    return ratGroup;
}

// Create a group of NPCs at different positions
function createNPCs(scene, collisionSystem, count = 5) {
    const npcs = [];
    const usedPositions = new Set();
    
    // Create NPCs at valid positions
    for (let i = 0; i < count; i++) {
        const position = findValidSpawnPoint(collisionSystem, usedPositions);
        const npc = createNPC(scene, collisionSystem, position);
        if (npc) {
            npcs.push(npc);
        }
    }
    
    return npcs;
}

/**
 * Handle NPC death
 */
function handleNPCDeath(scene, npc) {
    // Drop the rat to the ground
    npc.rotation.z = Math.PI / 2; // Lay on side
    
    // Hide health bar
    if (npc.userData.healthBar) {
        npc.userData.healthBar.visible = false;
    }
    
    // Disable AI and collisions
    npc.userData.isDead = true;
    
    console.log('[COMBAT] NPC defeated');
    
    // Remove NPC after a delay
    setTimeout(() => {
        if (npc.parent === scene) {
            scene.remove(npc);
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
    if (npc.userData.health <= 0) return;

    // Ensure health exists in userData
    if (typeof npc.userData.health === 'undefined') {
        npc.userData.health = NPC_HEALTH;
        npc.userData.maxHealth = NPC_HEALTH;
    }

    // Apply fixed damage of 25% of max health
    const damageAmount = npc.userData.maxHealth * 0.25;
    npc.userData.health = Math.max(0, npc.userData.health - damageAmount);
    
    // Play hit sound
    if (scene.userData.audioManager) {
        scene.userData.audioManager.playSound(SOUND_EFFECTS.RAT_HIT);
    }

    // Update health bar display
    if (npc.userData.healthBar && npc.userData.healthIndicator) {
        const healthPercent = npc.userData.health / npc.userData.maxHealth;
        const indicator = npc.userData.healthIndicator;
        
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
    if (npc.userData.health <= 0) {
        // Play death sound
        if (scene.userData.audioManager) {
            scene.userData.audioManager.playSound(SOUND_EFFECTS.RAT_DEATH);
        }
        handleNPCDeath(scene, npc);
    } else {
        npc.userData.aiState = 'retreat';
        npc.userData.retreatTime = Date.now() + 1000;
    }

    // Debug log
    console.log('NPC damaged:', {
        damage: damageAmount,
        newHealth: npc.userData.health,
        maxHealth: npc.userData.maxHealth,
        healthPercent: (npc.userData.health / npc.userData.maxHealth * 100).toFixed(1) + '%',
        hasHealthBar: !!npc.userData.healthBar,
        hasIndicator: !!npc.userData.healthIndicator
    });
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
    // Export hitbox constants
    NPC_HITBOX_WIDTH,
    NPC_HITBOX_HEIGHT,
    NPC_HITBOX_DEPTH
}; 