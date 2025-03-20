import { Scene, Vector3 } from 'three';
import { initMovementControls, handleKeyDown, handleKeyUp, updatePlayerPosition } from '../src/movement.js';

jest.mock('three', () => {
    const originalModule = jest.requireActual('three');
    return {
        ...originalModule,
        WebGLRenderer: jest.fn().mockImplementation(() => ({
            setSize: jest.fn(),
            domElement: { style: {} },
            render: jest.fn()
        }))
    };
});

// Mock nipplejs
jest.mock('nipplejs', () => ({
    create: jest.fn().mockReturnValue({
        on: jest.fn(),
        off: jest.fn()
    })
}));

describe('Movement Controls', () => {
    let scene, player, controls;

    beforeEach(() => {
        // Mock document methods
        document.body.innerHTML = '<div id="game-container"></div>';
        
        scene = new Scene();
        player = {
            position: new Vector3(0, 0.5, 0),
            rotation: { y: 0 },
            velocity: new Vector3(0, 0, 0)
        };
        controls = initMovementControls(player);
    });

    test('WASD keys update movement state', () => {
        // Test W key
        handleKeyDown({ code: 'KeyW' }, controls);
        expect(controls.moveForward).toBe(true);
        handleKeyUp({ code: 'KeyW' }, controls);
        expect(controls.moveForward).toBe(false);

        // Test S key
        handleKeyDown({ code: 'KeyS' }, controls);
        expect(controls.moveBackward).toBe(true);
        handleKeyUp({ code: 'KeyS' }, controls);
        expect(controls.moveBackward).toBe(false);

        // Test A key
        handleKeyDown({ code: 'KeyA' }, controls);
        expect(controls.moveLeft).toBe(true);
        handleKeyUp({ code: 'KeyA' }, controls);
        expect(controls.moveLeft).toBe(false);

        // Test D key
        handleKeyDown({ code: 'KeyD' }, controls);
        expect(controls.moveRight).toBe(true);
        handleKeyUp({ code: 'KeyD' }, controls);
        expect(controls.moveRight).toBe(false);
    });

    test('Jump key updates jump state', () => {
        handleKeyDown({ code: 'Space' }, controls, player);
        expect(controls.jump).toBe(true);
        expect(player.velocity.y).toBeGreaterThan(0);
        handleKeyUp({ code: 'Space' }, controls);
        expect(controls.jump).toBe(false);
    });

    test('Player movement updates position', () => {
        // Move forward
        controls.moveForward = true;
        const initialZ = player.position.z;
        updatePlayerPosition(player, controls);
        expect(player.position.z).toBeLessThan(initialZ);

        // Move backward
        controls.moveForward = false;
        controls.moveBackward = true;
        const currentZ = player.position.z;
        updatePlayerPosition(player, controls);
        expect(player.position.z).toBeGreaterThan(currentZ);
    });

    test('Player cannot fall below ground level', () => {
        player.velocity.y = -10;
        updatePlayerPosition(player, controls);
        expect(player.position.y).toBeGreaterThanOrEqual(0.5);
    });

    test('Player has gravity applied when in air', () => {
        player.position.y = 2;
        player.velocity.y = 0;
        updatePlayerPosition(player, controls);
        expect(player.velocity.y).toBeLessThan(0);
    });
}); 