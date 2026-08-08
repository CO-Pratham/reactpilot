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
      const cleanJson = extractJsonFromLLMResponse(rawResponse);
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
/**
 * Robustly extract a JSON string from an LLM response that may contain
 * markdown fences (```json ... ```, ``` ... ```), leading/trailing prose, etc.
 */
function extractJsonFromLLMResponse(raw: string): string {
  // 1. Try to find a JSON block inside any markdown fence (```json or ```)
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch?.[1]?.trim()) return fenceMatch[1].trim();
  // 2. Try to find the outermost JSON object
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch?.[0]) return objMatch[0].trim();
  // 3. Return trimmed raw as a last resort
  return raw.trim();
}

/**
 * Generate contextual fixes based on code analysis (mock engine).
 * IMPORTANT: patchedCode is never modified here — only suggestions are added.
 * Real code transformations require a live LLM with proper context.
 */
function generateContextualFixes(payload: AiPromptPayload): AiResponse {
  const { code, issues = [] } = payload;
  const suggestions: Array<{ issue: string; fix: string; line?: number }> = [];

  // 1. Report unused imports (suggestion only — do NOT splice lines from patchedCode)
  const unusedImports = issues.filter(i => i.type === 'unused-import');
  if (unusedImports.length > 0) {
    suggestions.push({
      issue: 'Unused imports detected',
      fix: `Remove ${unusedImports.length} unused import(s) to clean up the code`,
      line: unusedImports[0]?.line,
    });
  }

  // 2. Inline functions in JSX (suggestion only — real extraction requires AST rewrite)
  if (code.includes('onClick={() =>') || code.includes('onChange={() =>')) {
    suggestions.push({
      issue: 'Inline functions in JSX props',
      fix: 'Extract inline functions and wrap with useCallback to prevent unnecessary re-renders',
    });
  }

  // 3. Missing useEffect dependency array
  if (code.includes('useEffect') && !code.includes('useEffect(() =>')) {
    suggestions.push({
      issue: 'Missing useEffect dependency array',
      fix: 'Add dependency array to useEffect to control when it runs',
    });
  }

  // 4. Invalid hook usage
  if (issues.some(i => i.type === 'invalid-hook')) {
    suggestions.push({
      issue: 'Hooks called conditionally or in loops',
      fix: 'Move hook calls to the top level of the component',
      line: issues.find(i => i.type === 'invalid-hook')?.line,
    });
  }

  // 5. Heavy components
  if (issues.some(i => i.type === 'heavy-component')) {
    const heavyIssue = issues.find(i => i.type === 'heavy-component');
    suggestions.push({
      issue: 'Component is too large',
      fix: 'Consider extracting logical sections into smaller, reusable components',
      line: heavyIssue?.line,
    });
  }

  // 6. Inline objects/arrays in JSX (suggestion only — extraction requires AST rewrite)
  if (code.includes('style={{') || code.match(/\w+={[\[\{]/)) {
    suggestions.push({
      issue: 'Inline objects/arrays in JSX props',
      fix: 'Move object/array definitions outside component or wrap with useMemo',
    });
  }

  const explanation = buildExplanation(suggestions);

  return {
    explanation,
    patchedCode: code, // mock engine never mutates code — only real LLM does
    suggestions,
  };
}

// fixInlineFunctions and fixInlineObjects removed.
// They produced syntactically broken JSX (replacing multi-line handlers with a comment,
// and referencing an undefined `styles` variable). Real fixes require AST-based
// transformation backed by a live LLM — see proposeFix() with a configured API key.

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
 * Batch analyze multiple files with bounded concurrency (max 5 parallel requests)
 * to avoid sequential slowness while respecting LLM rate limits.
 */
export async function batchAnalyze(files: Array<{ path: string; code: string }>): Promise<Map<string, AiResponse>> {
  const results = new Map<string, AiResponse>();
  const BATCH_SIZE = 5;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(f =>
        proposeFix({
          filePath: f.path,
          code: f.code,
          instructions: 'Analyze and fix all issues',
        })
      )
    );
    settled.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        results.set(batch[idx].path, r.value);
      } else {
        console.warn(`batchAnalyze: failed for ${batch[idx].path}:`, r.reason);
      }
    });
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
