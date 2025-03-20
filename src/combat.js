// Last updated: 2025-03-20T02:57:16.711Z
import * as THREE from 'three';
import { broadcastShoot } from './multiplayer.js';
import { debugLog, DEBUG_CATEGORIES } from './debug.js';
import { SOUND_EFFECTS } from './game/AudioSetup.js';

const PROJECTILE_SPEED = 2.0; // Increased from 1.0 for much faster projectiles
const PROJECTILE_DAMAGE = 10;
const PROJECTILE_LIFETIME = 3000;
const PROJECTILE_SIZE = 0.12; // Slightly reduced for more precise hits
const FIRE_RATE = 400; // Increased from 250ms to 400ms between shots (2.5 shots per second)

// Store the socket reference for shooting events
let socketRef = null;
let lastFireTime = 0; // Track when the last shot was fired

// Create a small sphere for collision checking
const COLLISION_SPHERE = new THREE.Sphere(new THREE.Vector3(), PROJECTILE_SIZE);

export function initCombat(scene, player, socket = null) {
    // Store socket reference if provided
    if (socket) {
        socketRef = socket;
    }
    
    // Create HUD if it doesn't exist
    if (typeof document !== 'undefined' && !document.getElementById('hud') && process.env.NODE_ENV !== 'test') {
        const hud = document.createElement('div');
        hud.id = 'hud';
        hud.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 20px;
            user-select: none;
            -webkit-user-select: none;
        `;
        
        const health = document.createElement('div');
        health.id = 'health';
        health.textContent = player.userData.health;
        
        const ammo = document.createElement('div');
        ammo.id = 'ammo';
        ammo.textContent = '∞';
        
        hud.appendChild(health);
        hud.appendChild(ammo);
        document.body.appendChild(hud);
        
        // Add a crosshair to help with aiming
        const crosshair = document.createElement('div');
        crosshair.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            background-color: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            pointer-events: none;
        `;
        document.body.appendChild(crosshair);
    }

    // Initialize click/touch handlers
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        // Desktop controls - only fire when pointer is locked
        window.addEventListener('click', (event) => {
            if (document.pointerLockElement === document.getElementById('game-container')) {
                fireCheeseGun({ scene, player });
            }
        });

        // Mobile controls - use the cheese button created in movement.js
        if ('ontouchstart' in window && window.mobileCheeseButton) {
            window.mobileCheeseButton.addEventListener('touchstart', () => {
                fireCheeseGun({ scene, player });
            });
        }
    }

    return { scene, player };
}

