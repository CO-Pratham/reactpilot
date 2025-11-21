import type * as t from "@babel/types";

export interface AnalyzerReport {
  issues: AnalyzerIssue[];
  componentsScanned: number;
  filesScanned: number;
  performanceScore: number;
  stats: {
    hooksUsed: number;
    inlineHandlers: number;
    heavyComponents: number;
    potentialBugs: number;
  };
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export interface AnalyzerIssue {
  file: string;
  type: string;
  line: number;
  column?: number;
  suggestion: string;
  severity: "error" | "warning" | "info";
  details?: Record<string, any>;
}

export interface AnalyzerContext {
  filePath: string;
  code: string;
  ast: t.File;
  issues: AnalyzerIssue[];
}

export interface Rule {
  name: string;
  visitor: any; // Babel visitor
}

export interface AnalyzeOptions {
  rules?: string[];
}
