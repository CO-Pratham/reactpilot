import { create } from "zustand";
import { api } from "../services/api";
import type { ProjectFile } from "../types";

interface FileStore {
  files: ProjectFile[];
  selectedFilePath: string | null;
  isLoading: boolean;
  error: string | null;
  fetchFiles: (projectId: string | number) => Promise<void>;
  selectFile: (path: string) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  selectedFilePath: null,
  isLoading: false,
  error: null,

  fetchFiles: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const project = await api.fetchProject(projectId);
      const normalizedFiles = (project.files ?? []).map(normalizeProjectFile);
      set({
        files: normalizedFiles,
        selectedFilePath: normalizedFiles[0]?.path ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  selectFile: (path) => set({ selectedFilePath: path }),
}));

type ApiProjectFile = Partial<ProjectFile> & {
  file_path?: string;
  file_size?: number | string;
};

function normalizeProjectFile(file: ApiProjectFile): ProjectFile {
  const path = file.path ?? file.file_path ?? "unknown.tsx";
  const sizeValue = file.size ?? file.file_size ?? 0;
  const size =
    typeof sizeValue === "number"
      ? sizeValue
      : parseFloat(String(sizeValue)) || 0;

  return {
    path,
    size,
    type: inferFileType(path, file.type),
  };
}

function inferFileType(
  path: string,
  providedType?: ProjectFile["type"]
): ProjectFile["type"] {
  if (providedType) return providedType;
  if (path.includes("/hooks/")) return "hook";
  if (path.includes("/context/")) return "context";
  if (path.includes("/routes/")) return "route";
  if (path.includes("/utils/")) return "utility";
  return "component";
}
