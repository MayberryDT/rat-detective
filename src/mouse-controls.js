// Last updated: 2025-03-20T02:57:16.713Z
import * as THREE from 'three';

const CAMERA_DISTANCE = 4;
const CAMERA_HEIGHT = 2.5;
const VERTICAL_LIMIT = Math.PI / 2;

export function initMouseControls(player, camera) {
    const controls = {
        isLocked: false,
        verticalAngle: 0,
        horizontalAngle: 0,
        mouseSensitivity: 0.002
    };

    // Set initial camera position relative to player
    updateCamera(camera, player);

    // Handle pointer lock
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error('Game container not found for mouse controls');
        return controls;
    }

    gameContainer.addEventListener('click', () => {
        if (!controls.isLocked) {
            gameContainer.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        controls.isLocked = document.pointerLockElement === gameContainer;
        console.log('Pointer lock state:', controls.isLocked ? 'locked' : 'unlocked');
    });

    document.addEventListener('mousemove', (event) => {
        if (!controls.isLocked) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Update player rotation (horizontal movement)
        player.rotation.y -= movementX * controls.mouseSensitivity;

        // Update vertical angle with wider range
        controls.verticalAngle = Math.max(
            -VERTICAL_LIMIT,
            Math.min(VERTICAL_LIMIT, controls.verticalAngle + movementY * controls.mouseSensitivity)
        );

        // Store vertical angle in player for projectile firing
        player.userData.verticalAngle = controls.verticalAngle;

        // Update camera position
        updateCamera(camera, player, controls.verticalAngle);
    });

    return controls;
}

export function handleMouseMove(event, controls) {
    const { player } = controls;
    const sensitivity = player.userData.mouseSensitivity || 0.002;

    // Store old values for logging
    const oldRotationY = player.rotation.y;
    const oldVerticalAngle = controls.verticalAngle;

    // Horizontal rotation (affects player)
    player.rotation.y -= event.movementX * sensitivity;

    // Vertical rotation (affects camera angle)
    controls.verticalAngle = Math.max(
        -VERTICAL_LIMIT,
        Math.min(VERTICAL_LIMIT, controls.verticalAngle + event.movementY * sensitivity)
    );

    // Store vertical angle in player for projectile firing
    player.userData.verticalAngle = controls.verticalAngle;

    console.log('Mouse movement applied:', {
        movementX: event.movementX,
        movementY: event.movementY,
        sensitivity,
        rotationBefore: oldRotationY,
        rotationAfter: player.rotation.y,
        verticalBefore: oldVerticalAngle,
        verticalAfter: controls.verticalAngle
    });

    // Update camera position and rotation
    updateCamera(controls.camera, player, controls.verticalAngle);
}

export function updateCamera(camera, player, verticalAngle = 0) {
    const angle = player.rotation.y;
    const distance = CAMERA_DISTANCE;
    
    // Calculate base camera position behind and higher above player
    camera.position.x = player.position.x + Math.sin(angle) * distance;
    camera.position.z = player.position.z + Math.cos(angle) * distance;
    camera.position.y = player.position.y + CAMERA_HEIGHT;

    // Apply vertical angle with improved range
    if (verticalAngle) {
        camera.position.y += Math.sin(verticalAngle) * distance;
        const forwardDistance = Math.cos(verticalAngle) * distance;
        camera.position.x = player.position.x + Math.sin(angle) * forwardDistance;
        camera.position.z = player.position.z + Math.cos(angle) * forwardDistance;
    }

    // Look at point in front of player for better aiming
    const lookTarget = new THREE.Vector3(
        player.position.x - Math.sin(angle) * 2, // Look ahead of player
        player.position.y + 1.5, // Increased height for better aim perspective
        player.position.z - Math.cos(angle) * 2  // Look ahead of player
    );
    camera.lookAt(lookTarget);

    // Ensure camera is looking in the right direction
    camera.rotation.order = 'YXZ'; // This order is important for FPS controls
}