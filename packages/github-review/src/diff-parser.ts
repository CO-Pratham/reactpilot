import type { FileDiff, DiffHunk, DiffLine } from './types.js';

/**
 * Parse a unified diff string into structured FileDiff objects.
 * Handles multi-file diffs (e.g., from git diff or GitHub PR patches).
 */
export function parseDiff(rawDiff: string): FileDiff[] {
  const files: FileDiff[] = [];
  const fileBlocks = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const block of fileBlocks) {
    const file = parseFileBlock('diff --git ' + block);
    if (file) files.push(file);
  }

  return files;
}

function parseFileBlock(block: string): FileDiff | null {
  const lines = block.split('\n');

  const filenameMatch = lines[0].match(/^diff --git a\/(.*) b\/(.*)$/);
  if (!filenameMatch) return null;

  const filename = filenameMatch[2];
  let status: FileDiff['status'] = 'modified';

  if (lines.some((l) => l.startsWith('new file'))) status = 'added';
  else if (lines.some((l) => l.startsWith('deleted file'))) status = 'deleted';
  else if (lines.some((l) => l.startsWith('rename'))) status = 'renamed';

  const patchStart = lines.findIndex((l) => l.startsWith('@@'));
  const patch = patchStart >= 0 ? lines.slice(patchStart).join('\n') : undefined;

  const hunks: DiffHunk[] = [];
  const addedLines: string[] = [];
  const removedLines: string[] = [];

  if (patch) {
    const hunkBlocks = patch.split(/^@@/m).filter(Boolean);

    for (const hb of hunkBlocks) {
      const hunkLines = hb.split('\n');
      const headerMatch = hunkLines[0].match(/-(\d+)(?:,\d+)? \+(\d+)/);
      if (!headerMatch) continue;

      let lineNumber = parseInt(headerMatch[2], 10);
      const diffLines: DiffLine[] = [];

      for (const l of hunkLines.slice(1)) {
        if (l.startsWith('+')) {
          const content = l.slice(1);
          diffLines.push({ type: 'added', content, lineNumber });
          addedLines.push(content);
          lineNumber++;
        } else if (l.startsWith('-')) {
          const content = l.slice(1);
          diffLines.push({ type: 'removed', content, lineNumber });
          removedLines.push(content);
        } else if (l.startsWith(' ')) {
          diffLines.push({ type: 'context', content: l.slice(1), lineNumber });
          lineNumber++;
        }
      }

      hunks.push({
        header: `@@ ${hunkLines[0].trimEnd()} @@`,
        startLine: parseInt(headerMatch[2], 10),
        lines: diffLines,
      });
    }
  }

  return { filename, status, patch, hunks, addedLines, removedLines };
}

/**
 * Get all added lines from a file diff as a flat string (for pattern matching).
 */
export function getAddedContent(file: FileDiff): string {
  return file.addedLines.join('\n');
}

/**
 * Check if a file is a React component/hook file.
 */
export function isReactFile(filename: string): boolean {
  return /\.(tsx?|jsx?)$/.test(filename) && !filename.includes('__tests__');
}
