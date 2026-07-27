'use client';

import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Package, CheckCircle2 } from 'lucide-react';

interface Plugin {
  name: string;
  version: string;
  description: string;
}

interface MarketplaceEntry extends Plugin {
  author?: string;
  downloads?: number;
  verified?: boolean;
  keywords?: string[];
}

export default function PluginsPage() {
  const [installed, setInstalled] = useState<Plugin[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/plugins')
      .then((res) => res.json())
      .then((data) => {
        setInstalled(data.installed ?? []);
        setMarketplace(data.marketplace ?? []);
      })
      .catch(() => {
        setInstalled([]);
        setMarketplace([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const installedNames = new Set(
    installed.map((p) => p.name.replace('@reactpilot-plugin/', ''))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="text-violet-400" /> Plugin Marketplace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Installed plugins from <code className="text-violet-400">~/.reactpilot/plugins</code>
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <CheckCircle2 size={14} /> Installed ({installed.length})
        </h2>

        {loading ? (
          <div className="text-sm text-slate-500">Loading plugins...</div>
        ) : installed.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-10 text-center space-y-3">
            <Layers size={36} className="mx-auto text-slate-600" />
            <h3 className="text-sm font-bold text-slate-300">No plugins installed</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Install from the catalog below or run{' '}
              <code className="text-violet-400">node apps/cli/dist/index.cjs plugin install nextjs</code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installed.map((plugin) => (
              <div
                key={plugin.name}
                className="bg-slate-900 border border-emerald-500/20 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {plugin.name}
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                      Active
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">v{plugin.version}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {plugin.description || 'No description provided.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Package size={14} /> Available in Marketplace ({marketplace.length})
        </h2>

        {marketplace.length === 0 ? (
          <div className="text-sm text-slate-500">No marketplace entries found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketplace.map((plugin) => {
              const shortName = plugin.name;
              const isInstalled = installedNames.has(shortName);
              return (
                <div
                  key={plugin.name}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {plugin.name}
                      {plugin.verified && (
                        <span className="text-[10px] text-emerald-400">verified</span>
                      )}
                      {isInstalled && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-400">
                          Installed
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">v{plugin.version}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {plugin.description}
                  </p>
                  {!isInstalled && (
                    <code className="text-[10px] text-violet-400 font-mono">
                      node apps/cli/dist/index.cjs plugin install {plugin.name}
                    </code>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
