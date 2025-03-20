// Simple build script to ensure changes are applied
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Update version number in debug.js
const debugFilePath = path.join(__dirname, 'src', 'debug.js');
let debugContent = fs.readFileSync(debugFilePath, 'utf8');
const currentVersion = debugContent.match(/DEBUG_VERSION\s*=\s*(\d+)/)[1];
const newVersion = parseInt(currentVersion) + 1;
debugContent = debugContent.replace(/DEBUG_VERSION\s*=\s*\d+/, `DEBUG_VERSION = ${newVersion}`);
fs.writeFileSync(debugFilePath, debugContent);

console.log(`Updated DEBUG_VERSION to ${newVersion}`);

// Timestamp all JS files to force browser reload
const srcDir = path.join(__dirname, 'src');
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add or update timestamp comment at the top of file
    const timestamp = new Date().toISOString();
    if (content.includes('// Last updated:')) {
      content = content.replace(/\/\/ Last updated: .*\n/, `// Last updated: ${timestamp}\n`);
    } else {
      content = `// Last updated: ${timestamp}\n${content}`;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated timestamp in ${file}`);
  }
});

// Create a new index file with cache busting
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add cache busting query parameter to script import
indexContent = indexContent.replace(
  /import { initScene } from '\.\/src\/scene\.js'/,
  `import { initScene } from './src/scene.js?v=${newVersion}'`
);

fs.writeFileSync(indexPath, indexContent);
console.log('Updated index.html with cache busting');

// Start the dev server
console.log('Starting dev server...');
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start dev server:', error);
} 