export function fireCheeseGun({ scene, player }) {
    // Check if enough time has passed since last shot
    const now = Date.now();
    if (now - lastFireTime < FIRE_RATE) return null;
    lastFireTime = now;

    // Play gunshot sound
    if (player.userData.audioManager) {
        player.userData.audioManager.playSound(SOUND_EFFECTS.GUNSHOT);
    }

    debugLog(DEBUG_CATEGORIES.COMBAT, 'Attempting to fire cheese gun', {
        sceneChildren: scene.children.length,
        playerPosition: player.position.clone()
    });
    
    // Verify scene and player
    if (!scene || !player) {
        debugLog(DEBUG_CATEGORIES.COMBAT, 'Failed to fire: Invalid scene or player', { scene: !!scene, player: !!player });
        return null;
    }
    
    // Create cheese projectile
    const geometry = new THREE.SphereGeometry(PROJECTILE_SIZE);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700,
        emissive: 0x996515,
        emissiveIntensity: 0.3
    });
    const projectile = new THREE.Mesh(geometry, material);
    
    // Get camera for direction
    const camera = scene.getObjectByName('camera');
    debugLog(DEBUG_CATEGORIES.COMBAT, 'Looking for camera', {
        found: !!camera,
        sceneObjects: scene.children.map(child => ({ name: child.name, type: child.type }))
    });
    
    if (!camera) {
        debugLog(DEBUG_CATEGORIES.COMBAT, 'Failed to fire: Camera not found in scene');
        return null;
    }
    
    debugLog(DEBUG_CATEGORIES.COMBAT, 'Camera found', {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        parent: camera.parent?.type || 'none'
    });
    
    // Calculate spawn position (in front of player)
    const spawnPoint = new THREE.Vector3();
    spawnPoint.copy(player.position);
    spawnPoint.y += 1.5; // Head height
    
    // Get shooting direction from camera
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.normalize();
    
    debugLog(DEBUG_CATEGORIES.COMBAT, 'Calculated firing parameters', {
        spawnPoint: spawnPoint.clone(),
        direction: direction.clone(),
        playerPos: player.position.clone()
    });
    
    // Position projectile at spawn point
    projectile.position.copy(spawnPoint);
    
    // Move slightly forward to prevent clipping
    projectile.position.add(direction.clone().multiplyScalar(1));
    
    // Set projectile properties
    projectile.name = 'cheese-projectile';
    projectile.userData.damage = PROJECTILE_DAMAGE;
    projectile.userData.speed = PROJECTILE_SPEED;
    projectile.userData.direction = direction;
    
    // Add trail effect with better visibility
    const trail = new THREE.Points(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]),
        new THREE.PointsMaterial({
            color: 0xFFD700,
            size: 0.08,
            transparent: true,
            opacity: 0.7
        })
    );
    projectile.add(trail);
    
    scene.add(projectile);
    debugLog(DEBUG_CATEGORIES.COMBAT, 'Projectile created and added to scene', {
        position: projectile.position.clone(),
        direction: projectile.userData.direction.clone(),
        sceneChildren: scene.children.length
    });

    // Remove projectile after lifetime
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        setTimeout(() => {
            scene.remove(projectile);
            debugLog(DEBUG_CATEGORIES.COMBAT, 'Projectile removed after lifetime');
        }, PROJECTILE_LIFETIME);
    }
    
    // Broadcast shooting event to other players
    if (socketRef) {
        broadcastShoot(socketRef, projectile.position, direction);
    }

    return projectile;
}

/**
 * Create a projectile for a remote player's shot
 * @param {THREE.Scene} scene - The ThreeJS scene
 * @param {Object} data - The shot data
 */
export function createRemoteProjectile(scene, data) {
    // Create cheese projectile
    const geometry = new THREE.SphereGeometry(0.1);
    const material = new THREE.MeshPhongMaterial({ color: 0xFFD700 }); // Gold color for cheese
    const projectile = new THREE.Mesh(geometry, material);
    
    // Position at the remote player's position
    projectile.position.set(
        data.position.x,
        data.position.y,
        data.position.z
    );
    
    // Set projectile properties
    projectile.name = 'cheese-projectile';
    projectile.userData.damage = PROJECTILE_DAMAGE;
    projectile.userData.speed = PROJECTILE_SPEED;
    
    // Set direction from the data
    const direction = new THREE.Vector3(
        data.direction.x,
        data.direction.y,
        data.direction.z
    );
    projectile.userData.direction = direction;
    
    scene.add(projectile);

    // Remove projectile after lifetime
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        setTimeout(() => {
            scene.remove(projectile);
        }, PROJECTILE_LIFETIME);
    }

    return projectile;
}

export function updateHUD(health) {
    // Skip in test environment
    if (typeof document === 'undefined' || process.env.NODE_ENV === 'test') return;
    
    const healthDisplay = document.getElementById('health');
    const ammoDisplay = document.getElementById('ammo');
    
    if (healthDisplay) healthDisplay.textContent = health;
    if (ammoDisplay) ammoDisplay.textContent = '∞';
}

