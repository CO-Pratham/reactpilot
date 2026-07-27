import { colors } from './colors.js';

export interface StructuredError {
  code: string;
  message: string;
  hint?: string;
  docs?: string;
  cause?: unknown;
}

/**
 * Format a structured error for CLI output with colored hint and docs link.
 */
export function formatError(err: StructuredError): string {
  const lines: string[] = [];
  lines.push(colors.error(`✖ [${err.code}] ${err.message}`));
  if (err.hint) {
    lines.push(colors.info(`  → ${err.hint}`));
  }
  if (err.docs) {
    lines.push(colors.muted(`  Docs: ${err.docs}`));
  }
  if (err.cause instanceof Error) {
    lines.push(colors.dim(`  Caused by: ${err.cause.message}`));
  }
  return lines.join('\n');
}

/**
 * Print a structured error and optionally exit.
 */
export function printError(err: StructuredError, exit = false): void {
  console.error(formatError(err));
  if (exit) process.exit(1);
}

/**
 * Wrap an unknown catch value into a StructuredError.
 */
export function wrapError(code: string, err: unknown, hint?: string): StructuredError {
  const message = err instanceof Error ? err.message : String(err);
  return { code, message, hint, cause: err };
}

/**
 * Common ReactPilot error codes.
 */
export const ErrorCodes = {
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND',
  PLUGIN_INSTALL_FAILED: 'PLUGIN_INSTALL_FAILED',
  PLUGIN_MANIFEST_INVALID: 'PLUGIN_MANIFEST_INVALID',
  PLUGIN_INCOMPATIBLE: 'PLUGIN_INCOMPATIBLE',
  GITHUB_TOKEN_MISSING: 'GITHUB_TOKEN_MISSING',
  GITHUB_API_ERROR: 'GITHUB_API_ERROR',
  LLM_NOT_CONFIGURED: 'LLM_NOT_CONFIGURED',
  LLM_REQUEST_FAILED: 'LLM_REQUEST_FAILED',
  INDEX_FAILED: 'INDEX_FAILED',
  GRAPH_EXPORT_FAILED: 'GRAPH_EXPORT_FAILED',
  MIGRATION_BACKUP_FAILED: 'MIGRATION_BACKUP_FAILED',
  MIGRATION_ROLLBACK_FAILED: 'MIGRATION_ROLLBACK_FAILED',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
} as const;
