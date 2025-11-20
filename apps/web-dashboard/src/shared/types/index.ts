export type PatchStatus = "pending" | "accepted" | "rejected";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastAnalysisAt?: string;
  performanceScore?: number;
}

export interface ProjectFile {
  path: string;
  size: number;
  type: "component" | "hook" | "context" | "route" | "utility";
}

export interface AnalysisIssue {
  id: string;
  file: string;
  line: number;
  type: string;
  severity: "info" | "warning" | "error";
  suggestion: string;
}

export interface AnalysisSuggestion {
  id: string;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
}

export interface AiPatch {
  id: string;
  filePath: string;
  originalCode: string;
  patchedCode: string;
  status: PatchStatus;
  createdAt: string;
}
