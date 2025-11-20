import { Bell, User } from "lucide-react";

export const Navbar = () => {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">
          ReactPilot
        </p>
        <p className="text-lg font-semibold text-white">AI React Assistant</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-full border border-slate-700 p-2 text-slate-300 hover:text-white">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1">
          <div className="rounded-full bg-slate-700/60 p-1.5">
            <User size={16} />
          </div>
          <span className="text-sm text-slate-200">you@reactpilot.dev</span>
        </div>
      </div>
    </header>
  );
};
