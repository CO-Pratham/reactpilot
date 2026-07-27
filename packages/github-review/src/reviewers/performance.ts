import type { FileDiff, ReviewIssue } from '../types.js';
import { isReactFile } from '../diff-parser.js';
import { analyzeProject } from '@reactpilot/analyzer';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Performance reviewer — runs the ReactPilot AST analyzer on changed files
 * and converts analyzer issues into ReviewIssues.
 */
export async function reviewPerformance(
  files: FileDiff[],
  projectRoot: string
): Promise<ReviewIssue[]> {
  const issues: ReviewIssue[] = [];
  const reactFiles = files.filter((f) => isReactFile(f.filename) && f.status !== 'deleted');

  for (const file of reactFiles) {
    const absolutePath = path.resolve(projectRoot, file.filename);
    if (!fs.existsSync(absolutePath)) continue;

    // Analyze only this single file using the existing analyzer
    const report = analyzeProject(absolutePath);

    for (const issue of report.issues) {
      issues.push({
        category: 'performance',
        severity: mapSeverity(issue.severity),
        message: issue.suggestion,
        file: file.filename,
        line: issue.line,
        suggestion: getPerformanceSuggestion(issue.type),
      });
    }
  }

  return issues;
}

function mapSeverity(s: string): ReviewIssue['severity'] {
  if (s === 'error') return 'error';
  if (s === 'warning') return 'warning';
  return 'info';
}

function getPerformanceSuggestion(type: string): string {
  const map: Record<string, string> = {
    'inline-function': 'Extract the inline function into a useCallback hook.',
    'inline-function-jsx': 'Memoize the handler with useCallback to avoid re-renders.',
    'heavy-component': 'Break this component into smaller focused components.',
    'unused-import': 'Remove the unused import to reduce bundle size.',
    'unused-state': 'Remove or utilize the declared state variable.',
    'invalid-hook': 'Move the hook call to the top level of the component.',
    'deep-jsx': 'Flatten the JSX tree by extracting nested sections.',
    'expensive-render': 'Wrap this in React.memo or useMemo to prevent expensive re-renders.',
  };
  return map[type] ?? 'Review this pattern for performance implications.';
}
