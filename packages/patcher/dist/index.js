// src/index.ts
import { createPatch, applyPatch as applyDiffPatch, diffLines } from "diff";
function createPatchPreview(payload) {
  const diff = diffLines(payload.originalCode, payload.patchedCode);
  let preview = "";
  let lineNum = 1;
  diff.forEach((part) => {
    const lines = part.value.split("\n").filter((l) => l.length > 0);
    const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
    const color = part.added ? "green" : part.removed ? "red" : "white";
    lines.forEach((line) => {
      preview += `${prefix}${lineNum.toString().padStart(4, " ")} | ${line}
`;
      if (!part.removed) lineNum++;
    });
  });
  return preview;
}
function createUnifiedDiff(payload) {
  return createPatch(
    payload.filePath,
    payload.originalCode,
    payload.patchedCode,
    "Original",
    "Patched"
  );
}
function applyPatchToCode(payload) {
  const { filePath, originalCode, patchedCode } = payload;
  if (originalCode === patchedCode) {
    return {
      filePath,
      applied: true,
      summary: "No changes needed - code is already up to date"
    };
  }
  const unifiedDiff = createUnifiedDiff(payload);
  try {
    const result = applyDiffPatch(originalCode, unifiedDiff);
    if (result === false) {
      return {
        filePath,
        applied: false,
        summary: "Patch could not be applied cleanly. Manual intervention required.",
        diff: unifiedDiff,
        conflicts: detectConflicts(originalCode, patchedCode)
      };
    }
    return {
      filePath,
      applied: true,
      summary: "Patch applied successfully",
      diff: unifiedDiff
    };
  } catch (error) {
    return {
      filePath,
      applied: false,
      summary: `Patch application failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      diff: unifiedDiff
    };
  }
}
function safeMerge(payload) {
  const result = applyPatchToCode(payload);
  if (!result.applied && result.conflicts) {
    const merged = attemptSmartMerge(payload);
    if (merged) {
      return {
        filePath: payload.filePath,
        applied: true,
        summary: "Changes merged with conflict resolution",
        diff: createUnifiedDiff({ ...payload, patchedCode: merged })
      };
    }
  }
  return result;
}
function detectConflicts(original, patched) {
  const conflicts = [];
  const diff = diffLines(original, patched);
  let inConflict = false;
  let conflictContext = "";
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
function attemptSmartMerge(payload) {
  const { originalCode, patchedCode } = payload;
  const originalLines = originalCode.split("\n");
  const patchedLines = patchedCode.split("\n");
  const lengthDiff = Math.abs(originalLines.length - patchedLines.length);
  if (lengthDiff > originalLines.length * 0.5) {
    return null;
  }
  return patchedCode;
}
function validatePatchedCode(code, fileType) {
  const errors = [];
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
  if (code.includes("import") && !code.match(/import\s+.+\s+from\s+['"][^'"]+['"]/)) {
    errors.push("Possibly malformed import statement");
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
function generateChangeSummary(payload) {
  const diff = diffLines(payload.originalCode, payload.patchedCode);
  let linesAdded = 0;
  let linesRemoved = 0;
  let linesModified = 0;
  diff.forEach((part, index) => {
    const lineCount = part.value.split("\n").filter((l) => l.length > 0).length;
    if (part.added) {
      linesAdded += lineCount;
      if (index > 0 && diff[index - 1].removed) {
        linesModified += Math.min(lineCount, diff[index - 1].count || 0);
      }
    } else if (part.removed) {
      linesRemoved += lineCount;
    }
  });
  const totalOriginalLines = payload.originalCode.split("\n").length;
  const changePercentage = totalOriginalLines > 0 ? (linesAdded + linesRemoved) / totalOriginalLines * 100 : 0;
  return {
    linesAdded,
    linesRemoved,
    linesModified,
    changePercentage: Math.round(changePercentage * 100) / 100
  };
}
function batchApplyPatches(patches) {
  const results = /* @__PURE__ */ new Map();
  patches.forEach((patch) => {
    const result = applyPatchToCode(patch);
    results.set(patch.filePath, result);
  });
  return results;
}
export {
  applyPatchToCode,
  batchApplyPatches,
  createPatchPreview,
  createUnifiedDiff,
  generateChangeSummary,
  safeMerge,
  validatePatchedCode
};
