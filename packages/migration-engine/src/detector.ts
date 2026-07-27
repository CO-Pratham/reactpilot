import fs from 'node:fs';
import path from 'node:path';

export interface ProjectVersions {
  react: string;
  next?: string;
  isReact19: boolean;
  isNext15: boolean;
}

/**
 * Scan package.json to identify current framework versions.
 */
export function detectProjectVersions(projectRoot: string): ProjectVersions {
  const rootsToScan = [projectRoot];

  // Monorepos often declare React in workspace apps, not the root package.json.
  for (const sub of ['apps/web', 'apps/cli', 'packages/web']) {
    rootsToScan.push(path.join(projectRoot, sub));
  }

  let reactVer = '0.0.0';
  let nextVer: string | undefined;

  for (const root of rootsToScan) {
    const pkgPath = path.join(root, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (reactVer === '0.0.0' && deps.react) {
        reactVer = cleanVersion(deps.react);
      }
      if (!nextVer && deps.next) {
        nextVer = cleanVersion(deps.next);
      }
    } catch {
      // try next candidate
    }
  }

  return {
    react: reactVer,
    next: nextVer,
    isReact19: reactVer.startsWith('19') || reactVer.startsWith('rc') || reactVer.startsWith('beta'),
    isNext15: nextVer ? nextVer.startsWith('15') || nextVer.startsWith('rc') : false,
  };
}

function cleanVersion(ver: string): string {
  return ver.replace(/[\^~>=]/g, '').trim();
}
