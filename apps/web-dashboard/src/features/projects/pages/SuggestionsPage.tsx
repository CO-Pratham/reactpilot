import { useAnalysisStore } from '../../../shared/stores/analysisStore';

export const SuggestionsPage = () => {
  const { suggestions } = useAnalysisStore();

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">AI Engine</p>
        <h1 className="text-2xl font-semibold text-white">Improvement suggestions</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {suggestions.map((suggestion) => (
          <article key={suggestion.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{suggestion.impact} impact</p>
            <h3 className="text-lg font-semibold text-white">{suggestion.title}</h3>
            <p className="text-sm text-slate-400">{suggestion.description}</p>
            <button className="mt-3 text-sm text-brand">Generate patch</button>
          </article>
        ))}
      </div>
    </div>
  );
};

