import type { FileDiff, ReviewIssue } from '../types.js';
import { isReactFile } from '../diff-parser.js';

/**
 * Bundle impact reviewer — detects heavy imports, non-tree-shakeable patterns,
 * and opportunities for dynamic imports.
 */
export function reviewBundle(files: FileDiff[]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  const HEAVY_IMPORTS: Array<{ pkg: string; suggestion: string }> = [
    { pkg: 'lodash', suggestion: 'Import individual functions: `import debounce from "lodash/debounce"` or use native alternatives.' },
    { pkg: 'moment', suggestion: 'Replace moment.js with date-fns or the native Intl API — moment adds ~300KB.' },
    { pkg: '@mui/icons-material', suggestion: 'Import specific icons: `import { Home } from "@mui/icons-material/Home"` to enable tree-shaking.' },
    { pkg: 'antd', suggestion: 'Use babel-plugin-import for tree-shaking antd components.' },
    { pkg: 'rxjs', suggestion: 'Import only needed operators: `import { map } from "rxjs/operators"`.' },
  ];

  for (const file of files) {
    if (!isReactFile(file.filename)) continue;

    const addedLines = file.hunks.flatMap((h) =>
      h.lines.filter((l) => l.type === 'added')
    );

    for (const line of addedLines) {
      const content = line.content;

      // Check for heavy imports
      for (const { pkg, suggestion } of HEAVY_IMPORTS) {
        if (new RegExp(`from ['"]${pkg}['"]`).test(content)) {
          issues.push({
            category: 'bundle',
            severity: 'warning',
            message: `Heavy import detected: \`${pkg}\``,
            file: file.filename,
            line: line.lineNumber,
            suggestion,
            code: content.trim(),
          });
        }
      }

      // Dynamic import opportunity (large conditional renders)
      if (
        /import\s+\w+\s+from/.test(content) &&
        /Page|Modal|Dialog|Drawer|Chart|Editor/.test(content) &&
        !content.includes('next/dynamic') &&
        !content.includes('React.lazy')
      ) {
        issues.push({
          category: 'bundle',
          severity: 'info',
          message: `Consider lazy-loading this import for better initial load time.`,
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Use `React.lazy(() => import(...))` or Next.js `dynamic()` for route-level code splitting.',
          code: content.trim(),
        });
      }
    }
  }

  return issues;
}
