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
        mouseSensitivity: 0.002,
        touchSensitivity: 0.005,
        lastTouchX: 0,
        lastTouchY: 0
    };

    // Set initial camera position relative to player
    updateCamera(camera, player);

    // Handle pointer lock
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error('Game container not found for mouse controls');
        return controls;
    }

    // Add touch camera controls for mobile
    if ('ontouchstart' in window) {
        // Create camera control area that covers the whole screen
        const cameraControl = document.createElement('div');
        cameraControl.id = 'camera-control';
        cameraControl.style.position = 'absolute';
        cameraControl.style.left = '0';
        cameraControl.style.top = '0';
        cameraControl.style.width = '100%';
        cameraControl.style.height = '100%';
        cameraControl.style.zIndex = '1';
        cameraControl.style.pointerEvents = 'none'; // Initially disable pointer events
        document.body.appendChild(cameraControl);

        let touchActive = false;
        let touchStartX = 0;
        let touchStartY = 0;

        // Handle touch events on the document level
        document.addEventListener('touchstart', (event) => {
            // Check if the touch is on a UI element
            const target = event.target;
            if (target.tagName.toLowerCase() === 'button' || 
                target.id === 'joystick-container' ||
                target.closest('#joystick-container')) {
                return; // Don't handle touch events on UI elements
            }

            event.preventDefault();
            touchActive = true;
            const touch = event.touches[0];
            controls.lastTouchX = touch.clientX;
            controls.lastTouchY = touch.clientY;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        document.addEventListener('touchmove', (event) => {
            if (!touchActive) return;

            // If the touch started on a UI element, don't handle it
            if (Math.abs(event.touches[0].clientX - touchStartX) < 10 &&
                Math.abs(event.touches[0].clientY - touchStartY) < 10) {
                return;
            }

            event.preventDefault();
            const touch = event.touches[0];
            const movementX = touch.clientX - controls.lastTouchX;
            const movementY = touch.clientY - controls.lastTouchY;

            // Update player rotation (horizontal movement)
            player.rotation.y -= movementX * controls.touchSensitivity;

            // Update vertical angle with wider range
            controls.verticalAngle = Math.max(
                -VERTICAL_LIMIT,
                Math.min(VERTICAL_LIMIT, controls.verticalAngle + movementY * controls.touchSensitivity)
            );

            // Store vertical angle in player for projectile firing
            player.userData.verticalAngle = controls.verticalAngle;

            // Update camera position
            updateCamera(camera, player, controls.verticalAngle);

            controls.lastTouchX = touch.clientX;
            controls.lastTouchY = touch.clientY;
        }, { passive: false });

        document.addEventListener('touchend', () => {
            touchActive = false;
        });

        document.addEventListener('touchcancel', () => {
            touchActive = false;
        });
    }

    // Desktop mouse controls
    gameContainer.addEventListener('click', () => {
        if (!controls.isLocked && !('ontouchstart' in window)) {
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