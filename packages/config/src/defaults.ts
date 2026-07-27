import type { ReactPilotConfig } from './types.js';

/**
 * Default configuration — every field has a safe default.
 * The Zod schema enforces these via .default() so this is
 * mainly for documentation purposes and type-safe spread.
 */
export const defaultConfig: ReactPilotConfig = {
  plugins: [],
  review: {
    severity: 'medium',
    categories: ['all'],
    postComment: true,
  },
  graph: {
    theme: 'dark',
    defaultFormat: 'html',
    filters: ['circular', 'unused'],
    output: './reactpilot-graph.html',
    open: false,
  },
  chat: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-ada-002',
    ollamaEmbeddingModel: 'nomic-embed-text',
    indexStrategy: 'ast',
    topK: 10,
    stream: true,
    historySize: 20,
  },
  migration: {
    backup: true,
    dryRun: false,
    formatter: 'prettier',
    backupDir: '.reactpilot-backup',
  },
  output: {
    historyDir: '~/.reactpilot/history',
    cacheDir: '~/.reactpilot/cache',
    pluginsDir: '~/.reactpilot/plugins',
    verbose: false,
    debug: false,
    telemetry: false,
    json: false,
  },
};
