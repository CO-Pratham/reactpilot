export const LoginPage = () => {
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">ReactPilot</p>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-slate-400">Access your AI-powered workspace.</p>
      </div>
      <form className="space-y-4">
        <label className="block text-sm">
          Email
          <input
            type="email"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-white"
            placeholder="you@reactpilot.dev"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-white"
            placeholder="••••••••"
          />
        </label>
        <button className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white">Continue</button>
      </form>
    </div>
  );
};

