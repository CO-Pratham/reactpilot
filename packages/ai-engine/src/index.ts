import { z } from 'zod';

const aiResponseSchema = z.object({
  explanation: z.string(),
  patchedCode: z.string(),
  suggestions: z.array(z.object({
    issue: z.string(),
    fix: z.string(),
    line: z.number().optional()
  })).optional()
});

export type AiResponse = z.infer<typeof aiResponseSchema>;

export interface AiPromptPayload {
  filePath: string;
  code: string;
  instructions: string;
  issues?: Array<{ type: string; line: number; suggestion: string }>;
}

/**
 * Propose AI-generated fixes for code issues
 */
import { LLMService } from './llm.js';

/**
 * Propose AI-generated fixes for code issues
 */
export async function proposeFix(payload: AiPromptPayload): Promise<AiResponse> {
  const llm = new LLMService();
  
  if (llm.isConfigured()) {
    try {
      const prompt = buildPrompt(payload);
      // Force JSON response from LLM for easier parsing
      const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object matching this schema:
      {
        "explanation": "string",
        "patchedCode": "string",
        "suggestions": [{ "issue": "string", "fix": "string", "line": number }]
      }`;
      
      const rawResponse = await llm.getCompletion(jsonPrompt);
      
      // Clean up potential markdown code blocks in response
      const cleanJson = rawResponse.replace(/```json\n|\n```/g, '').trim();
      
      return aiResponseSchema.parse(JSON.parse(cleanJson));
    } catch (error) {
      console.warn('LLM generation failed, falling back to mock engine:', error);
    }
  } else {
    console.info('No API key found (REACTPILOT_API_KEY). Using mock AI engine.');
  }

  // Fallback to mock logic
  const fixes = generateContextualFixes(payload);
  return aiResponseSchema.parse(fixes);
}

/**
 * Generate contextual fixes based on code analysis
 */
function generateContextualFixes(payload: AiPromptPayload): AiResponse {
  const { code, issues = [] } = payload;
  let patchedCode = code;
  const suggestions: Array<{ issue: string; fix: string; line?: number }> = [];

  // Apply automatic fixes for common issues
  
  // 1. Fix unused imports
    const unusedImports = issues.filter(i => i.type === 'unused-import');
    suggestions.push({
      issue: 'Unused imports detected',
      fix: `Remove ${unusedImports.length} unused import(s) to clean up the code`,
      line: unusedImports[0]?.line
    });
    
    // Simple line-based removal for mock engine
    const lines = patchedCode.split('\n');
    // Sort lines descending to avoid index shifting issues
    const linesToRemove = unusedImports.map(i => i.line - 1).sort((a, b) => b - a);
    
    linesToRemove.forEach(lineIdx => {
      if (lineIdx >= 0 && lineIdx < lines.length) {
        lines.splice(lineIdx, 1);
      }
    });
    patchedCode = lines.join('\n');

  // 2. Fix inline functions in JSX (re-render risks)
  if (code.includes('onClick={() =>') || code.includes('onChange={() =>')) {
    patchedCode = fixInlineFunctions(code);
    suggestions.push({
      issue: 'Inline functions in JSX props',
      fix: 'Extract inline functions and wrap with useCallback to prevent unnecessary re-renders'
    });
  }

  // 3. Fix missing useEffect dependencies
  if (code.includes('useEffect') && !code.includes('useEffect(() =>')) {
    suggestions.push({
      issue: 'Missing useEffect dependency array',
      fix: 'Add dependency array to useEffect to control when it runs'
    });
  }

  // 4. Fix invalid hook usage
  if (issues.some(i => i.type === 'invalid-hook')) {
    suggestions.push({
      issue: 'Hooks called conditionally or in loops',
      fix: 'Move hook calls to the top level of the component',
      line: issues.find(i => i.type === 'invalid-hook')?.line
    });
  }

  // 5. Suggest breaking down heavy components
  if (issues.some(i => i.type === 'heavy-component')) {
    const heavyIssue = issues.find(i => i.type === 'heavy-component');
    suggestions.push({
      issue: 'Component is too large',
      fix: 'Consider extracting logical sections into smaller, reusable components',
      line: heavyIssue?.line
    });
  }

  // 6. Fix inline objects/arrays in JSX
  if (code.includes('style={{') || code.match(/\w+={[\[\{]/)) {
    patchedCode = fixInlineObjects(patchedCode);
    suggestions.push({
      issue: 'Inline objects/arrays in JSX props',
      fix: 'Move object/array definitions outside component or wrap with useMemo'
    });
  }

  const explanation = buildExplanation(suggestions);

  return {
    explanation,
    patchedCode,
    suggestions
  };
}

/**
 * Fix inline functions by extracting them
 */
function fixInlineFunctions(code: string): string {
  let fixed = code;
  
  // Example: Convert onClick={() => doSomething()} to onClick={handleClick}
  // This is a simplified example; real implementation would use AST transformation
  
  const inlineFunctionPattern = /onClick=\{(\(\) => [^}]+)\}/g;
  const matches = code.match(inlineFunctionPattern);
  
  if (matches) {
    // In a real implementation, we'd:
    // 1. Extract the function body
    // 2. Create a useCallback hook
    // 3. Replace the inline function with the callback reference
    
    fixed = code.replace(
      inlineFunctionPattern,
      'onClick={handleClick} // TODO: Add useCallback'
    );
  }
  
  return fixed;
}

/**
 * Fix inline objects by extracting them
 */
function fixInlineObjects(code: string): string {
  let fixed = code;
  
  // Example: Extract style objects
  const stylePattern = /style=\{\{([^}]+)\}\}/g;
  
  if (stylePattern.test(code)) {
    // In a real implementation, we'd:
    // 1. Extract the style object
    // 2. Define it outside the component or use useMemo
    // 3. Replace the inline object with the reference
    
    fixed = code.replace(
      stylePattern,
      'style={styles} // TODO: Define styles outside or use useMemo'
    );
  }
  
  return fixed;
}

/**
 * Build explanation text from suggestions
 */
function buildExplanation(suggestions: Array<{ issue: string; fix: string; line?: number }>): string {
  if (suggestions.length === 0) {
    return 'No significant issues detected. Code looks good!';
  }

  let explanation = '## Code Analysis & Fixes\n\n';
  
  suggestions.forEach((suggestion, index) => {
    explanation += `### ${index + 1}. ${suggestion.issue}\n`;
    if (suggestion.line) {
      explanation += `**Line ${suggestion.line}**: `;
    }
    explanation += `${suggestion.fix}\n\n`;
  });

  explanation += '\n## Recommendations\n\n';
  explanation += '- Review the suggested changes carefully\n';
  explanation += '- Test the code after applying fixes\n';
  explanation += '- Consider following React best practices for optimal performance\n';

  return explanation;
}

