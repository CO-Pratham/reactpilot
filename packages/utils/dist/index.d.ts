import { z } from 'zod';

declare const analysisIssueSchema: z.ZodObject<{
    file: z.ZodString;
    type: z.ZodString;
    line: z.ZodNumber;
    suggestion: z.ZodString;
}, "strip", z.ZodTypeAny, {
    file: string;
    type: string;
    line: number;
    suggestion: string;
}, {
    file: string;
    type: string;
    line: number;
    suggestion: string;
}>;
type AnalysisIssue = z.infer<typeof analysisIssueSchema>;
declare function timestamp(): string;

export { type AnalysisIssue, analysisIssueSchema, timestamp };
