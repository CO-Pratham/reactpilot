import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../..');
const webDir = path.join(rootDir, 'apps/web');
const cliDir = path.join(rootDir, 'apps/cli');
const apiDir = path.join(webDir, 'src/app/api');
const apiBackupDir = path.join(rootDir, 'apps/api-temp-backup');
const outDir = path.join(webDir, 'out');
const distDashboardDir = path.join(cliDir, 'dist/dashboard-ui');
const releasesSrc = path.join(rootDir, 'releases.json');
const releasesDest = path.join(cliDir, 'dist/releases.json');

console.log('🚀 Building Dashboard static UI...');

// 1. Backup API directory if it exists
let apiBackedUp = false;
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, apiBackupDir);
  apiBackedUp = true;
  console.log('Temporarily moved API directory to build static client...');
}

try {
  // 2. Build the Next.js app (statically exported to 'out')
  console.log('Running static build for web dashboard...');
  execSync('npm run build', {
    cwd: webDir,
    stdio: 'inherit',
    env: { ...process.env, PATH: `/usr/local/bin:${process.env.PATH}` }
  });

  // 3. Ensure destination in apps/cli/dist/dashboard-ui exists and is empty
  if (fs.existsSync(distDashboardDir)) {
    fs.rmSync(distDashboardDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDashboardDir, { recursive: true });

  // 4. Copy out/ to dist/dashboard-ui
  copyRecursiveSync(outDir, distDashboardDir);
  console.log('Successfully copied static dashboard UI to CLI dist/dashboard-ui');

  // 5. Copy releases.json to dist/releases.json
  if (fs.existsSync(releasesSrc)) {
    fs.copyFileSync(releasesSrc, releasesDest);
    console.log('Copied releases.json to dist/releases.json');
  }
} finally {
  // 6. Restore API directory
  if (apiBackedUp) {
    fs.renameSync(apiBackupDir, apiDir);
    console.log('Restored API directory.');
  }
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
