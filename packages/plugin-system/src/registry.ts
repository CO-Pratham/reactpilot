import type { RegisteredPlugin, AnalysisRule, AIPrompt, Generator, ReportSection, CodeFix } from './types.js';

/**
 * PluginRegistry — singleton that tracks all loaded plugins.
 * Every feature (analyzer, chat, graph, etc.) queries this registry
 * to pick up plugin contributions.
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, RegisteredPlugin> = new Map();

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /** Register a fully-loaded plugin */
  register(plugin: RegisteredPlugin): void {
    if (this.plugins.has(plugin.manifest.name)) {
      throw new Error(`Plugin "${plugin.manifest.name}" is already registered.`);
    }
    this.plugins.set(plugin.manifest.name, { ...plugin, loadedAt: new Date() });
  }

  /** Unregister a plugin by name */
  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  /** Get a single plugin or undefined */
  get(name: string): RegisteredPlugin | undefined {
    return this.plugins.get(name);
  }

  /** Get all registered plugins */
  getAll(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  /** Collect all analysis rules from all plugins */
  getAllRules(): AnalysisRule[] {
    return this.getAll().flatMap((p) => p.rules);
  }

  /** Collect all AI prompts from all plugins */
  getAllPrompts(): AIPrompt[] {
    return this.getAll().flatMap((p) => p.prompts);
  }

  /** Collect all generators from all plugins */
  getAllGenerators(): Generator[] {
    return this.getAll().flatMap((p) => p.generators);
  }

  /** Collect all report sections from all plugins */
  getAllReportSections(): ReportSection[] {
    return this.getAll().flatMap((p) => p.reportSections);
  }

  /** Collect all code fixes from all plugins */
  getAllFixes(): CodeFix[] {
    return this.getAll().flatMap((p) => p.fixes);
  }

  /** Check if a plugin is registered */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /** Clear all plugins (mainly for testing) */
  clear(): void {
    this.plugins.clear();
  }

  get size(): number {
    return this.plugins.size;
  }
}

/** Convenience export of the singleton */
export const pluginRegistry = PluginRegistry.getInstance();
