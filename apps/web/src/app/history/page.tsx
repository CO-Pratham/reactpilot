'use client';

import React, { useState, useEffect } from 'react';
import { History, ArrowRight, RefreshCw } from 'lucide-react';

interface DashboardRun {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  score?: number;
  issueCount?: number;
  projectPath?: string;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<DashboardRun[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => setRuns(data.runs ?? []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="text-violet-400" /> Run History
          </h1>
          <p className="text-sm text-slate-400 mt-1">All CLI command runs saved from your terminal sessions.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading run history...</div>
        ) : runs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-300">No runs recorded yet</p>
            <p className="text-xs text-slate-500">
              Run any cheat-sheet command in terminal, then refresh this page.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Operation</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-300 font-mono">{formatDate(run.timestamp)}</td>
                  <td className="px-6 py-4 text-sm text-white font-semibold">{run.title}</td>
                  <td className="px-6 py-4 text-sm text-violet-400 uppercase text-xs font-bold">{run.type}</td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {run.score !== undefined ? (
                      <span className={scoreColor(run.score)}>{run.score}/100</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {run.issueCount !== undefined ? `${run.issueCount} issue(s)` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
