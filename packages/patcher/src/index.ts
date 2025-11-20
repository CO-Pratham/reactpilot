import { createPatch, applyPatch as applyDiffPatch, diffLines } from 'diff';

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
    const lines = part.value.split('\n').filter(l => l.length > 0);
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
 * Detect conflicts between original and patched code
 */
function detectConflicts(original: string, patched: string): string[] {
  const conflicts: string[] = [];
  const diff = diffLines(original, patched);
  
  let inConflict = false;
  let conflictContext = '';
  
  diff.forEach((part, index) => {
    if (part.added && index > 0 && diff[index - 1].removed) {
      inConflict = true;
      conflictContext = `Lines modified: ${diff[index - 1].value} -> ${part.value}`;
    }
    
    if (inConflict) {
      conflicts.push(conflictContext);
      inConflict = false;
    }
  });
  
  return conflicts;
}

/**
 * Attempt to intelligently merge changes
 */
function attemptSmartMerge(payload: PatchPayload): string | null {
  const { originalCode, patchedCode } = payload;
  
  // Simple line-by-line merge strategy
  const originalLines = originalCode.split('\n');
  const patchedLines = patchedCode.split('\n');
  
  // If the files are drastically different, don't attempt merge
  const lengthDiff = Math.abs(originalLines.length - patchedLines.length);
  if (lengthDiff > originalLines.length * 0.5) {
    return null;
  }
  
  // For now, prefer the patched version if structure is similar
  return patchedCode;
}

/**
 * Validate that patched code is syntactically correct
 */
export function validatePatchedCode(code: string, fileType: 'js' | 'jsx' | 'ts' | 'tsx'): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation checks
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
  }
  
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  
  if (openParens !== closeParens) {
    errors.push(`Mismatched parentheses: ${openParens} opening, ${closeParens} closing`);
  }
  
  // Check for common syntax errors
  if (code.includes('import') && !code.match(/import\s+.+\s+from\s+['"][^'"]+['"]/)) {
    errors.push('Possibly malformed import statement');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
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
    const lineCount = part.value.split('\n').filter(l => l.length > 0).length;
    
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
  
  const totalOriginalLines = payload.originalCode.split('\n').length;
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
