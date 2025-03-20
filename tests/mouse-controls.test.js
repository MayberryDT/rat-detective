import { Scene, PerspectiveCamera, Vector3, Euler } from 'three';
import { initMouseControls, handleMouseMove, updateCamera } from '../src/mouse-controls.js';

describe('Mouse Controls', () => {
    let scene, player, camera;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '<div id="game-container"></div>';
        
        // Mock pointer lock API
        document.exitPointerLock = jest.fn();
        document.documentElement.requestPointerLock = jest.fn();
        
        // Mock pointerLockElement without Object.defineProperty
        document.pointerLockElement = null;

        scene = new Scene();
        player = {
            position: new Vector3(0, 0.5, 0),
            rotation: new Euler(0, 0, 0, 'YXZ'),
            userData: { mouseSensitivity: 0.002 }
        };
        camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    });

    test('Mouse movement rotates player', () => {
        const controls = initMouseControls(player, camera);
        const initialRotationY = player.rotation.y;
        
        // Simulate mouse movement
        handleMouseMove({ movementX: 100, movementY: 0 }, controls);
        
        expect(player.rotation.y).not.toBe(initialRotationY);
        expect(player.rotation.y).toBe(initialRotationY - (100 * player.userData.mouseSensitivity));
    });

    test('Camera follows player at correct distance', () => {
        const controls = initMouseControls(player, camera);
        player.position.set(1, 1, 1);
        player.rotation.y = Math.PI / 4;

        updateCamera(camera, player);

        // Camera should be behind and slightly above player
        expect(camera.position.y).toBeGreaterThan(player.position.y);
        expect(camera.position.distanceTo(player.position)).toBeGreaterThan(2);
        expect(camera.position.distanceTo(player.position)).toBeLessThan(5);
    });

    test('Pointer lock is requested on click', () => {
        const controls = initMouseControls(player, camera);
        document.getElementById('game-container').click();
        
        expect(document.documentElement.requestPointerLock).toHaveBeenCalled();
    });

    test('Camera rotation is limited vertically', () => {
        const controls = initMouseControls(player, camera);
        
        // Try to look too far up
        handleMouseMove({ movementX: 0, movementY: -1000 }, controls);
        expect(controls.verticalAngle).toBeLessThan(Math.PI / 2);
        
        // Try to look too far down
        handleMouseMove({ movementX: 0, movementY: 1000 }, controls);
        expect(controls.verticalAngle).toBeGreaterThan(-Math.PI / 2);
    });
}); 