'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ScanSearch,
  AlertTriangle,
  CheckCircle2,
  Circle,
  RefreshCw,
  Share2,
  ArrowUpCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';

interface ReactPilotRelease {
  version: string;
  date: string;
  npmVersion?: string;
  changes: string[];
}

interface ReactPilotVersionInfo {
  productName: string;
  installedVersion: string;
  installedNpmVersion: string;
  latestVersion: string;
  latestNpmVersion: string;
  upgradeAvailable: boolean;
  installSource: string;
  releaseNotes: ReactPilotRelease[];
  upgradeChanges: string[];
}

interface InsightsData {
  project: { name: string; rootPath: string };
  graph: {
    nodeCount: number;
    unusedCount: number;
    circularCount: number;
    unusedNodes: string[];
    circularCycles: string[][];
  } | null;
  migration: { react: string; next?: string; isReact19: boolean; isNext15: boolean };
  setup: {
    apiKeyConfigured: boolean;
    reviewCompleted: boolean;
    graphScanned: boolean;
    pluginsInstalled: boolean;
    chatStarted: boolean;
  };
  plugins: Array<{ name: string; version: string; description: string }>;
  unusedNodes: string[];
  circularCycles: string[][];
  reactpilot?: ReactPilotVersionInfo;
}

function SetupItem({ done, label, hint }: { done: boolean; label: string; hint: string }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
      {done ? (
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <Circle size={18} className="text-amber-400 shrink-0 mt-0.5" />
      )}
      <div>
        <p className={`text-sm font-bold ${done ? 'text-emerald-300' : 'text-amber-300'}`}>{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeNotes, setShowUpgradeNotes] = useState(false);
  const [copiedUpgrade, setCopiedUpgrade] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/insights')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const setup = data?.setup;
  const setupDone = setup
    ? Object.values(setup).filter(Boolean).length
    : 0;
  const setupTotal = setup ? Object.keys(setup).length : 5;
  const rp = data?.reactpilot;

  const handleCopyUpgrade = async () => {
    const cmd = `npm install -g @reactpilot/cli@${rp?.latestNpmVersion ?? 'latest'}`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedUpgrade(true);
      setTimeout(() => setCopiedUpgrade(false), 2000);
    } catch {
      // quiet fail
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ScanSearch className="text-violet-400" /> Project Insights
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Unused code, circular dependencies, and initial setup checklist for{' '}
            <strong className="text-slate-300">{data?.project.name ?? 'your project'}</strong>.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Setup Progress</h3>
          <p className="text-3xl font-bold mt-2 text-violet-400">{setupDone}/{setupTotal}</p>
          <p className="text-xs text-slate-500 mt-2">Initial configuration steps completed</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Unused Files</h3>
          <p className="text-3xl font-bold mt-2 text-amber-500">{data?.graph?.unusedCount ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-2">Unreachable from entry points</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Circular Imports</h3>
          <p className={`text-3xl font-bold mt-2 ${(data?.graph?.circularCount ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
            {data?.graph?.circularCount ?? '—'}
          </p>
          <p className="text-xs text-slate-500 mt-2">Dependency loops detected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Initial Setup Checklist</h2>
          <p className="text-xs text-slate-400">Complete these once when first installing ReactPilot in a project.</p>
          {setup ? (
            <div className="space-y-3">
              <SetupItem done={setup.apiKeyConfigured} label="Configure API Key" hint="Set REACTPILOT_API_KEY in .env for AI chat." />
              <SetupItem done={setup.reviewCompleted} label="Run First Code Review" hint="node apps/cli/dist/index.cjs review" />
              <SetupItem done={setup.graphScanned} label="Generate Architecture Graph" hint="node apps/cli/dist/index.cjs graph --open" />
              <SetupItem done={setup.pluginsInstalled} label="Install Plugins" hint="node apps/cli/dist/index.cjs plugin list" />
              <SetupItem done={setup.chatStarted} label="Start AI Chat Session" hint="node apps/cli/dist/index.cjs ask" />
            </div>
          ) : (
            <p className="text-xs text-slate-500">Loading setup status...</p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowUpCircle size={18} className="text-blue-400" /> Versions & Updates
          </h2>

          {rp ? (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${rp.upgradeAvailable ? 'border-violet-500/30 bg-violet-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-violet-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">{rp.productName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Installed v{rp.installedVersion}
                        {rp.installedNpmVersion !== rp.installedVersion && (
                          <span className="text-slate-500"> · npm {rp.installedNpmVersion}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${rp.upgradeAvailable ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {rp.upgradeAvailable ? `Latest v${rp.latestVersion}` : 'Up to date'}
                  </span>
                </div>

                {rp.upgradeAvailable && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowUpgradeNotes((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                    >
                      {showUpgradeNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      Upgrade to v{rp.latestVersion}
                    </button>
                    <button
                      onClick={handleCopyUpgrade}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      <Copy size={12} /> {copiedUpgrade ? 'Copied!' : 'Copy install command'}
                    </button>
                  </div>
                )}

                {showUpgradeNotes && rp.upgradeAvailable && (
                  <div className="mt-1 p-3 rounded-lg bg-slate-950/60 border border-slate-700/50 space-y-2">
                    <p className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">
                      What&apos;s new in v{rp.latestVersion}
                    </p>
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                      {rp.upgradeChanges.map((line, i) =>
                        line.startsWith('v') ? (
                          <li key={i} className="text-[11px] text-violet-400 font-bold mt-2 first:mt-0">
                            {line}
                          </li>
                        ) : (
                          <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex gap-2">
                            <span className="text-violet-500 shrink-0">•</span>
                            <span>{line.replace(/^\s*•\s*/, '')}</span>
                          </li>
                        )
                      )}
                    </ul>
                    <code className="block text-[10px] text-violet-400 font-mono mt-2 pt-2 border-t border-slate-800">
                      npm install -g @reactpilot/cli@{rp.latestNpmVersion}
                    </code>
                  </div>
                )}
              </div>

              {data?.migration && (
                <>
                  <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
                    <span className="text-sm text-slate-300">React {data.migration.react}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${data.migration.isReact19 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {data.migration.isReact19 ? 'Up to date' : 'Upgrade available'}
                    </span>
                  </div>
                  {data.migration.next && (
                    <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
                      <span className="text-sm text-slate-300">Next.js {data.migration.next}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${data.migration.isNext15 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {data.migration.isNext15 ? 'Up to date' : 'Upgrade available'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Loading version info...</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" /> Unused Components & Files
          </h2>
          {(data?.unusedNodes.length ?? 0) > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {data!.unusedNodes.map((node) => (
                <div key={node} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs font-mono text-amber-200 truncate">{node}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Not reachable from app entry points</p>
                </div>
              ))}
              {(data?.graph?.unusedCount ?? 0) > data!.unusedNodes.length && (
                <p className="text-[10px] text-slate-500 text-center pt-2">
                  + {(data?.graph?.unusedCount ?? 0) - data!.unusedNodes.length} more unused nodes
                </p>
              )}
            </div>
          ) : (
            <div className="flex gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">No unused nodes detected in the dependency graph.</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 size={18} className="text-rose-400" /> Circular Dependency Loops
          </h2>
          {(data?.circularCycles.length ?? 0) > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {data!.circularCycles.map((cycle, i) => (
                <div key={i} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <p className="text-[10px] uppercase font-bold text-rose-400 mb-2">Loop {i + 1}</p>
                  <p className="text-xs font-mono text-rose-200 leading-relaxed">
                    {cycle.join(' → ')} → {cycle[0]}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">No circular import loops found.</p>
            </div>
          )}
          <Link href="/graph" className="inline-block text-xs text-violet-400 hover:underline">
            Open Architecture Graph →
          </Link>
        </div>
      </div>
    </div>
  );
}
