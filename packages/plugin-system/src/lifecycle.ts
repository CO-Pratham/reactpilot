import type { PluginLogger } from './types.js';
import { colors } from '@reactpilot/utils/ui';

/**
 * Create a plugin-scoped logger.
 * Debug messages are only printed when debug mode is enabled.
 */
export function createLogger(pluginName: string, debug = false): PluginLogger {
  const prefix = colors.accent(`[${pluginName}]`);
  return {
    info:  (msg) => console.log(`${prefix} ${colors.info(msg)}`),
    warn:  (msg) => console.warn(`${prefix} ${colors.warning(msg)}`),
    error: (msg) => console.error(`${prefix} ${colors.error(msg)}`),
    debug: (msg) => { if (debug) console.log(`${prefix} ${colors.muted('[debug] ' + msg)}`); },
  };
}

/**
 * Plugin lifecycle hooks.
 * Plugin authors can export these from their entry file alongside the `setup` function.
 */
export interface PluginLifecycleHooks {
  /** Called after setup() completes */
  onLoad?(): Promise<void> | void;
  /** Called when the plugin is removed/unloaded */
  onUnload?(): Promise<void> | void;
  /** Called before analysis starts; receives file paths */
  onAnalyzeStart?(files: string[]): Promise<void> | void;
  /** Called after analysis finishes */
  onAnalyzeEnd?(issueCount: number): Promise<void> | void;
}

/**
 * Invoke a plugin lifecycle hook safely.
 * Errors in lifecycle hooks are caught and logged as warnings.
 */
export async function invokeHook<K extends keyof PluginLifecycleHooks>(
  hooks: PluginLifecycleHooks,
  hookName: K,
  ...args: Parameters<NonNullable<PluginLifecycleHooks[K]>>
): Promise<void> {
  const fn = hooks[hookName];
  if (typeof fn !== 'function') return;
  try {
    await (fn as (...a: unknown[]) => unknown)(...args);
  } catch (err) {
    console.warn(
      colors.warning(`Plugin lifecycle hook "${hookName}" failed: ${err instanceof Error ? err.message : String(err)}`)
    );
  }
}
