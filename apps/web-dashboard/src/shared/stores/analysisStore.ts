import { create } from "zustand";
import { api } from "../services/api";
import type { AnalysisIssue, AnalysisSuggestion, AiPatch } from "../types";

interface AnalysisStore {
  issues: AnalysisIssue[];
  suggestions: AnalysisSuggestion[];
  patches: AiPatch[];
  performanceHistory: number[];
  isLoading: boolean;
  error: string | null;
  fetchAnalysis: (projectId: string | number) => Promise<void>;
  runAnalysis: (projectId: string | number) => Promise<void>;
  acceptPatch: (patchId: string) => void;
  rejectPatch: (patchId: string) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  issues: [],
  suggestions: [],
  patches: [],
  performanceHistory: [],
  isLoading: false,
  error: null,

  fetchAnalysis: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const report = await api.fetchReport(projectId);
      set({
        issues: normalizeIssues(report.issues ?? []),
        suggestions: normalizeSuggestions(report.suggestions ?? []),
        patches: normalizePatches(report.patches ?? []),
        performanceHistory: report.performanceHistory ?? [],
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  runAnalysis: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.analyzeProject(projectId);
      const report = result.report ?? result;
      set({
        issues: normalizeIssues(report.issues ?? []),
        suggestions: normalizeSuggestions(report.suggestions ?? []),
        patches: normalizePatches(report.patches ?? []),
        performanceHistory: report.performanceHistory ?? [],
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  acceptPatch: (patchId) =>
    set((state) => ({
      patches: state.patches.map((patch) =>
        patch.id === patchId ? { ...patch, status: "accepted" } : patch
      ),
    })),

  rejectPatch: (patchId) =>
    set((state) => ({
      patches: state.patches.map((patch) =>
        patch.id === patchId ? { ...patch, status: "rejected" } : patch
      ),
    })),
}));

type ApiIssue = Partial<AnalysisIssue> & {
  file_path?: string;
  issue_type?: string;
  line_number?: number;
};

type ApiSuggestion = Partial<AnalysisSuggestion>;

type ApiPatch = Partial<AiPatch> & {
  file_path?: string;
  original_code?: string;
  patched_code?: string;
};

function normalizeIssues(issues: ApiIssue[]): AnalysisIssue[] {
  return issues.map((issue, index) => ({
    id: issue.id ?? String(index),
    file: issue.file ?? issue.file_path ?? "unknown.tsx",
    line: issue.line ?? issue.line_number ?? 0,
    type: issue.type ?? issue.issue_type ?? "general",
    severity: issue.severity ?? "info",
    suggestion: issue.suggestion ?? "Review this issue.",
  }));
}

function normalizeSuggestions(
  suggestions: ApiSuggestion[]
): AnalysisSuggestion[] {
  return suggestions.map((suggestion, index) => ({
    id: suggestion.id ?? String(index),
    title: suggestion.title ?? "Suggestion",
    description: suggestion.description ?? "",
    impact: suggestion.impact ?? "low",
  }));
}

function normalizePatches(patches: ApiPatch[]): AiPatch[] {
  return patches.map((patch, index) => ({
    id: patch.id ?? String(index),
    filePath: patch.filePath ?? patch.file_path ?? "unknown.tsx",
    originalCode: patch.originalCode ?? patch.original_code ?? "",
    patchedCode: patch.patchedCode ?? patch.patched_code ?? "",
    status: patch.status ?? "pending",
    createdAt: patch.createdAt ?? new Date().toISOString(),
  }));
}
