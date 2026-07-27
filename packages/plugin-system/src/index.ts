// Public API for @reactpilot/plugin-system
export type {
  PluginManifest,
  PluginPermission,
  PluginContext,
  PluginLogger,
  PluginAPI,
  AnalysisRule,
  AIPrompt,
  Generator,
  ReportSection,
  CodeFix,
  RegisteredPlugin,
  MarketplaceEntry,
} from './types.js';

export { PluginManifestSchema, PluginPermissionSchema } from './types.js';
export { PluginAPIImpl } from './api.js';
export { PluginRegistry, pluginRegistry } from './registry.js';
export { loadPlugin, loadConfiguredPlugins } from './loader.js';
export { createLogger, invokeHook } from './lifecycle.js';
export type { PluginLifecycleHooks } from './lifecycle.js';
export {
  fetchMarketplace,
  searchPlugins,
  installPlugin,
  removePlugin,
  updatePlugin,
  listInstalledPlugins,
  resolveLocalPluginPath,
} from './marketplace.js';
export { generatePluginDocs } from './docs-gen.js';