export function updateProjectiles(scene, collisionSystem) {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') return;

    let projectileCount = 0;
    const projectilesToRemove = [];

    scene.children.forEach(child => {
        if (child.name === 'cheese-projectile') {
            projectileCount++;
            
            // Calculate movement for this frame
            const movement = child.userData.direction.clone().multiplyScalar(child.userData.speed);
            
            // Get all potential collisions
            const collisions = [];
            
            // Check for wall collision using specialized projectile check
            const wallCollision = collisionSystem.checkProjectileCollision(child.position, movement);
            
            // Add wall collision if it exists
            if (wallCollision.hasCollision) {
                collisions.push({
                    type: 'wall',
                    distance: child.position.distanceTo(wallCollision.collisionPoint),
                    collision: wallCollision,
                    point: wallCollision.collisionPoint,
                    target: null
                });
            }
            
            // Check for NPC collisions
            scene.children.forEach(target => {
                if (target.name === 'npc-rat' && !projectilesToRemove.includes(child)) {
                    // Use a larger collision sphere for NPCs to make hitting them easier
                    const npcCollisionSphere = new THREE.Sphere(target.position, 1);
                    
                    // Update collision sphere to current projectile position
                    COLLISION_SPHERE.center.copy(child.position);
                    
                    if (COLLISION_SPHERE.intersectsSphere(npcCollisionSphere)) {
                        // Calculate the intersection point (approximately)
                        const toNPC = target.position.clone().sub(child.position);
                        const distance = toNPC.length();
                        collisions.push({
                            type: 'npc',
                            distance: distance,
                            collision: null,
                            point: target.position.clone(),
                            target: target
                        });
                    }
                }
            });
            
            // Sort collisions by distance
            collisions.sort((a, b) => a.distance - b.distance);
            
            // Handle the closest collision
            if (collisions.length > 0) {
                const closest = collisions[0];
                
                if (closest.type === 'npc') {
                    const target = closest.target;
                    debugLog(DEBUG_CATEGORIES.COMBAT, 'Projectile hit NPC', {
                        projectilePos: child.position.clone(),
                        npcPos: target.position.clone(),
                        distance: closest.distance
                    });
                    
                    // Damage the NPC
                    if (target.userData.health) {
                        target.userData.health -= PROJECTILE_DAMAGE;
                        debugLog(DEBUG_CATEGORIES.COMBAT, 'NPC damaged', {
                            npcHealth: target.userData.health
                        });
                        
                        // Create hit effect at the NPC's position
                        createImpactEffect(scene, closest.point, true);
                        
                        // Remove projectile
                        projectilesToRemove.push(child);
                        
                        // Check if NPC is defeated
                        if (target.userData.health <= 0) {
                            scene.remove(target);
                            debugLog(DEBUG_CATEGORIES.COMBAT, 'NPC defeated');
                        }
                    }
                } else { // Wall collision
                    debugLog(DEBUG_CATEGORIES.COMBAT, 'Projectile hit wall', {
                        position: child.position.clone(),
                        collisionPoint: closest.point,
                        distance: closest.distance
                    });
                    
                    // Move projectile to collision point
                    child.position.add(closest.collision.adjustedMovement);
                    
                    // Create wall impact effect at the collision point
                    createImpactEffect(scene, closest.point, false);
                    
                    // Mark for removal
                    projectilesToRemove.push(child);
                }
            } else {
                // No collision, update position
                child.position.add(movement);
                
                // Update trail effect
                if (child.children.length > 0) {
                    const trail = child.children[0];
                    const positions = trail.geometry.attributes.position.array;
                    positions[0] = -movement.x * 0.5;
                    positions[1] = -movement.y * 0.5;
                    positions[2] = -movement.z * 0.5;
                    trail.geometry.attributes.position.needsUpdate = true;
                }
            }
        }
    });

    // Remove projectiles that hit something
    projectilesToRemove.forEach(projectile => {
        scene.remove(projectile);
    });
    
    if (projectileCount > 0) {
        debugLog(DEBUG_CATEGORIES.COMBAT, `Active projectiles: ${projectileCount}, Collided: ${projectilesToRemove.length}`);
    }
}

/**
 * Create a visual effect when projectiles hit something
 */
export function createImpactEffect(scene, position, isNPCHit = false) {
    // Create particles for the impact
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
        
        // Different particle behavior for NPC hits vs wall hits
        const speed = isNPCHit ? 0.15 : 0.1;
        velocities.push(new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            0
        ));
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: isNPCHit ? 0xFF0000 : 0xFFD700, // Red for NPC hits, gold for wall hits
        size: 0.05,
        transparent: true,
        opacity: 0.8
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.name = 'impact-effect';
    scene.add(particles);
    
    // Animate and remove the effect
    let lifetime = 0;
    const maxLifetime = 500; // 500ms
    
    function animateParticles() {
        if (lifetime >= maxLifetime) {
            scene.remove(particles);
            return;
        }
        
        lifetime += 16.67; // Approximately 60fps
        
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
 * Set the socket for the combat system
 * @param {Object} socket - The socket.io client
 */
export function setSocket(socket) {
    socketRef = socket;
} 