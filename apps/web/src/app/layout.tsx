import React from 'react';
import Link from 'next/link';
import './globals.css';
import { Home, History, MessageSquare, Share2, Layers, Settings, ScanSearch } from 'lucide-react';

export const metadata = {
  title: 'ReactPilot Dashboard',
  description: 'Manage ReactPilot analysis reports, visual graphs, chat histories, and migrations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
          <div>
            <div className="p-6 border-b border-slate-800">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="text-violet-500">⚡</span> ReactPilot
              </h1>
              <p className="text-xs text-slate-400 mt-1">v1.0 Developer Center</p>
            </div>
            <nav className="p-4 space-y-1">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
                <Home size={18} className="text-violet-400" /> Dashboard
              </Link>
              <Link href="/insights" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
                <ScanSearch size={18} className="text-violet-400" /> Project Insights
              </Link>
              <Link href="/history" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
                <History size={18} className="text-violet-400" /> Run History
              </Link>
              <Link href="/chat" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
                <MessageSquare size={18} className="text-violet-400" /> AI Chat Sessions
              </Link>
              <Link href="/graph" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
                <Share2 size={18} className="text-violet-400" /> Architecture Graph
              </Link>
              <Link href="/plugins" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
                <Layers size={18} className="text-violet-400" /> Plugin Marketplace
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-800">
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg transition-colors">
              <Settings size={18} /> Settings &amp; Config
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900 shrink-0">
            <h2 className="text-lg font-bold text-white">Developer Center</h2>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                Local Agent Connected
              </span>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
