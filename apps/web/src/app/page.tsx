'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Key,
  Terminal,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  FileSearch,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw,
  MessageSquare,
  Share2,
  Layers,
  ArrowUpCircle,
} from 'lucide-react';

interface ReviewIssue {
  category: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
}

interface CategoryScore {
  id: string;
  label: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: ReviewIssue[];
}

interface StoredReview {
  totalScore: number;
  categories: CategoryScore[];
  issues: ReviewIssue[];
  filesReviewed: string[];
  hasBreakingChanges: boolean;
  estimatedFixMinutes: number;
  reviewedAt: string;
  projectPath: string;
  skippedFileCount?: number;
  source: 'local' | 'github-action';
}

interface DashboardRun {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  score?: number;
  issueCount?: number;
  summary: Record<string, unknown>;
}

interface CommandStatus {
  id: string;
  command: string;
  tag: string;
  description: string;
  lastRun: DashboardRun | null;
}

interface DashboardData {
  project: { name: string; rootPath: string; gitBranch?: string };
  review: StoredReview | null;
  runs: DashboardRun[];
  graph: {
    nodeCount: number;
    edgeCount: number;
    unusedCount: number;
    circularCount: number;
  } | null;
  migration: { react: string; next?: string; isReact19: boolean; isNext15: boolean };
  plugins: Array<{ name: string; version: string; description: string }>;
  chatSessionCount: number;
  hasApiKey: boolean;
  commands: CommandStatus[];
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function statusBadge(status: CategoryScore['status']) {
  const map = {
    excellent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    good: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return map[status];
}

function severityStyles(severity: ReviewIssue['severity']) {
  const map = {
    critical: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
    error: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  };
  return map[severity];
}

function formatFixTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const TAG_ICONS: Record<string, React.ReactNode> = {
  Review: <FileSearch size={12} />,
  Plugins: <Layers size={12} />,
  Chat: <MessageSquare size={12} />,
  Graph: <Share2 size={12} />,
  Migrate: <ArrowUpCircle size={12} />,
};

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([fetch('/api/dashboard'), fetch('/api/settings')])
      .then(async ([dashRes, settingsRes]) => {
        const dash = await dashRes.json();
        const settings = await settingsRes.json();
        setData(dash);
        setApiKey(settings.apiKey || '');
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCopy = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch {
      // quiet fail
    }
  };

  const handleQuickSaveKey = async () => {
    if (!apiKey) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiBaseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        loadDashboard();
      }
    } finally {
      setSaving(false);
    }
  };

  const review = data?.review ?? null;
  const topIssues =
    review?.issues
      .filter((i) => ['critical', 'error', 'warning'].includes(i.severity))
      .slice(0, 6) ?? [];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-8 shadow-xl text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">ReactPilot Evolution Suite v1.0</h1>
            <p className="mt-2 text-violet-100 max-w-xl">
              Project: <strong>{data?.project.name ?? '—'}</strong>
              {data?.project.gitBranch ? ` · branch ${data.project.gitBranch}` : ''}
            </p>
            <p className="mt-1 text-sm text-violet-200/80">
              Run CLI commands in terminal → results sync here automatically.
            </p>
          </div>
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Dashboard
          </button>
        </div>
      </div>

