'use client';

import React, { useState, useEffect } from 'react';
import { Share2, RefreshCw } from 'lucide-react';

interface GraphData {
  nodeCount: number;
  edgeCount: number;
  unusedCount: number;
  circularCount: number;
}

export default function GraphViewerPage() {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [graphKey, setGraphKey] = useState(0);
  const [graphError, setGraphError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setGraphError(null);
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setGraph(data.graph);
        setGraphKey((k) => k + 1);
      })
      .catch(() => setGraph(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Share2 className="text-violet-400" /> Architecture Graph
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live dependency scan · interactive graph rendered in dashboard
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Rescan
        </button>
      </div>

      {graph && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          {[
            { label: 'Nodes', value: graph.nodeCount, color: 'text-violet-400' },
            { label: 'Edges', value: graph.edgeCount, color: 'text-blue-400' },
            { label: 'Circular Loops', value: graph.circularCount, color: graph.circularCount > 0 ? 'text-rose-500' : 'text-emerald-400' },
            { label: 'Unused', value: graph.unusedCount, color: graph.unusedCount > 0 ? 'text-amber-500' : 'text-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-[10px] uppercase font-bold text-slate-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg min-h-[500px] relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80">
            <RefreshCw size={24} className="animate-spin text-violet-400" />
          </div>
        )}
        {graphError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-rose-400">{graphError}</p>
            <code className="mt-4 px-4 py-2 bg-slate-950 rounded-lg text-xs font-mono text-violet-400 border border-slate-800">
              node apps/cli/dist/index.cjs graph --open
            </code>
          </div>
        ) : (
          <iframe
            key={graphKey}
            src={`/api/graph?t=${graphKey}`}
            title="Architecture Graph"
            className="w-full h-full min-h-[500px] border-0 bg-slate-950"
            onError={() => setGraphError('Failed to load graph. Try Rescan or run the CLI command below.')}
          />
        )}
      </div>
    </div>
  );
}
