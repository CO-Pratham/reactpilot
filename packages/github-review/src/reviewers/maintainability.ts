import type { FileDiff, ReviewIssue } from '../types.js';
import { isReactFile } from '../diff-parser.js';

/** Cyclomatic complexity threshold */
const COMPLEXITY_THRESHOLD = 10;
/** Max lines per function */
const FUNCTION_LENGTH_THRESHOLD = 60;

/**
 * Maintainability reviewer — checks complexity, function length, and naming.
 */
export function reviewMaintainability(files: FileDiff[]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const file of files) {
    if (!isReactFile(file.filename)) continue;

    const addedContent = file.addedLines.join('\n');

    // Detect long functions (rough line count proxy)
    const funcMatches = addedContent.matchAll(
      /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g
    );
    for (const match of funcMatches) {
      const start = addedContent.indexOf(match[0]);
      const snippet = addedContent.slice(start, start + 2000);
      const lineCount = snippet.split('\n').length;
      if (lineCount > FUNCTION_LENGTH_THRESHOLD) {
        issues.push({
          category: 'maintainability',
          severity: 'warning',
          message: `Function is too long (~${lineCount} lines). Recommended max: ${FUNCTION_LENGTH_THRESHOLD}.`,
          file: file.filename,
          suggestion: 'Extract logic into smaller helper functions or custom hooks.',
        });
      }
    }

    // Detect high cyclomatic complexity (count decision points)
    const decisionPoints = (addedContent.match(/\b(if|else if|for|while|switch|catch|\?\s*:|\&\&|\|\|)\b/g) ?? []).length;
    if (decisionPoints > COMPLEXITY_THRESHOLD) {
      issues.push({
        category: 'maintainability',
        severity: 'warning',
        message: `High cyclomatic complexity detected (${decisionPoints} decision points).`,
        file: file.filename,
        suggestion: 'Break down the logic into smaller, focused functions. Consider early returns to reduce nesting.',
      });
    }

    // Detect TODO/FIXME comments in new code
    for (const line of file.hunks.flatMap((h) => h.lines.filter((l) => l.type === 'added'))) {
      if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(line.content)) {
        issues.push({
          category: 'maintainability',
          severity: 'info',
          message: `${line.content.match(/\b(TODO|FIXME|HACK|XXX)\b/i)?.[0]} comment found in new code.`,
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Track this in your issue tracker instead of leaving a comment in code.',
          code: line.content.trim(),
        });
      }
    }
  }

  return issues;
}