/**
 * Build prompt for LLM (when integrated)
 */
function buildPrompt({ filePath, code, instructions, issues = [] }: AiPromptPayload): string {
  let prompt = `You are ReactPilot, an expert React code assistant specialized in performance optimization and best practices.\n\n`;
  
  prompt += `File: ${filePath}\n`;
  prompt += `Instructions: ${instructions}\n\n`;
  
  if (issues.length > 0) {
    prompt += `## Detected Issues:\n`;
    issues.forEach((issue, i) => {
      prompt += `${i + 1}. [Line ${issue.line}] ${issue.type}: ${issue.suggestion}\n`;
    });
    prompt += '\n';
  }
  
  prompt += `## Code:\n\`\`\`tsx\n${code}\n\`\`\`\n\n`;
  
  prompt += `Please provide:\n`;
  prompt += `1. A detailed explanation of the issues and recommended fixes\n`;
  prompt += `2. The complete corrected code\n`;
  prompt += `3. Specific line-by-line suggestions for improvements\n\n`;
  prompt += `Focus on:\n`;
  prompt += `- Preventing unnecessary re-renders\n`;
  prompt += `- Fixing hook rule violations\n`;
  prompt += `- Removing unused code\n`;
  prompt += `- Improving component structure\n`;
  prompt += `- Following React best practices\n`;

  return prompt;
}

/**
 * Batch analyze multiple files
 */
export async function batchAnalyze(files: Array<{ path: string; code: string }>): Promise<Map<string, AiResponse>> {
  const results = new Map<string, AiResponse>();
  
  for (const file of files) {
    const result = await proposeFix({
      filePath: file.path,
      code: file.code,
      instructions: 'Analyze and fix all issues'
    });
    results.set(file.path, result);
  }
  
  return results;
}

/**
 * Generate optimization suggestions
 */
export function generateOptimizationSuggestions(code: string): string[] {
  const suggestions: string[] = [];
  
  if (!code.includes('React.memo') && code.includes('export')) {
    suggestions.push('Consider wrapping component with React.memo to prevent unnecessary re-renders');
  }
  
  if (code.includes('.map(') && !code.includes('key=')) {
    suggestions.push('Add unique keys to list items to optimize reconciliation');
  }
  
  if (code.includes('useState') && code.includes('useEffect')) {
    suggestions.push('Review state updates in useEffect to avoid infinite loops');
  }
  
  if (code.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{500,}\}/)) {
    suggestions.push('Large function detected - consider breaking into smaller functions');
  }
  
  return suggestions;
}
