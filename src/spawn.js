import * as THREE from 'three';

/**
 * Find a valid spawn point that doesn't collide with geometry
 * @param {CollisionSystem} collisionSystem - The collision system
 * @param {Set} usedPositions - Set of positions already used
 * @param {number} attempts - Maximum number of attempts to find valid position
 * @returns {THREE.Vector3} Valid spawn position
 */
export function findValidSpawnPoint(collisionSystem, usedPositions = new Set(), attempts = 50) {
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

    // Randomize safe spots order for variety
    const randomizedSpots = [...safeSpots].sort(() => Math.random() - 0.5);

    // Try safe spots first
    for (const spot of randomizedSpots) {
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

    // If safe spots don't work, try random positions with minimum distance from other entities
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
    // As a last resort, try the origin with a random offset
    const fallbackPosition = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
    );
    console.log('Using fallback spawn position:', fallbackPosition);
    return fallbackPosition;
} 