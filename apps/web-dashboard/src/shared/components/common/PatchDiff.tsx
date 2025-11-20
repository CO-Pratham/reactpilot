import { useAnalysisStore } from "../../stores/analysisStore";

export const PatchDiff = () => {
  const { patches, acceptPatch, rejectPatch } = useAnalysisStore();

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">AI Patches</h3>
        <p className="text-xs text-slate-400">Accept or reject each diff</p>
      </div>
      {patches.map((patch) => (
        <article
          key={patch.id}
          className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-sm text-slate-200"
        >
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>{patch.filePath}</span>
            <span className="capitalize">{patch.status}</span>
          </div>
          <div className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-rose-300">
                Original
              </p>
              <pre className="overflow-auto rounded bg-slate-900/60 p-2 text-xs text-rose-200">
                {patch.originalCode}
              </pre>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-emerald-300">
                Patched
              </p>
              <pre className="overflow-auto rounded bg-slate-900/60 p-2 text-xs text-emerald-200">
                {patch.patchedCode}
              </pre>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="flex-1 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
              onClick={() => acceptPatch(patch.id)}
            >
              Accept Patch
            </button>
            <button
              className="flex-1 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              onClick={() => rejectPatch(patch.id)}
            >
              Reject
            </button>
          </div>
        </article>
      ))}
    </section>
  );
};
