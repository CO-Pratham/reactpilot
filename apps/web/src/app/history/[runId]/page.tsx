import React from 'react';
import { History, ShieldAlert } from 'lucide-react';

interface Params {
  runId: string;
}

export default async function HistoryDetailPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const { runId } = resolvedParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <History className="text-violet-400" /> Run Details
        </h1>
        <p className="text-sm text-slate-400 mt-1">Reviewing details for analysis run: {runId}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">ReactPilot Code Audit</h3>
            <p className="text-xs text-slate-400">Timestamp: 2026-07-27 12:00:00</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-emerald-400">93/100</span>
            <p className="text-xs text-slate-400 mt-1">Performance Score</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldAlert size={16} className="text-violet-400" /> Audited Issues
          </h4>

          <div className="space-y-3">
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                  Performance Error
                </span>
                <span className="text-xs text-slate-500 font-mono">src/components/Dashboard.tsx:44</span>
              </div>
              <p className="text-sm text-slate-200 mt-2 font-medium">Inline click handlers in JSX prevent React.memo reconciliation.</p>
              <p className="text-xs text-slate-400 mt-1">Fix: Extract click handlers to use useCallback hooks.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                  A11y Warning
                </span>
                <span className="text-xs text-slate-500 font-mono">src/components/Avatar.tsx:12</span>
              </div>
              <p className="text-sm text-slate-200 mt-2 font-medium">Image element missing ALT tag attribute.</p>
              <p className="text-xs text-slate-400 mt-1">Fix: Add alt description tag to image elements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
