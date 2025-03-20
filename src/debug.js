// Last updated: 2025-03-20T00:46:17.918Z
// Debug helper to verify that code changes are being loaded correctly

const DEBUG_CATEGORIES = {
    COMBAT: 'COMBAT',
    MOVEMENT: 'MOVEMENT',
    SCENE: 'SCENE',
    MULTIPLAYER: 'MP',
    COLLISION: 'COLLISION'
};

// Only log these categories
const ENABLED_CATEGORIES = [DEBUG_CATEGORIES.COMBAT, DEBUG_CATEGORIES.SCENE];

// Version tracking - change this number when making updates to confirm changes are applied
export const DEBUG_VERSION = '1.0.0';

export function debugLog(category, message, data = null) {
    if (!ENABLED_CATEGORIES.includes(category)) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}][${category}]`;
    
    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

// Initialize debugging
export function initDebug() {
    debugLog(DEBUG_CATEGORIES.SCENE, 'Debug module loaded - version: ' + DEBUG_VERSION);
}

// Log map initialization
export function logMapInit(map) {
    debugLog(DEBUG_CATEGORIES.SCENE, 'Map initialized', {
        platforms: map.platforms.length,
        ramps: map.ramps.length,
        pipes: map.pipes.length,
        walls: map.walls.length
    });
}

// Log collision events
export function logCollision(collision) {
    if (collision && collision.hasCollision) {
        debugLog(DEBUG_CATEGORIES.COLLISION, 'Collision detected', collision);
    }
}

// Utility function to check if vite is in dev mode
export function isDevMode() {
    return import.meta.env && import.meta.env.DEV === true;
}

// Export categories for use in other files
export { DEBUG_CATEGORIES };