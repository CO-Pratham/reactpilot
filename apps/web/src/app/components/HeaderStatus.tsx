'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Key, CheckCircle2, AlertCircle } from 'lucide-react';

export function HeaderStatus() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = () => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setHasKey(Boolean(data.apiKey && data.apiKey.trim().length > 0));
      })
      .catch(() => setHasKey(false))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    checkStatus();
    // Poll every 5s to update dynamically if key is saved in settings page
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 animate-pulse">
        Checking connection...
      </span>
    );
  }

  if (hasKey) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5" /> Agent &amp; API Connected
      </span>
    );
  }

  return (
    <Link
      href="/settings"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-sm"
      title="Click to add your API Key in Settings"
    >
      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
      <span>API Key Required</span>
    </Link>
  );
}
