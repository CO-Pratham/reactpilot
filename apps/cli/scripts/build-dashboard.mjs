import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../..');
const webDir = path.join(rootDir, 'apps/web');
const cliDir = path.join(rootDir, 'apps/cli');
const outDir = path.join(webDir, 'out');
const distDashboardDir = path.join(cliDir, 'dist/dashboard-ui');
const releasesSrc = path.join(rootDir, 'releases.json');
const releasesDest = path.join(cliDir, 'dist/releases.json');

console.log('🚀 Building Dashboard static UI...');

// 1. Build the Next.js app if out/ does not exist or needs update
if (!fs.existsSync(outDir)) {
  console.log('Running static build for web dashboard...');
  execSync('npm run build', {
    cwd: webDir,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

// 2. Ensure destination in apps/cli/dist/dashboard-ui exists and is empty
if (fs.existsSync(distDashboardDir)) {
  fs.rmSync(distDashboardDir, { recursive: true, force: true });
}
fs.mkdirSync(distDashboardDir, { recursive: true });

// 3. Copy out/ to dist/dashboard-ui
if (fs.existsSync(outDir)) {
  copyRecursiveSync(outDir, distDashboardDir);
  console.log('Successfully copied static dashboard UI to CLI dist/dashboard-ui');
}

// 4. Copy releases.json to dist/releases.json
if (fs.existsSync(releasesSrc)) {
  fs.copyFileSync(releasesSrc, releasesDest);
  console.log('Copied releases.json to dist/releases.json');
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
