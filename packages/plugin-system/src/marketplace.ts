import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import type { MarketplaceEntry } from './types.js';

const execAsync = promisify(exec);

const MARKETPLACE_URL =
  process.env.REACTPILOT_MARKETPLACE_URL ??
  'https://raw.githubusercontent.com/CO-Pratham/reactpilot/main/marketplace/plugins.json';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function findLocalMarketplaceFile(): string | null {
  let current = process.cwd();

  while (true) {
    const candidate = path.join(current, 'marketplace', 'plugins.json');
    if (fs.existsSync(candidate)) return candidate;

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

/**
 * Resolve a bundled local plugin stub path from the marketplace catalog.
 */
export function resolveLocalPluginPath(name: string, startDir: string = process.cwd()): string | null {
  let current = startDir;

  while (true) {
    const marketplaceFile = path.join(current, 'marketplace', 'plugins.json');
    if (fs.existsSync(marketplaceFile)) {
      const entries = readMarketplaceFile(marketplaceFile);
      const entry = entries.find((plugin) => plugin.name === name);
      if (entry?.localPath) {
        const resolved = path.resolve(path.dirname(marketplaceFile), entry.localPath);
        if (fs.existsSync(resolved)) return resolved;
      }
      return null;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

function readMarketplaceFile(filePath: string): MarketplaceEntry[] {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MarketplaceEntry[];
  return Array.isArray(data) ? data : [];
}

function enrichWithLocalPaths(entries: MarketplaceEntry[]): MarketplaceEntry[] {
  const localFile = findLocalMarketplaceFile();
  if (!localFile) return entries;

  const localEntries = readMarketplaceFile(localFile);
  return entries.map((entry) => {
    const local = localEntries.find((item) => item.name === entry.name);
    return local?.localPath ? { ...entry, localPath: local.localPath } : entry;
  });
}

/**
 * Fetch the plugin marketplace listing.
 * Results are cached in ~/.reactpilot/cache/marketplace.json.
 */
export async function fetchMarketplace(cacheDir: string): Promise<MarketplaceEntry[]> {
  const cacheFile = path.join(cacheDir, 'marketplace.json');
  fs.mkdirSync(cacheDir, { recursive: true });

  // Return cache if fresh
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) as MarketplaceEntry[];
      return enrichWithLocalPaths(cached);
    }
  }

  try {
    const res = await fetch(MARKETPLACE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = enrichWithLocalPaths(await res.json() as MarketplaceEntry[]);
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    return data;
  } catch {
    const localMarketplace = findLocalMarketplaceFile();
    if (localMarketplace) {
      const data = readMarketplaceFile(localMarketplace);
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
      return data;
    }

    // Return stale cache if network fails
    if (fs.existsSync(cacheFile)) {
      return enrichWithLocalPaths(JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) as MarketplaceEntry[]);
    }
    return [];
  }
}

/**
 * Search marketplace for plugins matching a query.
 */
export async function searchPlugins(
  query: string,
  cacheDir: string
): Promise<MarketplaceEntry[]> {
  const all = await fetchMarketplace(cacheDir);
  const q = query.toLowerCase();
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

/**
 * Install a plugin via npm into the plugins directory.
 */
export async function installPlugin(
  name: string,
  pluginsDir: string,
  options: { local?: string; verbose?: boolean; projectRoot?: string } = {}
): Promise<void> {
  fs.mkdirSync(pluginsDir, { recursive: true });

  // Ensure a package.json exists in pluginsDir (npm requires it)
  const pkgPath = path.join(pluginsDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    fs.writeFileSync(pkgPath, JSON.stringify({ name: 'reactpilot-plugins', private: true }, null, 2));
  }

  const localPath = options.local ?? resolveLocalPluginPath(name, options.projectRoot ?? process.cwd());
  const source = localPath
    ? localPath
    : name.includes('/') || name.startsWith('@')
    ? name
    : `@reactpilot-plugin/${name}`;

  const cmd = `npm install --prefix "${pluginsDir}" "${source}" --save`;

  if (options.verbose) console.log(`Running: ${cmd}`);

  try {
    const { stdout, stderr } = await execAsync(cmd);
    if (options.verbose && stdout) console.log(stdout);
    if (stderr && !stderr.includes('warn')) console.warn(stderr);
  } catch (err) {
    if (localPath) throw err;
    throw new Error(
      `Plugin "${name}" is not published to npm yet. Run from the ReactPilot repo or use: reactpilot plugin install ${name} --local <path>`
    );
  }
}

/**
 * Remove an installed plugin.
 */
export async function removePlugin(name: string, pluginsDir: string): Promise<void> {
  const packageName = name.startsWith('@') ? name : `@reactpilot-plugin/${name}`;
  const cmd = `npm uninstall --prefix "${pluginsDir}" "${packageName}"`;
  await execAsync(cmd);
}

/**
 * Update a specific plugin (or all if name is omitted).
 */
export async function updatePlugin(
  pluginsDir: string,
  name?: string
): Promise<void> {
  const packageName = name
    ? name.startsWith('@') ? name : `@reactpilot-plugin/${name}`
    : '';
  const cmd = `npm update --prefix "${pluginsDir}" ${packageName}`.trim();
  await execAsync(cmd);
}

/**
 * List all installed plugins from the plugins directory.
 */
export function listInstalledPlugins(
  pluginsDir: string
): Array<{ name: string; version: string; description: string }> {
  const nmPath = path.join(pluginsDir, 'node_modules');
  if (!fs.existsSync(nmPath)) return [];

  const results: Array<{ name: string; version: string; description: string }> = [];

  const readDir = (dir: string, scope?: string) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
        if (entry.name.startsWith('.') || entry.name === '.bin') continue;

        const entryPath = path.join(dir, entry.name);
        const stat = fs.statSync(entryPath);
        if (!stat.isDirectory()) continue;

        if (entry.name.startsWith('@') && !scope) {
          readDir(entryPath, entry.name);
          continue;
        }

        const pkgPath = path.join(entryPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          const fullName = scope ? `${scope}/${entry.name}` : entry.name;
          results.push({
            name: fullName,
            version: pkg.version ?? 'unknown',
            description: pkg.description ?? '',
          });
        }
      }
    } catch { /* ignore unreadable dirs */ }
  };

  readDir(nmPath);
  return results;
}
