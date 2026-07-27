import { z } from 'zod';
import type { AnalyzerIssue } from '@reactpilot/analyzer';

// ─── Manifest ─────────────────────────────────────────────────────────────────

export const PluginPermissionSchema = z.enum(['fs', 'network', 'process']);

export const PluginManifestSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/, 'Plugin name must be lowercase kebab-case'),
  version: z.string(),
  description: z.string(),
  reactpilotVersion: z.string().default('>=1.0.0'),
  main: z.string().default('index.js'),
  permissions: z.array(PluginPermissionSchema).default([]),
  author: z.string().optional(),
  homepage: z.string().url().optional(),
  keywords: z.array(z.string()).default([]),
  repository: z.string().optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;
export type PluginPermission = z.infer<typeof PluginPermissionSchema>;

// ─── Context ──────────────────────────────────────────────────────────────────

/** Passed to every plugin lifecycle hook */
export interface PluginContext {
  /** Plugin's own name */
  pluginName: string;
  /** Plugin install directory */
  pluginDir: string;
  /** Current project root being analysed */
  projectRoot: string;
  /** Global ReactPilot config */
  config: Record<string, unknown>;
  /** Permissions granted by the manifest */
  permissions: PluginPermission[];
  /** Logger scoped to this plugin */
  log: PluginLogger;
}

export interface PluginLogger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  debug(msg: string): void;
}

// ─── Registration Types ───────────────────────────────────────────────────────

export interface AnalysisRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  visitor: Record<string, (...args: unknown[]) => void>;
}

export interface AIPrompt {
  name: string;
  description: string;
  template: string;
  variables?: string[];
}

export interface Generator {
  name: string;
  description: string;
  types: string[];
  generate(type: string, name: string, options?: Record<string, unknown>): Promise<string>;
}

export interface ReportSection {
  name: string;
  title: string;
  render(issues: AnalyzerIssue[]): string;
}

export interface CodeFix {
  ruleId: string;
  description: string;
  apply(code: string, issue: AnalyzerIssue): string;
}

// ─── Plugin API Surface ───────────────────────────────────────────────────────

export interface PluginAPI {
  registerRule(rule: AnalysisRule): void;
  registerPrompt(prompt: AIPrompt): void;
  registerGenerator(generator: Generator): void;
  registerReportSection(section: ReportSection): void;
  registerFix(fix: CodeFix): void;
}

// ─── Registered Plugin ────────────────────────────────────────────────────────

export interface RegisteredPlugin {
  manifest: PluginManifest;
  context: PluginContext;
  rules: AnalysisRule[];
  prompts: AIPrompt[];
  generators: Generator[];
  reportSections: ReportSection[];
  fixes: CodeFix[];
  installedAt: Date;
  loadedAt?: Date;
}

// ─── Marketplace ──────────────────────────────────────────────────────────────

export interface MarketplaceEntry {
  name: string;
  version: string;
  description: string;
  author: string;
  downloads: number;
  keywords: string[];
  homepage?: string;
  verified: boolean;
  /** Relative path from marketplace/ folder for local dev installs */
  localPath?: string;
}