      {!loading && !data?.hasApiKey && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-amber-400 font-bold text-sm flex items-center gap-2">
              <Key size={16} /> API Key Setup Required
            </h3>
            <p className="text-xs text-slate-400">Required for AI chat. Review and graph work without a key.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <input
              type="password"
              placeholder="Paste API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white w-full md:w-64"
            />
            <button onClick={handleQuickSaveKey} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shrink-0">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-400 font-bold">
          ✅ API Key saved!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Review Score</h3>
          <p className={`text-3xl font-bold mt-2 ${review ? scoreColor(review.totalScore) : 'text-slate-500'}`}>
            {review ? `${review.totalScore}/100` : '—'}
          </p>
          <span className="text-xs text-slate-500 flex items-center gap-1 mt-2">
            {review ? (
              <>
                {review.totalScore >= 80 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
                {formatDate(review.reviewedAt)}
              </>
            ) : (
              'Run review command'
            )}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Unused Nodes</h3>
          <p className="text-3xl font-bold mt-2 text-amber-500">{data?.graph?.unusedCount ?? '—'}</p>
          <span className="text-xs text-slate-500 mt-2 block">
            <Link href="/insights" className="text-violet-400 hover:underline">View in Insights →</Link>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Circular Loops</h3>
          <p className={`text-3xl font-bold mt-2 ${(data?.graph?.circularCount ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
            {data?.graph?.circularCount ?? '—'}
          </p>
          <span className="text-xs text-slate-500 mt-2 block">
            {(data?.graph?.circularCount ?? 0) === 0 ? 'All loops resolved' : 'Needs attention'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Installed Plugins</h3>
          <p className="text-3xl font-bold mt-2 text-violet-400">{data?.plugins.length ?? '—'}</p>
          <span className="text-xs text-slate-500 mt-2 block">{data?.chatSessionCount ?? 0} chat session(s)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-violet-400" /> Command Reference Cheat-Sheet
            </h2>
            <p className="text-xs text-slate-400">Full output in terminal only. Dashboard shows saved summaries after each run.</p>

            <div className="space-y-3 font-mono text-xs">
              {(data?.commands ?? []).map((cmd) => (
                <div
                  key={cmd.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    cmd.id === 'review'
                      ? 'bg-violet-600/5 border-violet-500/30'
                      : 'bg-slate-800/50 border-slate-700/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-violet-300 font-bold break-all">{cmd.command}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-sans font-bold">
                          {TAG_ICONS[cmd.tag]} {cmd.tag}
                        </span>
                        {cmd.lastRun?.score !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-sans font-bold ${scoreColor(cmd.lastRun.score)} bg-slate-900`}>
                            {cmd.lastRun.score}/100
                          </span>
                        )}
                        {cmd.lastRun && cmd.lastRun.score === undefined && (
                          <span className="text-[10px] px-2 py-0.5 rounded uppercase font-sans font-bold text-emerald-400 bg-slate-900">
                            Ran
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">{cmd.description}</p>
                      {cmd.lastRun && (
                        <p className="text-[10px] text-slate-500 font-sans">
                          Last run: {formatDate(cmd.lastRun.timestamp)}
                          {cmd.lastRun.issueCount !== undefined ? ` · ${cmd.lastRun.issueCount} issue(s)` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(cmd.command)}
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg font-sans"
                    >
                      <Copy size={12} /> {copiedCmd === cmd.command ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {review && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileSearch size={18} className="text-violet-400" /> Latest Code Review
                </h2>
                <span className="text-[10px] uppercase text-slate-500 font-bold">
                  {review.filesReviewed.length} files · {formatFixTime(review.estimatedFixMinutes)} fix time
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {review.categories.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-300">{cat.label}</p>
                      <p className="text-[10px] text-slate-500">{cat.issues.length} issue(s)</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${scoreColor(cat.score)}`}>{cat.score}</p>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${statusBadge(cat.status)}`}>
                        {cat.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !review && (
            <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-8 text-center">
              <FileSearch size={32} className="mx-auto text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No review report yet</h3>
              <p className="text-xs text-slate-500 mt-1">Run the review command, then click Sync Dashboard.</p>
            </div>
          )}

          {(data?.runs.length ?? 0) > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Recent Run History</h2>
                <Link href="/history" className="text-xs text-violet-400 hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {data!.runs.slice(0, 5).map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <div>
                      <p className="text-sm font-bold text-white">{run.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{formatDate(run.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      {run.score !== undefined && <p className={`text-sm font-bold ${scoreColor(run.score)}`}>{run.score}/100</p>}
                      {run.issueCount !== undefined && <p className="text-[10px] text-slate-500">{run.issueCount} issues</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" /> Quality Warnings
            </h2>
            {loading ? (
              <p className="text-xs text-slate-500">Loading...</p>
            ) : topIssues.length > 0 ? (
              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {topIssues.map((issue, i) => (
                  <div key={i} className={`p-3 border rounded-xl ${severityStyles(issue.severity)}`}>
                    <p className="text-[11px] font-bold capitalize">{issue.severity} · {issue.category}</p>
                    <p className="text-[11px] mt-0.5 opacity-90">{issue.message}</p>
                    <p className="text-[10px] font-mono mt-1 opacity-70 truncate">{issue.file}{issue.line ? `:${issue.line}` : ''}</p>
                  </div>
                ))}
              </div>
            ) : review ? (
              <div className="flex gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300">No critical warnings in latest review.</p>
              </div>
            ) : (
              <div className="flex gap-3 p-3 bg-slate-800/50 border border-slate-700/30 rounded-xl">
                <Clock size={14} className="text-slate-500 mt-0.5" />
                <p className="text-xs text-slate-500">Run review command to populate warnings.</p>
              </div>
            )}
          </div>

          {data?.migration && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowUpCircle size={18} className="text-blue-400" /> Migration Status
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">React</span>
                  <span className={data.migration.isReact19 ? 'text-emerald-400' : 'text-amber-400'}>
                    v{data.migration.react} {data.migration.isReact19 ? '✓' : '↑ needed'}
                  </span>
                </div>
                {data.migration.next && (
                  <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400">Next.js</span>
                    <span className={data.migration.isNext15 ? 'text-emerald-400' : 'text-amber-400'}>
                      v{data.migration.next} {data.migration.isNext15 ? '✓' : '↑ needed'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
