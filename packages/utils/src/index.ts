import { z } from 'zod';

export const analysisIssueSchema = z.object({
  file: z.string(),
  type: z.string(),
  line: z.number(),
  suggestion: z.string()
});

export type AnalysisIssue = z.infer<typeof analysisIssueSchema>;

export function timestamp() {
  return new Date().toISOString();
}

