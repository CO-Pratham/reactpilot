import type { FileDiff, ReviewIssue } from '../types.js';
import { isReactFile } from '../diff-parser.js';

/**
 * Architecture reviewer — checks for circular-dependency indicators,
 * cross-layer imports, and component coupling issues.
 */
export function reviewArchitecture(files: FileDiff[]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const file of files) {
    if (!isReactFile(file.filename)) continue;

    const addedLines = file.hunks.flatMap((h) =>
      h.lines.filter((l) => l.type === 'added')
    );

    for (const line of addedLines) {
      const content = line.content;

      // Cross-layer imports: page importing from another page
      if (
        /from\s+['"][./]/.test(content) &&
        file.filename.includes('/pages/') &&
        /\/pages\//.test(content)
      ) {
        issues.push({
          category: 'architecture',
          severity: 'warning',
          message: 'Page component importing from another page — potential coupling issue.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Extract shared logic into a /components or /lib layer instead.',
          code: content.trim(),
        });
      }

      // Direct store imports in components (bypassing hooks)
      if (
        /from\s+['"].*store['"]/.test(content) &&
        !file.filename.includes('/store/') &&
        !file.filename.includes('/hooks/')
      ) {
        issues.push({
          category: 'architecture',
          severity: 'info',
          message: 'Direct store import in component — consider using a custom hook.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Wrap store access in a custom hook (e.g., useUser()) for better encapsulation.',
          code: content.trim(),
        });
      }

      // Barrel file deep imports (performance + coupling)
      if (/from\s+['"]\.\.\/\.\.\/\.\.\//.test(content)) {
        issues.push({
          category: 'architecture',
          severity: 'info',
          message: 'Deep relative import (3+ levels) — consider using path aliases.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Configure TypeScript path aliases (e.g., @/components) for cleaner imports.',
          code: content.trim(),
        });
      }
    }
  }

  return issues;
}
