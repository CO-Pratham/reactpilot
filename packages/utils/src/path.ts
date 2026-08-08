/**
 * Cross-platform path normalization utilities.
 *
 * On Windows, path.join/path.relative produce backslash-separated paths.
 * Any code that uses includes(), startsWith(), split() or regex on paths
 * must use normalizePath() first to convert to forward slashes.
 *
 * IMPORTANT: Use normalizePath() only for STRING COMPARISONS.
 * For actual fs operations, always use the original path.join/path.relative output.
 */

/**
 * Convert all backslashes in a path string to forward slashes.
 * Safe to call on all platforms — no-op on macOS/Linux.
 *
 * @example
 * normalizePath('src\\components\\Button.tsx') // 'src/components/Button.tsx'
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Check whether a path string (after normalization) starts with any of
 * the given prefix segments.
 */
export function pathStartsWith(p: string, ...prefixes: string[]): boolean {
  const normalized = normalizePath(p);
  return prefixes.some(prefix => normalized.startsWith(normalizePath(prefix)));
}

/**
 * Check whether a normalized path includes a given segment.
 */
export function pathIncludes(p: string, segment: string): boolean {
  return normalizePath(p).includes(normalizePath(segment));
}
