// Last updated: 2025-03-20T03:43:34.643Z
import * as THREE from 'three';
import nipplejs from 'nipplejs';

export function initMovementControls(player) {
    const keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false
    };

    const moveSpeed = 0.15;
    const jumpForce = 0.3;
    const gravity = 0.018;
    const maxFallSpeed = 0.6;
    
    // Track if player is grounded
    let isGrounded = true;

    // Set up keyboard controls
    if (typeof window !== 'undefined' && !process.env.NODE_ENV?.includes('test')) {
        window.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w': keys.forward = true; break;
                case 's': keys.backward = true; break;
                case 'a': keys.left = true; break;
                case 'd': keys.right = true; break;
                case ' ': 
                    keys.jump = true;
                    break;
            }
        });

        window.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w': keys.forward = false; break;
                case 's': keys.backward = false; break;
                case 'a': keys.left = false; break;
                case 'd': keys.right = false; break;
                case ' ': keys.jump = false; break;
            }
        });
    }

    // Set up mobile controls
    let joystick = null;
    if (typeof window !== 'undefined' && !process.env.NODE_ENV?.includes('test')) {
        // Lock screen orientation to landscape
        if (window.screen && window.screen.orientation) {
            try {
                window.screen.orientation.lock('landscape');
            } catch (e) {
                console.warn('Could not lock screen orientation:', e);
            }
        }

        // Only show mobile controls on touch devices
        if ('ontouchstart' in window) {
            const zone = document.createElement('div');
            zone.style.width = '150px';
            zone.style.height = '150px';
            zone.style.position = 'absolute';
            zone.style.bottom = '20px';
            zone.style.left = '20px';
            document.body.appendChild(zone);

            joystick = nipplejs.create({
                zone: zone,
                mode: 'static',
                position: { left: '75px', bottom: '75px' },
                color: 'white',
                size: 150
            });

            joystick.on('move', (evt, data) => {
                const angle = data.angle.radian;
                const force = Math.min(data.force, 1);

                // Reset all movement flags
                keys.forward = false;
                keys.backward = false;
                keys.left = false;
                keys.right = false;

                // Correct mapping for landscape mode
                // Forward (up) = -PI/2, Backward (down) = PI/2
                // Left = PI, Right = 0
                if (Math.abs(Math.sin(angle)) > 0.5) {
                    keys.forward = Math.sin(angle) > 0;
                    keys.backward = Math.sin(angle) < 0;
                }
                if (Math.abs(Math.cos(angle)) > 0.5) {
                    keys.left = Math.cos(angle) < 0;
                    keys.right = Math.cos(angle) > 0;
                }
            });

            joystick.on('end', () => {
                keys.forward = false;
                keys.backward = false;
                keys.left = false;
                keys.right = false;
            });

            // Create button container for better organization
            const buttonContainer = document.createElement('div');
            buttonContainer.style.position = 'absolute';
            buttonContainer.style.bottom = '20px';
            buttonContainer.style.right = '20px';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '20px';
            document.body.appendChild(buttonContainer);

            // Add jump button
            const jumpButton = document.createElement('button');
            jumpButton.textContent = 'Jump';
            jumpButton.style.width = '80px';
            jumpButton.style.height = '80px';
            jumpButton.style.borderRadius = '50%';
            jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            jumpButton.style.border = 'none';
            jumpButton.style.fontSize = '18px';
            jumpButton.style.fontWeight = 'bold';
            buttonContainer.appendChild(jumpButton);

            jumpButton.addEventListener('touchstart', () => keys.jump = true);
            jumpButton.addEventListener('touchend', () => keys.jump = false);

            // Add cheese button (this will be used by the combat system)
            const cheeseButton = document.createElement('button');
            cheeseButton.textContent = '🧀';
            cheeseButton.style.width = '80px';
            cheeseButton.style.height = '80px';
            cheeseButton.style.borderRadius = '50%';
            cheeseButton.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            cheeseButton.style.border = 'none';
            cheeseButton.style.fontSize = '40px';
            buttonContainer.appendChild(cheeseButton);

            // Make the cheese button available globally for the combat system
            window.mobileCheeseButton = cheeseButton;
        }
    }

    return {
        keys,
        getMovement: () => {
            const movement = new THREE.Vector3();

            // Calculate horizontal movement
            if (keys.forward) movement.z -= moveSpeed;
            if (keys.backward) movement.z += moveSpeed;
            if (keys.left) movement.x -= moveSpeed;
            if (keys.right) movement.x += moveSpeed;

            // Normalize diagonal movement
            if (movement.length() > moveSpeed) {
                movement.normalize().multiplyScalar(moveSpeed);
            }

            // Apply jump force when jump key is pressed and player is grounded
            if (keys.jump && player.userData.isGrounded) {
                player.velocity.y = jumpForce;
                player.userData.isGrounded = false;
                
                // Add a small horizontal boost when jumping to make it feel more responsive
                if (keys.forward) movement.z *= 1.2;
                if (keys.backward) movement.z *= 1.2;
                if (keys.left) movement.x *= 1.2;
                if (keys.right) movement.x *= 1.2;
            }

            // Apply gravity with terminal velocity
            player.velocity.y = Math.max(-maxFallSpeed, player.velocity.y - gravity);
            movement.y = player.velocity.y;

            // Rotate movement based on player rotation
            const horizontalMovement = new THREE.Vector3(movement.x, 0, movement.z)
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
            
            movement.x = horizontalMovement.x;
            movement.z = horizontalMovement.z;

            return movement;
        }
    };
}

export function updatePlayerPosition(player, controls, applyMovement = true) {
    const movement = controls.getMovement();
    
    if (applyMovement) {
        player.position.add(movement);
    }
    
    return movement;
} 