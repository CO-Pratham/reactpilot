import { Link } from "react-router-dom";
import { useProjectStore } from "../../../shared/stores/projectStore";

export const ProjectListPage = () => {
  const { projects, selectProject } = useProjectStore();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Projects
          </p>
          <h1 className="text-2xl font-semibold text-white">Your workspaces</h1>
        </div>
        <Link
          to="/upload"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Upload project
        </Link>
      </header>
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Last analysis</th>
              <th className="px-4 py-3 text-left">Performance</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 bg-slate-950/40">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-4 py-3 font-semibold text-white">
                  {project.name}
                </td>
                <td className="px-4 py-3">
                  {new Date(project.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {project.lastAnalysisAt
                    ? new Date(project.lastAnalysisAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3">{project.performanceScore ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/projects/detail"
                    className="text-sm text-brand"
                    onClick={() => selectProject(project.id)}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
