import { z } from 'zod';

// ─── Plugin Config ────────────────────────────────────────────────────────────

export const PluginConfigSchema = z.union([
  z.string(),
  z.tuple([z.string(), z.record(z.unknown())]),
]);

// ─── Review Config ────────────────────────────────────────────────────────────

export const ReviewCategorySchema = z.enum([
  'all',
  'performance',
  'accessibility',
  'security',
  'maintainability',
  'architecture',
  'bundle',
]);

export const ReviewConfigSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  categories: z.array(ReviewCategorySchema).default(['all']),
  postComment: z.boolean().default(true),
  failOnScore: z.number().min(0).max(100).optional(),
  githubToken: z.string().optional(),
});

// ─── Graph Config ─────────────────────────────────────────────────────────────

export const GraphConfigSchema = z.object({
  theme: z.enum(['dark', 'light']).default('dark'),
  defaultFormat: z.enum(['html', 'svg', 'png', 'json']).default('html'),
  filters: z
    .array(z.enum(['component', 'hook', 'context', 'route', 'unused', 'circular']))
    .default(['circular', 'unused']),
  output: z.string().default('./reactpilot-graph.html'),
  open: z.boolean().default(false),
});

// ─── Chat Config ──────────────────────────────────────────────────────────────

export const ChatConfigSchema = z.object({
  provider: z.enum(['openai', 'ollama']).default('openai'),
  model: z.string().default('gpt-4o-mini'),
  embeddingModel: z.string().default('text-embedding-ada-002'),
  ollamaEmbeddingModel: z.string().default('nomic-embed-text'),
  indexStrategy: z.enum(['ast', 'text']).default('ast'),
  topK: z.number().min(1).max(50).default(10),
  stream: z.boolean().default(true),
  historySize: z.number().min(1).max(100).default(20),
});

// ─── Migration Config ─────────────────────────────────────────────────────────

export const MigrationConfigSchema = z.object({
  backup: z.boolean().default(true),
  dryRun: z.boolean().default(false),
  formatter: z.enum(['prettier', 'none']).default('prettier'),
  backupDir: z.string().default('.reactpilot-backup'),
});

// ─── Output Config ────────────────────────────────────────────────────────────

export const OutputConfigSchema = z.object({
  historyDir: z.string().default('~/.reactpilot/history'),
  cacheDir: z.string().default('~/.reactpilot/cache'),
  pluginsDir: z.string().default('~/.reactpilot/plugins'),
  verbose: z.boolean().default(false),
  debug: z.boolean().default(false),
  telemetry: z.boolean().default(false),
  json: z.boolean().default(false),
});

// ─── Root Config ──────────────────────────────────────────────────────────────

export const ReactPilotConfigSchema = z.object({
  plugins: z.array(PluginConfigSchema).default([]),
  review: ReviewConfigSchema.default({}),
  graph: GraphConfigSchema.default({}),
  chat: ChatConfigSchema.default({}),
  migration: MigrationConfigSchema.default({}),
  output: OutputConfigSchema.default({}),
});

export type PluginConfig = z.infer<typeof PluginConfigSchema>;
export type ReviewConfig = z.infer<typeof ReviewConfigSchema>;
export type GraphConfig = z.infer<typeof GraphConfigSchema>;
export type ChatConfig = z.infer<typeof ChatConfigSchema>;
export type MigrationConfig = z.infer<typeof MigrationConfigSchema>;
export type OutputConfig = z.infer<typeof OutputConfigSchema>;
export type ReactPilotConfig = z.infer<typeof ReactPilotConfigSchema>;
