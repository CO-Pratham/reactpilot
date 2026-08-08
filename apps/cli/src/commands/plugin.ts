import path from 'node:path';
import os from 'node:os';
import {
  searchPlugins,
  installPlugin,
  removePlugin,
  updatePlugin,
  listInstalledPlugins,
  fetchMarketplace,
  generatePluginDocs,
  loadPlugin,
} from '@reactpilot/plugin-system';
import { isFeatureEnabled } from '@reactpilot/config';
import { saveRun } from '@reactpilot/github-review';
import {
  withSpinner,
  printSection,
  printSuccess,
  printWarning,
  printTable,
  colors,
} from '@reactpilot/utils/ui';

const PLUGINS_DIR = path.join(os.homedir(), '.reactpilot', 'plugins');
const CACHE_DIR   = path.join(os.homedir(), '.reactpilot', 'cache');

export interface PluginOptions {
  local?: string;
  verbose?: boolean;
}

/**
 * Main entry point for `reactpilot plugin <action> [name]`
 */
export async function runPlugin(
  action: string,
  name: string | undefined,
  options: PluginOptions = {}
): Promise<void> {
  if (!isFeatureEnabled('plugin-system')) {
    console.error(colors.error('The "plugin-system" feature is not enabled.\nRun: reactpilot features -> select "Plugin System" to enable it.'));
    process.exit(1);
  }
  switch (action) {
    case 'search':  return runSearch(name ?? '', options);
    case 'install': return runInstall(name, options);
    case 'remove':
    case 'uninstall': return runRemove(name);
    case 'list':    return runList();
    case 'update':  return runUpdate(name, options);
    case 'info':    return runInfo(name, options);
    default:
      console.error(colors.error(`Unknown plugin action: "${action}"`));
      console.log(`Available actions: search | install | remove | list | update | info`);
      process.exit(1);
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function runSearch(query: string, _opts: PluginOptions): Promise<void> {
  printSection('Plugin Marketplace Search');

  const results = await withSpinner(
    query ? `Searching for "${query}"...` : 'Fetching marketplace...',
    () => (query ? searchPlugins(query, CACHE_DIR) : fetchMarketplace(CACHE_DIR)),
    'Done'
  );

  if (results.length === 0) {
    printWarning(`No plugins found${query ? ` for "${query}"` : ''}.`);
    return;
  }

  printTable(
    results.map((p) => [
      p.verified ? colors.success('✔') + ' ' + p.name : p.name,
      p.version,
      p.description.slice(0, 60),
      String(p.downloads.toLocaleString()),
    ]),
    {
      head: ['Plugin', 'Version', 'Description', 'Downloads'],
      align: ['left', 'left', 'left', 'right'],
    }
  );

  console.log(colors.muted(`\n${results.length} plugin(s) found. Install with: reactpilot plugin install <name>`));
}

// ─── Install ──────────────────────────────────────────────────────────────────

async function runInstall(name: string | undefined, opts: PluginOptions): Promise<void> {
  if (!name) {
    console.error(colors.error('Plugin name is required.'));
    console.log('Usage: reactpilot plugin install <name>');
    process.exit(1);
  }

  await withSpinner(
    `Installing ${colors.accent(name)}...`,
    () => installPlugin(name, PLUGINS_DIR, { ...opts, projectRoot: process.cwd() }),
    `${name} installed successfully`
  );

  const installed = listInstalledPlugins(PLUGINS_DIR);
  saveRun({
    type: 'plugins',
    title: 'Plugin Install',
    projectPath: process.cwd(),
    summary: {
      count: installed.length,
      plugins: installed.map((p) => ({ name: p.name, version: p.version })),
    },
  });

  console.log(colors.muted(`\nRun ${colors.accent('reactpilot plugin list')} to verify.`));
}

// ─── Remove ───────────────────────────────────────────────────────────────────

async function runRemove(name: string | undefined): Promise<void> {
  if (!name) {
    console.error(colors.error('Plugin name is required.'));
    process.exit(1);
  }

  await withSpinner(
    `Removing ${colors.accent(name)}...`,
    () => removePlugin(name, PLUGINS_DIR),
    `${name} removed`
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

async function runList(): Promise<void> {
  printSection('Installed Plugins');
  const installed = listInstalledPlugins(PLUGINS_DIR);

  if (installed.length === 0) {
    printWarning('No plugins installed.');
    console.log(colors.muted('Plugins install to ~/.reactpilot/plugins'));
    console.log(colors.muted('Browse:  node apps/cli/dist/index.cjs plugin search'));
    console.log(colors.muted('Install: node apps/cli/dist/index.cjs plugin install <name>'));
    saveRun({
      type: 'plugins',
      title: 'Plugin List',
      projectPath: process.cwd(),
      summary: { count: 0, plugins: [] },
    });
    printSuccess('Plugin status saved. Refresh the Developer Center dashboard to view it.');
    return;
  }

  printTable(
    installed.map((p) => [p.name, p.version, p.description.slice(0, 70)]),
    { head: ['Plugin', 'Version', 'Description'] }
  );

  console.log(colors.muted(`\n${installed.length} plugin(s) installed.`));

  saveRun({
    type: 'plugins',
    title: 'Plugin List',
    projectPath: process.cwd(),
    summary: {
      count: installed.length,
      plugins: installed.map((p) => ({ name: p.name, version: p.version })),
    },
  });
  printSuccess('Plugin list saved. Refresh the Developer Center dashboard to view it.');
}

// ─── Update ───────────────────────────────────────────────────────────────────

async function runUpdate(name: string | undefined, _opts: PluginOptions): Promise<void> {
  const label = name ? colors.accent(name) : 'all plugins';

  await withSpinner(
    `Updating ${label}...`,
    () => updatePlugin(PLUGINS_DIR, name),
    `${label} updated`
  );
}

// ─── Info ─────────────────────────────────────────────────────────────────────

async function runInfo(name: string | undefined, _opts: PluginOptions): Promise<void> {
  if (!name) {
    console.error(colors.error('Plugin name is required.'));
    process.exit(1);
  }

  const plugin = await withSpinner(
    `Loading plugin info for ${colors.accent(name)}...`,
    () => loadPlugin(name, { pluginsDir: PLUGINS_DIR }),
    'Loaded'
  );

  const docs = generatePluginDocs(plugin);
  console.log('\n' + docs);
}
