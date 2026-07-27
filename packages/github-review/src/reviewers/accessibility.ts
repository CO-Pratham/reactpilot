import type { FileDiff, ReviewIssue } from '../types.js';
import { isReactFile } from '../diff-parser.js';

/**
 * Accessibility reviewer — scans added JSX for missing ARIA attributes,
 * alt text, semantic HTML, and interactive element issues.
 */
export function reviewAccessibility(files: FileDiff[]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const file of files) {
    if (!isReactFile(file.filename)) continue;

    const addedLines = file.hunks.flatMap((h) =>
      h.lines.filter((l) => l.type === 'added')
    );

    for (const line of addedLines) {
      const content = line.content;

      // Missing alt on <img>
      if (/<img\b/i.test(content) && !/\balt\s*=/i.test(content)) {
        issues.push({
          category: 'accessibility',
          severity: 'error',
          message: '`<img>` element is missing an `alt` attribute.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Add alt="" for decorative images or a meaningful description for content images.',
          code: content.trim(),
        });
      }

      // onClick without keyboard handler
      if (/onClick\s*=/.test(content) && !/<(button|a|input|select|textarea)\b/i.test(content)) {
        if (!(/onKeyDown|onKeyUp|onKeyPress|role\s*=/.test(content))) {
          issues.push({
            category: 'accessibility',
            severity: 'warning',
            message: 'Interactive element missing keyboard handler or ARIA role.',
            file: file.filename,
            line: line.lineNumber,
            suggestion: 'Add `onKeyDown` handler or use a semantic `<button>` element instead of a div with onClick.',
            code: content.trim(),
          });
        }
      }

      // Missing aria-label on icon buttons
      if (/<button\b/i.test(content) && !content.includes('children') && !/aria-label|aria-labelledby/.test(content)) {
        issues.push({
          category: 'accessibility',
          severity: 'warning',
          message: 'Button may be missing an accessible label.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Add aria-label or aria-labelledby to buttons that only contain icons.',
          code: content.trim(),
        });
      }

      // Form inputs without labels
      if (/<input\b/i.test(content) && !/<label|aria-label|aria-labelledby|htmlFor/.test(content)) {
        issues.push({
          category: 'accessibility',
          severity: 'error',
          message: '`<input>` element may be missing an accessible label.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Associate a <label htmlFor="..."> or add aria-label to the input.',
          code: content.trim(),
        });
      }

      // Positive tabIndex (anti-pattern)
      if (/tabIndex\s*=\s*[{"]?\s*[1-9]/.test(content)) {
        issues.push({
          category: 'accessibility',
          severity: 'warning',
          message: 'Positive `tabIndex` disrupts natural keyboard navigation order.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Use tabIndex={0} or tabIndex={-1}. Restructure DOM order for natural tab flow.',
          code: content.trim(),
        });
      }
    }
  }

  return issues;
}
