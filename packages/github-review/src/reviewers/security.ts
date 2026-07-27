import type { FileDiff, ReviewIssue } from '../types.js';
import { getAddedContent, isReactFile } from '../diff-parser.js';

/**
 * Security reviewer — scans added lines for dangerous React/JS patterns.
 */
export function reviewSecurity(files: FileDiff[]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const file of files) {
    if (!isReactFile(file.filename)) continue;

    const added = getAddedContent(file);
    const addedHunkLines = file.hunks.flatMap((h) =>
      h.lines.filter((l) => l.type === 'added')
    );

    for (const line of addedHunkLines) {
      const content = line.content;

      if (content.includes('dangerouslySetInnerHTML')) {
        issues.push({
          category: 'security',
          severity: 'error',
          message: '`dangerouslySetInnerHTML` detected — risk of XSS attack.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Use a sanitization library (e.g., DOMPurify) before rendering HTML, or restructure to avoid raw HTML.',
          code: content.trim(),
        });
      }

      if (/\beval\s*\(/.test(content)) {
        issues.push({
          category: 'security',
          severity: 'critical',
          message: '`eval()` is used — severe security risk.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Replace eval() with a safer alternative or JSON.parse() for data parsing.',
          code: content.trim(),
        });
      }

      if (/new\s+Function\s*\(/.test(content)) {
        issues.push({
          category: 'security',
          severity: 'error',
          message: '`new Function()` is used — code injection risk.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Avoid dynamic code execution. Use a predefined function mapping instead.',
          code: content.trim(),
        });
      }

      if (/localStorage\s*\.\s*setItem\s*\(\s*['"]token|localStorage\s*\.\s*setItem\s*\(\s*['"]jwt/i.test(content)) {
        issues.push({
          category: 'security',
          severity: 'warning',
          message: 'JWT/auth token stored in localStorage — vulnerable to XSS.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Use httpOnly cookies for storing auth tokens instead of localStorage.',
          code: content.trim(),
        });
      }

      if (/\bwindow\.location\s*=\s*/.test(content) && content.includes('user')) {
        issues.push({
          category: 'security',
          severity: 'warning',
          message: 'Potential open redirect detected.',
          file: file.filename,
          line: line.lineNumber,
          suggestion: 'Validate redirect URLs against an allowlist before navigating.',
          code: content.trim(),
        });
      }
    }
  }

  return issues;
}
