import { Raycaster, Vector3 } from 'three';

/**
 * Checks if a point is inside any building in the map
 * @param {Vector3} point - The point to check
 * @param {SewerMap} map - The map containing buildings
 * @returns {boolean} - True if point is inside a building, false otherwise
 */
export function isPointInsideBuilding(point, map) {
    // Get all buildings from the map
    const buildings = map.buildings;
    
    // For each building, check if the point is inside its bounds
    for (const building of buildings) {
        // Get building dimensions and position
        const geometry = building.geometry;
        const position = building.position;
        const size = {
            x: geometry.parameters.width,
            y: geometry.parameters.height,
            z: geometry.parameters.depth
        };
        
        // Calculate building bounds with a small epsilon to handle floating point precision
        const epsilon = 0.001;
        const halfWidth = size.x / 2 + epsilon;
        const halfDepth = size.z / 2 + epsilon;
        
        // Check if point is within the horizontal bounds of the building
        const withinX = Math.abs(point.x - position.x) <= halfWidth;
        const withinZ = Math.abs(point.z - position.z) <= halfDepth;
        
        // For Y bounds, check if point is between building's base and top
        // The building's y position is at half height, so:
        // - Base is at position.y - size.y/2
        // - Top is at position.y + size.y/2
        const withinY = point.y >= (position.y - size.y/2) && point.y <= (position.y + size.y/2);
        
        if (withinX && withinY && withinZ) {
            return true;
        }
    }
    
    return false;
}

/**
 * Gets all points from a list that are inside buildings
 * @param {Vector3[]} points - Array of points to check
 * @param {SewerMap} map - The map containing buildings
 * @returns {Vector3[]} - Array of points that are inside buildings
 */
export function getPointsInsideBuildings(points, map) {
    return points.filter(point => isPointInsideBuilding(point, map));
}

/**
 * Gets all buildings that contain the given point
 * @param {Vector3} point - The point to check
 * @param {SewerMap} map - The map containing buildings
 * @returns {Object[]} - Array of buildings containing the point
 */
export function getBuildingsContainingPoint(point, map) {
    return map.buildings.filter(building => {
        const geometry = building.geometry;
        const position = building.position;
        const size = {
            x: geometry.parameters.width,
            y: geometry.parameters.height,
            z: geometry.parameters.depth
        };
        
        // Calculate building bounds with a small epsilon
        const epsilon = 0.001;
        const halfWidth = size.x / 2 + epsilon;
        const halfDepth = size.z / 2 + epsilon;
        
        // Check if point is within the bounds of the building
        const withinX = Math.abs(point.x - position.x) <= halfWidth;
        const withinZ = Math.abs(point.z - position.z) <= halfDepth;
        
        // For Y bounds, check if point is between building's base and top
        const withinY = point.y >= (position.y - size.y/2) && point.y <= (position.y + size.y/2);
        
        return withinX && withinY && withinZ;
    });
}

/**
 * Checks if a line segment intersects with any building
 * @param {Vector3} start - Start point of the line
 * @param {Vector3} end - End point of the line
 * @param {SewerMap} map - The map containing buildings
 * @returns {boolean} - True if line intersects a building, false otherwise
 */
export function doesLineIntersectBuilding(start, end, map) {
    const raycaster = new Raycaster();
    const direction = end.clone().sub(start).normalize();
    const distance = start.distanceTo(end);
    
    raycaster.set(start, direction);
    
    // Check for intersections with buildings
    const intersects = raycaster.intersectObjects(map.buildings, false);
    
    // Return true if any intersection is closer than the end point
    return intersects.some(intersection => intersection.distance <= distance);
} 