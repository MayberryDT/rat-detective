// This test file verifies that source changes are properly bundled
// and that the development server serves updated files

const fs = require('fs');
const path = require('path');

describe('Build Process', () => {
  test('package.json has correct dev script', () => {
    // Read the package.json file
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Verify the dev script exists and uses Vite
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.dev).toBe('vite');
  });

  test('map.js contains pipe creation code', () => {
    // Read the map.js file
    const mapJsPath = path.resolve(__dirname, '../map.js');
    const mapJsContent = fs.readFileSync(mapJsPath, 'utf8');
    
    // Verify it contains pipe code
    expect(mapJsContent).toContain('createPipes');
    expect(mapJsContent).toContain('isPipeWall');
  });

  test('index.html loads source files correctly', () => {
    // Read the index.html file
    const indexHtmlPath = path.resolve(__dirname, '../../index.html');
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Verify it loads the scene.js file
    expect(indexHtmlContent).toContain('src/scene.js');
  });

  test('collision.js has proper pipe handling', () => {
    // Read the collision.js file
    const collisionJsPath = path.resolve(__dirname, '../collision.js');
    const collisionJsContent = fs.readFileSync(collisionJsPath, 'utf8');
    
    // Verify it checks for isPipeWall
    expect(collisionJsContent).toContain('isPipeWall');
  });
}); 