import { z } from 'zod';

declare const aiResponseSchema: z.ZodObject<{
    explanation: z.ZodString;
    patchedCode: z.ZodString;
    suggestions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        issue: z.ZodString;
        fix: z.ZodString;
        line: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        issue: string;
        fix: string;
        line?: number | undefined;
    }, {
        issue: string;
        fix: string;
        line?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    explanation: string;
    patchedCode: string;
    suggestions?: {
        issue: string;
        fix: string;
        line?: number | undefined;
    }[] | undefined;
}, {
    explanation: string;
    patchedCode: string;
    suggestions?: {
        issue: string;
        fix: string;
        line?: number | undefined;
    }[] | undefined;
}>;
type AiResponse = z.infer<typeof aiResponseSchema>;
interface AiPromptPayload {
    filePath: string;
    code: string;
    instructions: string;
    issues?: Array<{
        type: string;
        line: number;
        suggestion: string;
    }>;
}
/**
 * Propose AI-generated fixes for code issues
 */
declare function proposeFix(payload: AiPromptPayload): Promise<AiResponse>;
/**
 * Batch analyze multiple files
 */
declare function batchAnalyze(files: Array<{
    path: string;
    code: string;
}>): Promise<Map<string, AiResponse>>;
/**
 * Generate optimization suggestions
 */
declare function generateOptimizationSuggestions(code: string): string[];

export { type AiPromptPayload, type AiResponse, batchAnalyze, generateOptimizationSuggestions, proposeFix };
