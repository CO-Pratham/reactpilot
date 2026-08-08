import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';

export interface ProjectVersions {
  react: string;
  next?: string;
  isReact19: boolean;
  isNext15: boolean;
}

/**
 * Scan package.json to identify current framework versions.
 * Handles semver ranges (^19.0.0, >=18.2.0, 19.0.0-rc.1, etc.) reliably using semver library.
 */
export function detectProjectVersions(projectRoot: string): ProjectVersions {
  const rootsToScan = [projectRoot];

  // Monorepos often declare React in workspace apps, not the root package.json.
  for (const sub of ['apps/web', 'apps/cli', 'packages/web']) {
    rootsToScan.push(path.join(projectRoot, sub));
  }

  let reactRaw = '0.0.0';
  let nextRaw: string | undefined;

  for (const root of rootsToScan) {
    const pkgPath = path.join(root, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (reactRaw === '0.0.0' && deps.react) {
        reactRaw = deps.react;
      }
      if (!nextRaw && deps.next) {
        nextRaw = deps.next;
      }
    } catch {
      // try next candidate
    }
  }

  const reactVer = cleanVersion(reactRaw);
  const nextVer = nextRaw ? cleanVersion(nextRaw) : undefined;

  return {
    react: reactVer,
    next: nextVer,
    isReact19: checkIsMajor(reactRaw, 19),
    isNext15: nextRaw ? checkIsMajor(nextRaw, 15) : false,
  };
}

function cleanVersion(rawVer: string): string {
  const min = semver.minVersion(rawVer);
  if (min) return min.version;
  const coerced = semver.coerce(rawVer);
  return coerced ? coerced.version : rawVer.replace(/[\^~>=]/g, '').trim();
}

function checkIsMajor(rawVer: string, major: number): boolean {
  if (rawVer.includes('rc') || rawVer.includes('beta') || rawVer.includes('canary')) {
    if (rawVer.includes(String(major))) return true;
  }
  const parsed = semver.minVersion(rawVer) ?? semver.coerce(rawVer);
  if (parsed) return parsed.major >= major;
  return rawVer.startsWith(String(major));
}
