import { AlertCircle } from "lucide-react";
import { useAnalysisStore } from "../../stores/analysisStore";

const severityColors: Record<string, string> = {
  error: "text-red-400 bg-red-400/10",
  warning: "text-amber-400 bg-amber-400/10",
  info: "text-slate-300 bg-slate-300/10",
};

export const IssueList = () => {
  const { issues } = useAnalysisStore();

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <h3 className="text-sm font-semibold text-white">Analysis Issues</h3>
      {issues.map((issue) => (
        <article
          key={issue.id}
          className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-sm text-slate-300"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-white">{issue.file}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                severityColors[issue.severity]
              }`}
            >
              {issue.severity}
            </span>
          </div>
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            {issue.type}
          </p>
          <p className="flex items-center gap-2 text-sm">
            <AlertCircle size={16} className="text-amber-300" />
            Line {issue.line}: {issue.suggestion}
          </p>
        </article>
      ))}
    </section>
  );
};
