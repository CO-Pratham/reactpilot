const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const api = {
  async uploadProject(data: { name: string; description?: string; files: { path: string; content: string }[] }) {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    return response.json();
  },
  async fetchProjects() {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }
    return response.json();
  },
  async fetchProject(projectId: string | number) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
    if (!response.ok) {
      throw new Error("Project not found");
    }
    return response.json();
  },
  async fetchReport(projectId: string | number) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/report`);
    if (!response.ok) {
      throw new Error("Report not found");
    }
    return response.json();
  },
  async analyzeProject(projectId: string | number) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/analyze`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Analysis failed");
    }
    return response.json();
  },
};
