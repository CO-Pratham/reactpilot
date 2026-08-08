import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import semver from 'semver';
import { PluginManifestSchema } from './types.js';
import type { PluginManifest, RegisteredPlugin, PluginContext } from './types.js';
import { PluginAPIImpl } from './api.js';
import { pluginRegistry } from './registry.js';
import { createLogger } from './lifecycle.js';

const REACTPILOT_VERSION = '1.0.0';

/** Directories to search for installed plugins */
function getPluginSearchPaths(pluginsDir: string): string[] {
  return [
    pluginsDir,
    path.join(process.cwd(), 'node_modules'),
  ];
}

/**
 * Load and register a plugin by name or absolute path.
 * Throws on manifest validation or version compatibility errors.
 */
export async function loadPlugin(
  nameOrPath: string,
  options: {
    projectRoot?: string;
    pluginsDir?: string;
    config?: Record<string, unknown>;
  } = {}
): Promise<RegisteredPlugin> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const pluginsDir = options.pluginsDir ?? path.join(os.homedir(), '.reactpilot', 'plugins');
  const config = options.config ?? {};


  const pluginDir = resolvePluginDir(nameOrPath, getPluginSearchPaths(pluginsDir));
  const manifest = loadManifest(pluginDir);
  validateCompatibility(manifest);

  const logger = createLogger(manifest.name, !!(config as any).__debug);

  const registeredPlugin: RegisteredPlugin = {
    manifest,
    context: {
      pluginName: manifest.name,
      pluginDir,
      projectRoot,
      config,
      permissions: manifest.permissions,
      log: logger,
    } satisfies PluginContext,
    rules: [],
    prompts: [],
    generators: [],
    reportSections: [],
    fixes: [],
    installedAt: new Date(),
  };

  const api = new PluginAPIImpl(registeredPlugin);

  // Load the plugin entry file
  const entryPath = path.join(pluginDir, manifest.main);
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Plugin "${manifest.name}" entry file not found: ${entryPath}`);
  }

  try {
    const pluginModule = await import(entryPath);
    const setup = pluginModule.default ?? pluginModule.setup;

    if (typeof setup !== 'function') {
      throw new Error(
        `Plugin "${manifest.name}" must export a default function or "setup" function.`
      );
    }

    await setup(api, registeredPlugin.context);
  } catch (err) {
    if (err instanceof Error && err.message.includes('must export')) throw err;
    throw new Error(
      `Failed to initialize plugin "${manifest.name}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  pluginRegistry.register(registeredPlugin);
  logger.info(`Plugin loaded (${registeredPlugin.rules.length} rules, ${registeredPlugin.prompts.length} prompts)`);

  return registeredPlugin;
}

/**
 * Load all plugins listed in the config.
 */
export async function loadConfiguredPlugins(
  pluginNames: string[],
  options: Parameters<typeof loadPlugin>[1] = {}
): Promise<RegisteredPlugin[]> {
  const loaded: RegisteredPlugin[] = [];
  for (const name of pluginNames) {
    const pluginName = Array.isArray(name) ? name[0] : name;
    try {
      const plugin = await loadPlugin(String(pluginName), options);
      loaded.push(plugin);
    } catch (err) {
      console.warn(`⚠ Could not load plugin "${pluginName}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return loaded;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolvePluginDir(nameOrPath: string, searchPaths: string[]): string {
  // Absolute path (C:\plugins\myplugin on Windows, /plugins/myplugin on Unix) or relative path
  if (path.isAbsolute(nameOrPath) || nameOrPath.startsWith('.')) {
    const resolved = path.resolve(nameOrPath);
    if (fs.existsSync(resolved)) return resolved;
    throw new Error(`Plugin path not found: ${resolved}`);
  }

  // npm package name
  const packageName = nameOrPath.startsWith('@reactpilot-plugin/')
    ? nameOrPath
    : `@reactpilot-plugin/${nameOrPath}`;

  for (const searchPath of searchPaths) {
    // Try scoped name first, then bare name
    for (const candidate of [packageName, nameOrPath]) {
      const dir = path.join(searchPath, candidate);
      if (fs.existsSync(dir)) return dir;
    }
  }

  throw new Error(
    `Plugin "${nameOrPath}" not found. Run: reactpilot plugin install ${nameOrPath}`
  );
}

function loadManifest(pluginDir: string): PluginManifest {
  const manifestPath = path.join(pluginDir, 'plugin.json');
  const pkgPath = path.join(pluginDir, 'package.json');

  let raw: unknown;

  if (fs.existsSync(manifestPath)) {
    raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } else if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    raw = {
      name: pkg.name?.replace(/^@reactpilot-plugin\//, '') ?? pkg.name,
      version: pkg.version,
      description: pkg.description,
      reactpilotVersion: pkg.reactpilotVersion ?? '>=1.0.0',
      main: pkg.main ?? 'dist/index.js',
      permissions: pkg.reactpilotPermissions ?? [],
      author: typeof pkg.author === 'string' ? pkg.author : pkg.author?.name,
      keywords: pkg.keywords ?? [],
    };
  } else {
    throw new Error(`No plugin.json or package.json found in: ${pluginDir}`);
  }

  const result = PluginManifestSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid plugin manifest in "${pluginDir}":\n${issues}`);
  }

  return result.data;
}

function validateCompatibility(manifest: PluginManifest): void {
  if (!semver.satisfies(REACTPILOT_VERSION, manifest.reactpilotVersion)) {
    throw new Error(
      `Plugin "${manifest.name}" requires ReactPilot ${manifest.reactpilotVersion}, ` +
      `but you have ${REACTPILOT_VERSION}. Please update ReactPilot or the plugin.`
    );
  }
}
