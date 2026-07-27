import fs from 'node:fs';
import path from 'node:path';

/**
 * Restores the most recent backup found in .reactpilot-backup
 */
export function rollbackLatestBackup(
  projectRoot: string,
  backupDirName = '.reactpilot-backup'
): string[] {
  const backupDir = path.join(projectRoot, backupDirName);
  if (!fs.existsSync(backupDir)) {
    throw new Error('No backups directory found.');
  }

  const entries = fs.readdirSync(backupDir, { withFileTypes: true });
  const timestamps = entries
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => b.localeCompare(a)); // Newest first

  if (timestamps.length === 0) {
    throw new Error('No valid backup directories found.');
  }

  const latest = timestamps[0];
  const backupPath = path.join(backupDir, latest);
  const metaPath = path.join(backupPath, 'metadata.json');

  if (!fs.existsSync(metaPath)) {
    throw new Error(`Backup metadata missing in: ${backupPath}`);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { files: string[] };
  const restored: string[] = [];

  for (const file of meta.files) {
    const srcPath = path.join(backupPath, file);
    const destPath = path.resolve(projectRoot, file);

    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      restored.push(file);
    }
  }

  // Clean up the rolled back backup folder
  try {
    fs.rmSync(backupPath, { recursive: true, force: true });
    // Remove parent backup dir if empty
    if (fs.readdirSync(backupDir).length === 0) {
      fs.rmdirSync(backupDir);
    }
  } catch { /* ignore clean cleanup failure */ }

  return restored;
}
