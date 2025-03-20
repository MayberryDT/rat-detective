// Rat appearance configuration

// Rat body colors
export const RAT_COLORS = {
    TAN: 0xD2B48C,
    BROWN: 0x8B4513,
    BLACK: 0x1A1A1A,
    WHITE: 0xFFFFFF,
    RED: 0x8B0000,
};

// Hat styles
export const HAT_STYLES = {
    FEDORA: {
        height: 0.18,          // Taller
        brimWidth: 0.35,       // Wider brim
        brimHeight: 0.02,
        topRadius: 0.20,       // Narrower at top
        bottomRadius: 0.24     // Wider at bottom for taper
    },
    BOWLER: {
        height: 0.12,          // Kept short
        brimWidth: 0.25,       // Slightly narrower brim
        brimHeight: 0.02,
        topRadius: 0.28,       // Wider and more rounded
        bottomRadius: 0.28     // Same radius for roundness
    }
};

// Hat colors
export const HAT_COLORS = {
    BLACK: 0x1A1A1A,
    NAVY: 0x000080,
    BEIGE: 0xF5F5DC,
    GREEN: 0x006400,
    MAROON: 0x800000
};

// Generate all possible combinations
const combinations = [];
Object.entries(RAT_COLORS).forEach(([ratColorName, ratColor]) => {
    Object.entries(HAT_STYLES).forEach(([hatStyleName, hatStyle]) => {
        Object.entries(HAT_COLORS).forEach(([hatColorName, hatColor]) => {
            combinations.push({
                ratColor,
                hatColor,
                hatStyle,
                id: `${ratColorName}_${hatStyleName}_${hatColorName}`
            });
        });
    });
});

// Keep track of used combinations
let usedCombinations = new Set();

/**
 * Get a random unused appearance combination
 * @returns {Object} An appearance combination
 */
export function getRandomAppearance() {
    // If all combinations have been used, reset the tracking
    if (usedCombinations.size >= combinations.length) {
        usedCombinations.clear();
    }

    // Filter out used combinations
    const availableCombinations = combinations.filter(
        combo => !usedCombinations.has(combo.id)
    );

    // Get a random combination from available ones
    const randomIndex = Math.floor(Math.random() * availableCombinations.length);
    const selectedCombo = availableCombinations[randomIndex];
    
    // Mark this combination as used
    usedCombinations.add(selectedCombo.id);
    
    return selectedCombo;
}

/**
 * Get the total number of possible combinations
 * @returns {number} Total number of combinations
 */
export function getTotalCombinations() {
    return combinations.length;
} 