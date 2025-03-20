// Scene tests for Rat Detective
import { Scene, PerspectiveCamera } from 'three';
import { initScene, createRat } from '../src/scene.js';

// Mock canvas element
const mockCanvas = {
    style: {},
    getContext: () => ({})
};

jest.mock('three', () => {
    const originalModule = jest.requireActual('three');
    return {
        ...originalModule,
        WebGLRenderer: jest.fn().mockImplementation(() => ({
            setSize: jest.fn(),
            domElement: mockCanvas,
            render: jest.fn()
        }))
    };
});

describe('Scene initialization', () => {
    let scene;

    beforeEach(() => {
        // Mock document methods
        document.body.innerHTML = '<div id="game-container"></div>';
        scene = initScene().scene;
    });

    test('Scene contains basic environment elements', () => {
        // Should have at least 4 meshes: floor, 2 walls, skybox
        expect(scene.children.length).toBeGreaterThanOrEqual(4);
        
        // Check for floor
        const floor = scene.children.find(child => child.name === 'floor');
        expect(floor).toBeDefined();
        expect(floor.material.color.getHexString()).toBe('808080'); // gray

        // Check for walls
        const walls = scene.children.filter(child => child.name === 'wall');
        expect(walls.length).toBeGreaterThanOrEqual(2);
        expect(walls[0].material.color.getHexString()).toBe('008000'); // green
    });

    test('Rat model is present and properly positioned', () => {
        const rat = scene.children.find(child => child.name === 'rat');
        expect(rat).toBeDefined();
        expect(rat.position.y).toBeGreaterThan(0); // Should be above floor
        expect(rat.position.x).toBe(0); // Centered on x-axis
        expect(rat.position.z).toBe(0); // Centered on z-axis
    });
}); 