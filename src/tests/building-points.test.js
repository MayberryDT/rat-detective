import { Vector3, Scene } from 'three';
import { SewerMap } from '../map';
import { isPointInsideBuilding, getPointsInsideBuildings } from '../building-points';

describe('Building Point Detection', () => {
  let map;
  let scene;
  
  beforeEach(() => {
    scene = new Scene();
    map = new SewerMap();
    map.init(scene); // Initialize the map with the scene
  });

  describe('isPointInsideBuilding', () => {
    test('should return true for point inside a building', () => {
      // Building at (60, 14, -35) has size [6, 28, 6]
      const point = new Vector3(60, 14, -35);
      expect(isPointInsideBuilding(point, map)).toBe(true);
    });

    test('should return false for point outside buildings', () => {
      // Test point in open space between buildings
      const point = new Vector3(-90, 5, -90);
      expect(isPointInsideBuilding(point, map)).toBe(false);
    });

    test('should return false for point above buildings', () => {
      // Building at (60, 14, -35) has height 28
      const point = new Vector3(60, 30, -35); // Above the building's height
      expect(isPointInsideBuilding(point, map)).toBe(false);
    });

    test('should handle edge cases near building boundaries', () => {
      // Building at (60, 14, -35) has size [6, 28, 6]
      // So its bounds are:
      // x: 57 to 63
      // y: 0 to 28
      // z: -38 to -32
      const edgePoint = new Vector3(63, 14, -35); // At the edge
      const justOutside = new Vector3(63.1, 14, -35); // Slightly outside
      const justInside = new Vector3(62.9, 14, -35); // Slightly inside
      
      expect(isPointInsideBuilding(edgePoint, map)).toBe(true);
      expect(isPointInsideBuilding(justOutside, map)).toBe(false);
      expect(isPointInsideBuilding(justInside, map)).toBe(true);
    });
  });

  describe('getPointsInsideBuildings', () => {
    test('should identify all points inside buildings from a list', () => {
      const testPoints = [
        new Vector3(-90, 5, -90),    // Outside
        new Vector3(60, 14, -35),    // Inside building at (60, 14, -35)
        new Vector3(60, 30, -35),    // Above building
        new Vector3(-35, 12, 60),    // Inside building at (-35, 10, 60)
        new Vector3(-10, 5, -10),    // Outside
      ];

      const insidePoints = getPointsInsideBuildings(testPoints, map);
      expect(insidePoints).toHaveLength(2);
      expect(insidePoints).toContainEqual(testPoints[1]); // 60, 14, -35
      expect(insidePoints).toContainEqual(testPoints[3]); // -35, 12, 60
    });

    test('should return empty array for no points inside buildings', () => {
      const outsidePoints = [
        new Vector3(-90, 5, -90),   // Far from buildings
        new Vector3(-85, 5, -85),   // Far from buildings
        new Vector3(-90, 60, -90),  // High up
      ];

      const insidePoints = getPointsInsideBuildings(outsidePoints, map);
      expect(insidePoints).toHaveLength(0);
    });

    test('should handle empty input array', () => {
      const insidePoints = getPointsInsideBuildings([], map);
      expect(insidePoints).toHaveLength(0);
    });
  });
}); 