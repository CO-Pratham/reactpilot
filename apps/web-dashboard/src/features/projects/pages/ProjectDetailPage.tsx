import { FileTree, PatchDiff } from '../../../shared/components';
import { useProjectStore } from '../../../shared/stores/projectStore';

export const ProjectDetailPage = () => {
  const { projects, selectedProjectId } = useProjectStore();
  const project = projects.find((item) => item.id === selectedProjectId) ?? projects[0];

  if (!project) {
    return <p className="text-slate-400">No projects found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Project overview</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">{project.description}</p>
        <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-400">
          <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
          <span>Last analysis: {project.lastAnalysisAt ? new Date(project.lastAnalysisAt).toLocaleString() : '—'}</span>
          <span>Performance: {project.performanceScore ?? '—'} / 100</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FileTree />
        <div className="lg:col-span-2">
          <PatchDiff />
        </div>
      </div>
    </div>
  );
};

