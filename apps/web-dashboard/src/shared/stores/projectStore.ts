import { create } from "zustand";
import { api } from "../services/api";
import type { Project } from "../types";

interface ProjectStore {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  selectProject: (id: string) => void;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  selectedProjectId: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await api.fetchProjects();
      set({
        projects: (projects ?? []).map(normalizeProject),
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  selectProject: (id) => set({ selectedProjectId: id }),

  addProject: (project) =>
    set((state) => {
      const normalized = normalizeProject(project);
      return {
        projects: [normalized, ...state.projects],
        selectedProjectId: normalized.id,
      };
    }),
}));

type ApiProject = Partial<Project> & {
  id: string | number;
  created_at?: string;
  last_analysis_at?: string;
  performance_score?: number;
};

function normalizeProject(project: ApiProject): Project {
  const fallbackId =
    typeof project.id === "string" || typeof project.id === "number"
      ? project.id
      : Date.now().toString();
  return {
    id: String(fallbackId),
    name: project.name ?? "Untitled project",
    description: project.description ?? "",
    createdAt:
      project.createdAt ?? project.created_at ?? new Date().toISOString(),
    lastAnalysisAt: project.lastAnalysisAt ?? project.last_analysis_at,
    performanceScore: project.performanceScore ?? project.performance_score,
  };
}
