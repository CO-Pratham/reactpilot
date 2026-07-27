import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface ReactPilotRelease {
  version: string;
  date: string;
  npmVersion?: string;
  changes: string[];
}

export interface ReactPilotVersionInfo {
  productName: string;
  installedVersion: string;
  installedNpmVersion: string;
  latestVersion: string;
  latestNpmVersion: string;
  upgradeAvailable: boolean;
  installSource: 'dependency' | 'node_modules' | 'monorepo' | 'unknown';
  releaseNotes: ReactPilotRelease[];
  upgradeChanges: string[];
}

interface ReleaseCatalog {
  productName: string;
  releases: ReactPilotRelease[];
}

const CACHE_FILE = path.join(os.homedir(), '.reactpilot', 'cache', 'npm-cli-version.json');
const CACHE_TTL_MS = 60 * 60 * 1000;

function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

function cleanVersion(ver: string): string {
  return ver.replace(/^[\^~>=v]+/, '').trim();
}

function findReleaseCatalog(startDir: string): ReleaseCatalog | null {
  let current = startDir;
  while (true) {
    const candidate = path.join(current, 'releases.json');
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, 'utf-8')) as ReleaseCatalog;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function npmToProductVersion(npmVersion: string, releases: ReactPilotRelease[]): string {
  const withNpm = releases
    .filter((r) => r.npmVersion)
    .sort((a, b) => compareSemver(b.npmVersion!, a.npmVersion!));

  for (const release of withNpm) {
    if (compareSemver(npmVersion, release.npmVersion!) >= 0) {
      return release.version;
    }
  }

  return npmVersion;
}

function productToNpmVersion(productVersion: string, releases: ReactPilotRelease[]): string {
  const match = releases.find((r) => r.version === productVersion);
  return match?.npmVersion ?? productVersion;
}

export function detectInstalledReactPilotNpmVersion(projectRoot: string): {
  version: string;
  source: ReactPilotVersionInfo['installSource'];
} {
  const installedPkg = path.join(projectRoot, 'node_modules/@reactpilot/cli/package.json');
  if (fs.existsSync(installedPkg)) {
    const pkg = JSON.parse(fs.readFileSync(installedPkg, 'utf-8'));
    return { version: pkg.version ?? '0.0.0', source: 'node_modules' };
  }

  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['@reactpilot/cli']) {
      return { version: cleanVersion(deps['@reactpilot/cli']), source: 'dependency' };
    }
  }

  const monorepoCli = path.join(projectRoot, 'apps/cli/package.json');
  if (fs.existsSync(monorepoCli)) {
    const pkg = JSON.parse(fs.readFileSync(monorepoCli, 'utf-8'));
    return { version: pkg.version ?? '0.0.0', source: 'monorepo' };
  }

  return { version: '0.0.0', source: 'unknown' };
}

async function fetchLatestNpmVersion(): Promise<string> {
  if (fs.existsSync(CACHE_FILE)) {
    const stat = fs.statSync(CACHE_FILE);
    if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as { version: string };
      return cached.version;
    }
  }

  try {
    const res = await fetch('https://registry.npmjs.org/@reactpilot/cli/latest', {
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { version?: string };
    const version = data.version ?? '0.0.0';
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ version, fetchedAt: new Date().toISOString() }, null, 2));
    return version;
  } catch {
    if (fs.existsSync(CACHE_FILE)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as { version: string };
      return cached.version;
    }
    return '0.0.0';
  }
}

function collectUpgradeChanges(
  installedProduct: string,
  latestProduct: string,
  releases: ReactPilotRelease[]
): string[] {
  const sorted = [...releases].sort((a, b) => compareSemver(b.version, a.version));
  const changes: string[] = [];

  for (const release of sorted) {
    if (compareSemver(release.version, installedProduct) <= 0) break;
    if (compareSemver(release.version, latestProduct) <= 0) {
      changes.push(`v${release.version} (${release.date})`);
      changes.push(...release.changes.map((c) => `  • ${c}`));
    }
  }

  return changes;
}

export async function getReactPilotVersionInfo(projectRoot: string): Promise<ReactPilotVersionInfo> {
  const catalog = findReleaseCatalog(projectRoot);
  const releases = catalog?.releases ?? [];
  const productName = catalog?.productName ?? 'ReactPilot';

  const { version: installedNpm, source } = detectInstalledReactPilotNpmVersion(projectRoot);
  const latestNpm = await fetchLatestNpmVersion();

  const installedVersion =
    releases.length > 0 ? npmToProductVersion(installedNpm, releases) : installedNpm;

  let latestVersion =
    releases.length > 0 ? npmToProductVersion(latestNpm, releases) : latestNpm;

  if (releases.length > 0) {
    const catalogLatest = [...releases].sort((a, b) => compareSemver(b.version, a.version))[0];
    if (compareSemver(catalogLatest.version, latestVersion) > 0) {
      latestVersion = catalogLatest.version;
    }
  }

  const latestNpmVersion = productToNpmVersion(latestVersion, releases) || latestNpm;
  const upgradeAvailable = compareSemver(latestVersion, installedVersion) > 0;

  const releaseNotes = [...releases].sort((a, b) => compareSemver(b.version, a.version));
  const upgradeChanges = upgradeAvailable
    ? collectUpgradeChanges(installedVersion, latestVersion, releases)
    : [];

  return {
    productName,
    installedVersion,
    installedNpmVersion: installedNpm,
    latestVersion,
    latestNpmVersion,
    upgradeAvailable,
    installSource: source,
    releaseNotes,
    upgradeChanges,
  };
}
