import path from 'node:path';
import fs from 'node:fs';
import { ReactPilotConfigSchema } from './types.js';
import { defaultConfig } from './defaults.js';
import type { ReactPilotConfig } from './types.js';

const CONFIG_FILENAMES = [
  'reactpilot.config.ts',
  'reactpilot.config.js',
  'reactpilot.config.mjs',
  'reactpilot.config.cjs',
  'reactpilot.config.json',
];

/**
 * Resolve the config file path from the given directory.
 * Returns null if no config file is found.
 */
export function findConfigFile(cwd: string = process.cwd()): string | null {
  for (const name of CONFIG_FILENAMES) {
    const candidate = path.resolve(cwd, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Load, parse and validate the ReactPilot config file.
 * Falls back to defaults if no config file is found.
 * Supports .ts, .js, .mjs, .cjs, and .json via jiti.
 */
export async function loadConfig(
  cwd: string = process.cwd(),
  configPath?: string
): Promise<{ config: ReactPilotConfig; configFile: string | null }> {
  const filePath = configPath ?? findConfigFile(cwd);

  if (!filePath) {
    return { config: defaultConfig, configFile: null };
  }

  let raw: unknown;

  if (filePath.endsWith('.json')) {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } else {
    // Use jiti to handle TypeScript and ESM config files without a build step
    try {
      const jitiModule = await import('jiti');
      const createJiti = (jitiModule as any).default ?? jitiModule;
      const jiti = createJiti(filePath, {
        interopDefault: true,
        cache: false,
        requireCache: false,
      });
      const loaded = jiti(filePath);
      raw = (loaded as any)?.default ?? loaded;
    } catch (err) {
      throw new Error(
        `Failed to load config file "${filePath}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return {
    config: parseConfig(raw, filePath),
    configFile: filePath,
  };
}

/**
 * Validate and parse raw config data via Zod.
 * Provides helpful error messages on failure.
 */
function parseConfig(raw: unknown, filePath: string): ReactPilotConfig {
  const result = ReactPilotConfigSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid config in "${filePath}":\n${issues}\n\nSee https://reactpilot.dev/docs/config for the full schema.`
    );
  }

  return result.data;
}
