// Last updated: 2025-03-20T03:43:34.645Z
import * as THREE from 'three';
import { initMovementControls, updatePlayerPosition } from './movement.js';
import { initCombat, updateProjectiles, updateHUD, createImpactEffect } from './combat.js';
import { initMouseControls, updateCamera } from './mouse-controls.js';
import { SewerMap } from './map.js';
import { CollisionSystem } from './collision.js';
import { createRat } from './rat.js';
import { createNPCs, updateNPCs, addHealthBar, handleNPCDeath, flashNPC, NPC_HITBOX_WIDTH, NPC_HITBOX_HEIGHT, NPC_HITBOX_DEPTH } from './npc.js';
import { findValidSpawnPoint } from './spawn.js';
import { initDebug, logMapInit, logCollision, DEBUG_VERSION, debugLog, DEBUG_CATEGORIES } from './debug.js';
import { initMultiplayer, updatePlayerHealth } from './multiplayer.js';
import { initializeAudio, setupAudioContext, MUSIC_TRACKS } from './game/AudioSetup.js';

export async function initScene() {
    try {
        debugLog(DEBUG_CATEGORIES.SCENE, 'Starting scene initialization');
        
        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Sky blue
        debugLog(DEBUG_CATEGORIES.SCENE, 'Scene created');
        
        // Setup lighting
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        debugLog(DEBUG_CATEGORIES.SCENE, 'Lighting setup complete');
        
        // Create and initialize map
        debugLog(DEBUG_CATEGORIES.SCENE, 'Creating map');
        const map = new SewerMap();
        map.init(scene);
        debugLog(DEBUG_CATEGORIES.SCENE, 'Map created', map);
        
        // Initialize collision system
        debugLog(DEBUG_CATEGORIES.SCENE, 'Setting up collision system');
        const collisionSystem = new CollisionSystem(map);
        
        // Create player
        debugLog(DEBUG_CATEGORIES.SCENE, 'Creating player');
        const result = createRat({ isNPC: false });
        const player = result.ratGroup;
        player.name = 'player-rat';
        const usedPositions = new Set();
        const spawnPoint = findValidSpawnPoint(collisionSystem, usedPositions);
        player.position.copy(spawnPoint);
        player.position.y = 0.1; // Start slightly above ground
        debugLog(DEBUG_CATEGORIES.SCENE, 'Player created', { position: player.position });
        
        // Initialize player physics properties
        player.userData = {
            health: 100,
            maxHealth: 100,
            velocity: new THREE.Vector3(0, 0, 0),
            mouseSensitivity: 0.002,
            isGrounded: false,
            isDead: false,
            gravity: -0.015,
            jumpForce: 0.3,
            terminalVelocity: -0.5
        };
        
        // Add player to scene
        scene.add(player);
        
        // Add health bar to player
        addHealthBar(player);
        
        // Create NPCs
        debugLog(DEBUG_CATEGORIES.SCENE, 'Creating NPCs');
        const npcs = createNPCs(scene, collisionSystem, 10);
        debugLog(DEBUG_CATEGORIES.SCENE, 'NPCs created', { count: npcs.length });
        
        // Create camera first
        debugLog(DEBUG_CATEGORIES.SCENE, 'Creating camera');
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.name = 'camera';
        scene.add(camera);
        camera.position.set(0, 10, 20);
        camera.lookAt(0, 0, 0);
        debugLog(DEBUG_CATEGORIES.SCENE, 'Camera created and added to scene', {
            name: camera.name,
            position: camera.position,
            parent: camera.parent?.type || 'none'
        });
        
        // Initialize controls after camera is created
        debugLog(DEBUG_CATEGORIES.SCENE, 'Initializing controls');
        const controls = initMovementControls(player);
        const mouseControls = initMouseControls(player, camera);
        
        // Initialize combat system
        debugLog(DEBUG_CATEGORIES.SCENE, 'Initializing combat');
        initCombat(scene, player);
        
        // Create renderer
        debugLog(DEBUG_CATEGORIES.SCENE, 'Creating renderer');
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.setClearColor(0x87CEEB, 1);
        
        // Setup game container
        debugLog(DEBUG_CATEGORIES.SCENE, 'Setting up game container');
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            throw new Error('Game container not found');
        }
        
        while (gameContainer.firstChild) {
            gameContainer.removeChild(gameContainer.firstChild);
        }
        
        gameContainer.appendChild(renderer.domElement);
        debugLog(DEBUG_CATEGORIES.SCENE, 'Renderer added to game container');
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            debugLog(DEBUG_CATEGORIES.SCENE, 'Window resized', { width, height });
        });
        
        // Animation loop
        let lastTime = 0;
        
        function animate(time) {
            if (typeof requestAnimationFrame === 'undefined') return;
            
            const deltaTime = time - lastTime;
            lastTime = time;
            
            try {
                // Skip updates if player is dead
                if (player.userData.isDead) {
                    renderer.render(scene, camera);
                    requestAnimationFrame(animate);
                    return;
                }
                
                // Update player movement and physics
                const movement = updatePlayerPosition(player, controls, deltaTime);
                
                if (!player.userData.isDead) {
                    if (!player.userData.isGrounded) {
                        player.userData.velocity.y = Math.max(
                            player.userData.velocity.y + player.userData.gravity,
                            player.userData.terminalVelocity
                        );
                    } else {
                        player.userData.velocity.y = 0;
                    }
                    
                    movement.y += player.userData.velocity.y;
                    
                    const collision = collisionSystem.checkCollision(player.position, movement);
                    
                    if (collision.hasCollision) {
                        player.position.add(collision.adjustedMovement);
                        player.userData.isGrounded = collision.isGrounded;
                        if (collision.isGrounded) {
                            player.userData.velocity.y = 0;
                        }
                    } else {
                        player.position.add(movement);
                        const groundCheck = collisionSystem.checkCollision(
                            player.position,
                            new THREE.Vector3(0, -0.1, 0)
                        );
                        player.userData.isGrounded = groundCheck.hasCollision;
                    }
                    
                    if (player.position.y < 0) {
                        player.position.y = 0;
                        player.userData.isGrounded = true;
                        player.userData.velocity.y = 0;
                    }
                }
                
                // Update camera
                updateCamera(camera, player, mouseControls.verticalAngle || 0);
                
                // Check projectile hits
                scene.children.forEach(projectile => {
                    if (projectile.name === 'cheese-projectile' && projectile.userData.fromNPC && !projectile.userData.hasCollided) {
                        const playerBounds = new THREE.Box3();
                        const center = player.position.clone();
                        center.y += NPC_HITBOX_HEIGHT / 2;
                        
                        playerBounds.setFromCenterAndSize(
                            center,
                            new THREE.Vector3(
                                NPC_HITBOX_WIDTH * 1.5,
                                NPC_HITBOX_HEIGHT * 1.2,
                                NPC_HITBOX_DEPTH * 1.5
                            )
                        );
                        
                        const playerSphere = new THREE.Sphere(
                            center,
                            Math.max(NPC_HITBOX_WIDTH, NPC_HITBOX_HEIGHT, NPC_HITBOX_DEPTH)
                        );
                        
                        const projectileBounds = new THREE.Box3().setFromObject(projectile);
                        const projectileCenter = new THREE.Vector3();
                        projectileBounds.getCenter(projectileCenter);
                        
                        if (playerBounds.intersectsBox(projectileBounds) || 
                            projectileCenter.distanceTo(center) <= playerSphere.radius) {
                            projectile.userData.hasCollided = true;
                            
                            if (!player.userData.isInvulnerable) {
                                const damageAmount = player.userData.maxHealth * 0.25;
                                
                                if (player.userData.health > 0) {
                                    player.userData.health = Math.max(0, player.userData.health - damageAmount);
                                    
                                    if (player.userData.healthBar && player.userData.healthIndicator) {
                                        const healthPercent = player.userData.health / player.userData.maxHealth;
                                        const indicator = player.userData.healthIndicator;
                                        
                                        indicator.scale.x = Math.max(0, healthPercent);
                                        indicator.position.x = (healthPercent - 1) / 2;
                                        
                                        const color = indicator.material.color;
                                        if (healthPercent > 0.6) {
                                            color.setHex(0x00FF00);
                                        } else if (healthPercent > 0.3) {
                                            color.setHex(0xFFFF00);
                                        } else {
                                            color.setHex(0xFF0000);
                                        }
                                    }
                                    
                                    flashNPC(player);
                                    
                                    const hitPosition = player.position.clone();
                                    hitPosition.y += NPC_HITBOX_HEIGHT / 2;
                                    createImpactEffect(scene, hitPosition, true);
                                    
                                    if (player.userData.health <= 0) {
                                        player.userData.isDead = true;
                                        player.userData.healthBar.visible = false;
                                        player.rotation.z = Math.PI / 2;
                                        player.userData.velocity.set(0, 0, 0);
                                        player.userData.isGrounded = true;
                                        
                                        setTimeout(() => {
                                            player.userData.health = player.userData.maxHealth;
                                            player.userData.isDead = false;
                                            player.userData.healthBar.visible = true;
                                            
                                            if (player.userData.healthIndicator) {
                                                player.userData.healthIndicator.scale.x = 1;
                                                player.userData.healthIndicator.position.x = 0;
                                                player.userData.healthIndicator.material.color.setHex(0x00FF00);
                                            }
                                            
                                            player.rotation.z = 0;
                                            
                                            const spawnPoint = findValidSpawnPoint(collisionSystem, new Set());
                                            player.position.copy(spawnPoint);
                                            player.position.y = 0.1;
                                            
                                            player.userData.velocity.set(0, 0, 0);
                                            player.userData.isGrounded = true;
                                            
                                            updateHUD(player.userData.health);
                                        }, 3000);
                                    } else {
                                        player.userData.isInvulnerable = true;
                                        setTimeout(() => {
                                            player.userData.isInvulnerable = false;
                                        }, 500);
                                    }
                                }
                            }
                            
                            scene.remove(projectile);
                        }
                    }
                });
                
                // Update game elements
                updateProjectiles(scene, collisionSystem);
                updateNPCs(scene, player, collisionSystem);
                updateHUD(player.userData.health);
                
                if (player.userData.healthBar) {
                    player.userData.healthBar.lookAt(camera.position);
                }
                
                renderer.render(scene, camera);
                requestAnimationFrame(animate);
            } catch (error) {
                console.error('Error in animation loop:', error);
            }
        }
        
        debugLog(DEBUG_CATEGORIES.SCENE, 'Starting animation loop');
        animate(0);
        debugLog(DEBUG_CATEGORIES.SCENE, 'Animation loop started');
        
        // Initialize audio system
        const audioManager = await initializeAudio();
        setupAudioContext(audioManager);
        
        // Store audio manager in scene and player for easy access
        scene.userData.audioManager = audioManager;
        player.userData.audioManager = audioManager;
        
        // Start background music (will only play after user interaction)
        audioManager.playMusic(MUSIC_TRACKS.MAIN_THEME, true);

        return {
            scene,
            camera,
            renderer,
            player,
            collisionSystem,
            audioManager,
            damagePlayer: (damage) => {
                if (player.userData.isDead) return;
                
                player.userData.health = Math.max(0, player.userData.health - damage);
                
                if (player.userData.healthBar && player.userData.healthIndicator) {
                    const healthPercent = player.userData.health / player.userData.maxHealth;
                    const indicator = player.userData.healthIndicator;
                    
                    indicator.scale.x = Math.max(0, healthPercent);
                    indicator.position.x = (healthPercent - 1) / 2;
                    
                    const color = indicator.material.color;
                    if (healthPercent > 0.6) {
                        color.setHex(0x00FF00);
                    } else if (healthPercent > 0.3) {
                        color.setHex(0xFFFF00);
                    } else {
                        color.setHex(0xFF0000);
                    }
                }
                
                flashNPC(player);
                
                if (player.userData.health <= 0) {
                    player.userData.isDead = true;
                    player.userData.healthBar.visible = false;
                    player.rotation.z = Math.PI / 2;
                    player.userData.velocity.set(0, 0, 0);
                    player.userData.isGrounded = true;
                    
                    setTimeout(() => {
                        player.userData.health = player.userData.maxHealth;
                        player.userData.isDead = false;
                        player.userData.healthBar.visible = true;
                        
                        if (player.userData.healthIndicator) {
                            player.userData.healthIndicator.scale.x = 1;
                            player.userData.healthIndicator.position.x = 0;
                            player.userData.healthIndicator.material.color.setHex(0x00FF00);
                        }
                        
                        player.rotation.z = 0;
                        
                        const spawnPoint = findValidSpawnPoint(collisionSystem, new Set());
                        player.position.copy(spawnPoint);
                        player.position.y = 0.1;
                        
                        player.userData.velocity.set(0, 0, 0);
                        player.userData.isGrounded = true;
                        
                        updateHUD(player.userData.health);
                    }, 3000);
                } else {
                    player.userData.isInvulnerable = true;
                    setTimeout(() => {
                        player.userData.isInvulnerable = false;
                    }, 500);
                }
            }
        };
    } catch (error) {
        console.error('Error initializing scene:', error);
        throw error;
    }
} 