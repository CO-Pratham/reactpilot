import { applyPatchToCode, createPatchPreview } from '@reactpilot/patcher';

export function previewPatch(originalCode: string, patchedCode: string) {
  return createPatchPreview({
    filePath: 'virtual',
    originalCode,
    patchedCode
  });
}

export function applyPatch(filePath: string, originalCode: string, patchedCode: string) {
  return applyPatchToCode({
    filePath,
    originalCode,
    patchedCode
  });
}

