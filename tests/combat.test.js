import { Scene, WebGLRenderer, PerspectiveCamera, Vector3, Euler } from 'three';
import { initCombat, fireCheeseGun, updateHUD } from '../src/combat.js';

describe('Combat System', () => {
    let scene, player, hud;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="hud">
                <div id="health">100</div>
                <div id="ammo">∞</div>
            </div>
        `;
        
        scene = new Scene();
        player = {
            position: new Vector3(0, 0.5, 0),
            rotation: new Euler(0, 0, 0, 'XYZ'),
            health: 100
        };
        hud = document.getElementById('hud');
    });

    test('Cheese gun creates projectile on fire', () => {
        const combat = initCombat(scene, player);
        const initialProjectiles = scene.children.length;
        fireCheeseGun(combat);
        expect(scene.children.length).toBe(initialProjectiles + 1);
        
        const projectile = scene.children[scene.children.length - 1];
        expect(projectile.name).toBe('cheese-projectile');
        
        // Account for the Y offset in projectile position
        const expectedPosition = player.position.clone();
        expectedPosition.y += 0.5;
        expect(projectile.position.distanceTo(expectedPosition)).toBeLessThan(0.1);
    });

    test('HUD shows correct health and ammo', () => {
        const combat = initCombat(scene, player);
        updateHUD(player.health);
        
        const healthDisplay = document.getElementById('health');
        const ammoDisplay = document.getElementById('ammo');
        
        expect(healthDisplay.textContent).toBe('100');
        expect(ammoDisplay.textContent).toBe('∞');
    });

    test('Cheese projectile has correct properties', () => {
        const combat = initCombat(scene, player);
        fireCheeseGun(combat);
        
        const projectile = scene.children.find(child => child.name === 'cheese-projectile');
        expect(projectile).toBeDefined();
        expect(projectile.userData.damage).toBe(10);
        expect(projectile.userData.speed).toBeGreaterThan(0);
    });
}); 