// src/index.ts
import { z } from "zod";
var aiResponseSchema = z.object({
  explanation: z.string(),
  patchedCode: z.string(),
  suggestions: z.array(z.object({
    issue: z.string(),
    fix: z.string(),
    line: z.number().optional()
  })).optional()
});
async function proposeFix(payload) {
  const prompt = buildPrompt(payload);
  const fixes = generateContextualFixes(payload);
  return aiResponseSchema.parse(fixes);
}
function generateContextualFixes(payload) {
  const { code, issues = [] } = payload;
  let patchedCode = code;
  const suggestions = [];
  if (issues.some((i) => i.type === "unused-import")) {
    const unusedImports = issues.filter((i) => i.type === "unused-import");
    suggestions.push({
      issue: "Unused imports detected",
      fix: `Remove ${unusedImports.length} unused import(s) to clean up the code`,
      line: unusedImports[0]?.line
    });
  }
  if (code.includes("onClick={() =>") || code.includes("onChange={() =>")) {
    patchedCode = fixInlineFunctions(code);
    suggestions.push({
      issue: "Inline functions in JSX props",
      fix: "Extract inline functions and wrap with useCallback to prevent unnecessary re-renders"
    });
  }
  if (code.includes("useEffect") && !code.includes("useEffect(() =>")) {
    suggestions.push({
      issue: "Missing useEffect dependency array",
      fix: "Add dependency array to useEffect to control when it runs"
    });
  }
  if (issues.some((i) => i.type === "invalid-hook")) {
    suggestions.push({
      issue: "Hooks called conditionally or in loops",
      fix: "Move hook calls to the top level of the component",
      line: issues.find((i) => i.type === "invalid-hook")?.line
    });
  }
  if (issues.some((i) => i.type === "heavy-component")) {
    const heavyIssue = issues.find((i) => i.type === "heavy-component");
    suggestions.push({
      issue: "Component is too large",
      fix: "Consider extracting logical sections into smaller, reusable components",
      line: heavyIssue?.line
    });
  }
  if (code.includes("style={{") || code.match(/\w+={[\[\{]/)) {
    patchedCode = fixInlineObjects(patchedCode);
    suggestions.push({
      issue: "Inline objects/arrays in JSX props",
      fix: "Move object/array definitions outside component or wrap with useMemo"
    });
  }
  const explanation = buildExplanation(suggestions);
  return {
    explanation,
    patchedCode,
    suggestions
  };
}
function fixInlineFunctions(code) {
  let fixed = code;
  const inlineFunctionPattern = /onClick=\{(\(\) => [^}]+)\}/g;
  const matches = code.match(inlineFunctionPattern);
  if (matches) {
    fixed = code.replace(
      inlineFunctionPattern,
      "onClick={handleClick} // TODO: Add useCallback"
    );
  }
  return fixed;
}
function fixInlineObjects(code) {
  let fixed = code;
  const stylePattern = /style=\{\{([^}]+)\}\}/g;
  if (stylePattern.test(code)) {
    fixed = code.replace(
      stylePattern,
      "style={styles} // TODO: Define styles outside or use useMemo"
    );
  }
  return fixed;
}
function buildExplanation(suggestions) {
  if (suggestions.length === 0) {
    return "No significant issues detected. Code looks good!";
  }
  let explanation = "## Code Analysis & Fixes\n\n";
  suggestions.forEach((suggestion, index) => {
    explanation += `### ${index + 1}. ${suggestion.issue}
`;
    if (suggestion.line) {
      explanation += `**Line ${suggestion.line}**: `;
    }
    explanation += `${suggestion.fix}

`;
  });
  explanation += "\n## Recommendations\n\n";
  explanation += "- Review the suggested changes carefully\n";
  explanation += "- Test the code after applying fixes\n";
  explanation += "- Consider following React best practices for optimal performance\n";
  return explanation;
}
function buildPrompt({ filePath, code, instructions, issues = [] }) {
  let prompt = `You are ReactPilot, an expert React code assistant specialized in performance optimization and best practices.

`;
  prompt += `File: ${filePath}
`;
  prompt += `Instructions: ${instructions}

`;
  if (issues.length > 0) {
    prompt += `## Detected Issues:
`;
    issues.forEach((issue, i) => {
      prompt += `${i + 1}. [Line ${issue.line}] ${issue.type}: ${issue.suggestion}
`;
    });
    prompt += "\n";
  }
  prompt += `## Code:
\`\`\`tsx
${code}
\`\`\`

`;
  prompt += `Please provide:
`;
  prompt += `1. A detailed explanation of the issues and recommended fixes
`;
  prompt += `2. The complete corrected code
`;
  prompt += `3. Specific line-by-line suggestions for improvements

`;
  prompt += `Focus on:
`;
  prompt += `- Preventing unnecessary re-renders
`;
  prompt += `- Fixing hook rule violations
`;
  prompt += `- Removing unused code
`;
  prompt += `- Improving component structure
`;
  prompt += `- Following React best practices
`;
  return prompt;
}
async function batchAnalyze(files) {
  const results = /* @__PURE__ */ new Map();
  for (const file of files) {
    const result = await proposeFix({
      filePath: file.path,
      code: file.code,
      instructions: "Analyze and fix all issues"
    });
    results.set(file.path, result);
  }
  return results;
}
function generateOptimizationSuggestions(code) {
  const suggestions = [];
  if (!code.includes("React.memo") && code.includes("export")) {
    suggestions.push("Consider wrapping component with React.memo to prevent unnecessary re-renders");
  }
  if (code.includes(".map(") && !code.includes("key=")) {
    suggestions.push("Add unique keys to list items to optimize reconciliation");
  }
  if (code.includes("useState") && code.includes("useEffect")) {
    suggestions.push("Review state updates in useEffect to avoid infinite loops");
  }
  if (code.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{500,}\}/)) {
    suggestions.push("Large function detected - consider breaking into smaller functions");
  }
  return suggestions;
}
export {
  batchAnalyze,
  generateOptimizationSuggestions,
  proposeFix
};
