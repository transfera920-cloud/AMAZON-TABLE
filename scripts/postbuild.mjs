import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const targetSubdir = path.resolve(distDir, 'tool01');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist!');
  process.exit(1);
}

// Ensure dist/tool01 exists
fs.mkdirSync(targetSubdir, { recursive: true });

// Copy index.html -> dist/tool01/index.html
const srcIndex = path.join(distDir, 'index.html');
const destIndex = path.join(targetSubdir, 'index.html');
if (fs.existsSync(srcIndex)) {
  fs.copyFileSync(srcIndex, destIndex);
  console.log(`[postbuild] Created ${destIndex}`);
} else {
  console.error(`[postbuild] Source index.html not found at ${srcIndex}`);
  process.exit(1);
}

// Copy assets directory -> dist/tool01/assets if it exists
const srcAssets = path.join(distDir, 'assets');
const destAssets = path.join(targetSubdir, 'assets');
if (fs.existsSync(srcAssets)) {
  fs.cpSync(srcAssets, destAssets, { recursive: true });
  console.log(`[postbuild] Copied assets to ${destAssets}`);
}

console.log('[postbuild] Build verification passed: dist/tool01/index.html exists and is ready.');
