import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CodeViewer, IssueList, MetricsChart } from "../../../shared/components";
import { useProjectStore } from "../../../shared/stores/projectStore";
import { useAnalysisStore } from "../../../shared/stores/analysisStore";

export const DashboardPage = () => {
  const { projects, selectedProjectId, selectProject, fetchProjects, isLoading } = useProjectStore();
  const { suggestions } = useAnalysisStore();

  const { fetchAnalysis } = useAnalysisStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      selectProject(projects[0].id);
    }
  }, [projects, selectedProjectId, selectProject]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchAnalysis(selectedProjectId);
    }
  }, [selectedProjectId, fetchAnalysis]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
        <h2 className="text-xl font-semibold text-white">No projects found</h2>
        <p className="text-slate-400">Upload a React project to get started.</p>
        <Link
          to="/upload"
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand/90"
        >
          Upload Project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        {projects.map((project) => {
          const isActive = selectedProjectId === project.id;
          return (
            <button
              key={project.id}
              onClick={() => selectProject(project.id)}
              className={[
                'flex-1 min-w-[220px] rounded-2xl border px-4 py-4 text-left',
                isActive
                  ? 'border-brand/60 bg-brand/10 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300'
              ].join(' ')}
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">Project</p>
              <p className="text-lg font-semibold text-white">{project.name}</p>
              <p className="text-sm text-slate-400">
                Performance {project.performanceScore ?? '—'} / 100
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CodeViewer />
          <MetricsChart />
        </div>
        <IssueList />
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">AI Suggestions</h3>
          <Link to="/suggestions" className="text-sm text-brand hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
              <p className="text-white">{suggestion.title}</p>
              <p className="text-sm text-slate-400">{suggestion.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

