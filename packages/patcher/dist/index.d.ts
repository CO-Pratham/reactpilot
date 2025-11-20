interface PatchPayload {
    filePath: string;
    originalCode: string;
    patchedCode: string;
}
interface PatchResult {
    filePath: string;
    applied: boolean;
    summary: string;
    diff?: string;
    conflicts?: string[];
}
/**
 * Create a visual diff preview of changes
 */
declare function createPatchPreview(payload: PatchPayload): string;
/**
 * Create a unified diff format
 */
declare function createUnifiedDiff(payload: PatchPayload): string;
/**
 * Apply a patch to code and return the result
 */
declare function applyPatchToCode(payload: PatchPayload): PatchResult;
/**
 * Safely merge changes - attempts to apply patch intelligently
 */
declare function safeMerge(payload: PatchPayload): PatchResult;
/**
 * Validate that patched code is syntactically correct
 */
declare function validatePatchedCode(code: string, fileType: 'js' | 'jsx' | 'ts' | 'tsx'): {
    valid: boolean;
    errors: string[];
};
/**
 * Generate a summary of changes
 */
declare function generateChangeSummary(payload: PatchPayload): {
    linesAdded: number;
    linesRemoved: number;
    linesModified: number;
    changePercentage: number;
};
/**
 * Batch apply patches to multiple files
 */
declare function batchApplyPatches(patches: PatchPayload[]): Map<string, PatchResult>;

export { type PatchPayload, type PatchResult, applyPatchToCode, batchApplyPatches, createPatchPreview, createUnifiedDiff, generateChangeSummary, safeMerge, validatePatchedCode };
