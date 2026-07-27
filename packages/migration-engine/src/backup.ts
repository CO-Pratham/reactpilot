import fs from 'node:fs';
import path from 'node:path';

/**
 * Backs up files in the given list to a subdirectory under .reactpilot-backup
 */
export function createBackup(
  projectRoot: string,
  filePaths: string[],
  backupDirName = '.reactpilot-backup'
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = path.join(projectRoot, backupDirName, timestamp);

  fs.mkdirSync(backupRoot, { recursive: true });

  // Save meta file detailing backed up files
  const meta: Record<string, string> = {};

  for (const file of filePaths) {
    const srcPath = path.resolve(projectRoot, file);
    if (!fs.existsSync(srcPath)) continue;

    const destPath = path.join(backupRoot, file);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);

    meta[file] = timestamp;
  }

  fs.writeFileSync(
    path.join(backupRoot, 'metadata.json'),
    JSON.stringify({ timestamp, files: Object.keys(meta) }, null, 2),
    'utf-8'
  );

  return backupRoot;
}
