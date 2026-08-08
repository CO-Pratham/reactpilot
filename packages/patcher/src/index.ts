import { createPatch, applyPatch as applyDiffPatch, diffLines } from 'diff';
import { parse } from '@babel/parser';

export interface PatchPayload {
  filePath: string;
  originalCode: string;
  patchedCode: string;
}

export interface PatchResult {
  filePath: string;
  applied: boolean;
  summary: string;
  diff?: string;
  conflicts?: string[];
}

/**
 * Create a visual diff preview of changes
 */
export function createPatchPreview(payload: PatchPayload): string {
  const diff = diffLines(payload.originalCode, payload.patchedCode);
  
  let preview = '';
  let lineNum = 1;
  
  diff.forEach((part) => {
    const lines = part.value.split(/\r?\n/).filter(l => l.length > 0);
    const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
    const color = part.added ? 'green' : part.removed ? 'red' : 'white';
    
    lines.forEach(line => {
      preview += `${prefix}${lineNum.toString().padStart(4, ' ')} | ${line}\n`;
      if (!part.removed) lineNum++;
    });
  });
  
  return preview;
}

/**
 * Create a unified diff format
 */
export function createUnifiedDiff(payload: PatchPayload): string {
  return createPatch(
    payload.filePath,
    payload.originalCode,
    payload.patchedCode,
    'Original',
    'Patched'
  );
}

/**
 * Apply a patch to code and return the result
 */
export function applyPatchToCode(payload: PatchPayload): PatchResult {
  const { filePath, originalCode, patchedCode } = payload;
  
  // If the codes are identical, no patch needed
  if (originalCode === patchedCode) {
    return {
      filePath,
      applied: true,
      summary: 'No changes needed - code is already up to date'
    };
  }

  // Create the diff
  const unifiedDiff = createUnifiedDiff(payload);
  
  // Try to apply the patch
  try {
    const result = applyDiffPatch(originalCode, unifiedDiff);
    
    if (result === false) {
      return {
        filePath,
        applied: false,
        summary: 'Patch could not be applied cleanly. Manual intervention required.',
        diff: unifiedDiff,
        conflicts: detectConflicts(originalCode, patchedCode)
      };
    }
    
    return {
      filePath,
      applied: true,
      summary: 'Patch applied successfully',
      diff: unifiedDiff
    };
  } catch (error) {
    return {
      filePath,
      applied: false,
      summary: `Patch application failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      diff: unifiedDiff
    };
  }
}

/**
 * Safely merge changes - attempts to apply patch intelligently
 */
export function safeMerge(payload: PatchPayload): PatchResult {
  const result = applyPatchToCode(payload);
  
  if (!result.applied && result.conflicts) {
    // Attempt smart merge - preserve original structure where possible
    const merged = attemptSmartMerge(payload);
    
    if (merged) {
      return {
        filePath: payload.filePath,
        applied: true,
        summary: 'Changes merged with conflict resolution',
        diff: createUnifiedDiff({ ...payload, patchedCode: merged })
      };
    }
  }
  
  return result;
}

/**
 * Detect semantic conflicts by finding replaced line blocks in the diff.
 */
function detectConflicts(original: string, patched: string): string[] {
  const conflicts: string[] = [];
  const diff = diffLines(original, patched);

  diff.forEach((part, index) => {
    // A conflict is a removed block immediately followed by an added block
    if (part.removed && index + 1 < diff.length && diff[index + 1].added) {
      const removed = part.value.trim().slice(0, 120);
      const added = diff[index + 1].value.trim().slice(0, 120);
      conflicts.push(`Changed: "${removed}" → "${added}"`);
    }
  });

  return conflicts;
}

/**
 * Attempt to intelligently merge changes using line diff analysis and AST syntax validation.
 * Returns merged code string if successful and syntactically valid; otherwise returns null.
 */
function attemptSmartMerge(payload: PatchPayload): string | null {
  const { originalCode, patchedCode, filePath } = payload;

  const diff = diffLines(originalCode, patchedCode);
  const resultLines: string[] = [];

  for (const part of diff) {
    if (!part.removed) {
      resultLines.push(part.value);
    }
  }

  const mergedCandidate = resultLines.join('');
  const ext = filePath.split('.').pop() as 'js' | 'jsx' | 'ts' | 'tsx';
  const fileType = ['js', 'jsx', 'ts', 'tsx'].includes(ext) ? ext : 'tsx';

  const validation = validatePatchedCode(mergedCandidate, fileType);
  if (validation.valid) {
    return mergedCandidate;
  }

  return null;
}

/**
 * Validate that patched code is syntactically correct
 */
/**
 * Validate that patched code is syntactically correct by attempting to parse it.
 * Uses @babel/parser so it handles JS, JSX, TS, and TSX correctly per file type.
 */
export function validatePatchedCode(
  code: string,
  fileType: 'js' | 'jsx' | 'ts' | 'tsx'
): { valid: boolean; errors: string[] } {
  const isTS = fileType === 'ts' || fileType === 'tsx';
  const isJSX = fileType === 'jsx' || fileType === 'tsx';
  try {
    parse(code, {
      sourceType: 'module',
      plugins: [
        ...(isTS ? (['typescript'] as const) : []),
        ...(isJSX ? (['jsx'] as const) : []),
        'decorators-legacy',
      ],
    });
    return { valid: true, errors: [] };
  } catch (err) {
    return {
      valid: false,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }
}

/**
 * Generate a summary of changes
 */
export function generateChangeSummary(payload: PatchPayload): {
  linesAdded: number;
  linesRemoved: number;
  linesModified: number;
  changePercentage: number;
} {
  const diff = diffLines(payload.originalCode, payload.patchedCode);
  
  let linesAdded = 0;
  let linesRemoved = 0;
  let linesModified = 0;
  
  diff.forEach((part, index) => {
    const lineCount = part.value.split(/\r?\n/).filter(l => l.length > 0).length;
    
    if (part.added) {
      linesAdded += lineCount;
      // Check if this is a modification (previous part was removed)
      if (index > 0 && diff[index - 1].removed) {
        linesModified += Math.min(lineCount, diff[index - 1].count || 0);
      }
    } else if (part.removed) {
      linesRemoved += lineCount;
    }
  });
  
  const totalOriginalLines = payload.originalCode.split(/\r?\n/).length;
  const changePercentage = totalOriginalLines > 0 
    ? ((linesAdded + linesRemoved) / totalOriginalLines) * 100 
    : 0;
  
  return {
    linesAdded,
    linesRemoved,
    linesModified,
    changePercentage: Math.round(changePercentage * 100) / 100
  };
}

/**
 * Batch apply patches to multiple files
 */
export function batchApplyPatches(patches: PatchPayload[]): Map<string, PatchResult> {
  const results = new Map<string, PatchResult>();
  
  patches.forEach(patch => {
    const result = applyPatchToCode(patch);
    results.set(patch.filePath, result);
  });
  
  return results;
}
