'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [providerPreset, setProviderPreset] = useState('openai');

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load current settings from API
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setApiKey(data.apiKey || '');
        setApiBaseUrl(data.apiBaseUrl || '');
        setModel(data.model || '');

        // Deduce provider preset
        if (data.apiBaseUrl?.includes('groq.com')) {
          setProviderPreset('groq');
        } else if (data.apiBaseUrl?.includes('localhost') || data.apiBaseUrl?.includes('11434')) {
          setProviderPreset('ollama');
        } else {
          setProviderPreset('openai');
        }
      })
      .catch(() => {
        setStatus({ type: 'error', message: 'Failed to load configuration.' });
      });
  }, []);

  // Update configuration parameters based on chosen preset
  const handlePresetChange = (preset: string) => {
    setProviderPreset(preset);
    if (preset === 'openai') {
      setApiBaseUrl('https://api.openai.com/v1');
      setModel('gpt-4o-mini');
    } else if (preset === 'ollama') {
      setApiBaseUrl('http://localhost:11434/v1');
      setModel('llama3');
    } else if (preset === 'groq') {
      setApiBaseUrl('https://api.groq.com/openai/v1');
      setModel('llama-3.1-8b-instant');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const finalBaseUrl = providerPreset === 'groq' ? 'https://api.groq.com/openai/v1' : apiBaseUrl;
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiBaseUrl: finalBaseUrl, model }),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Settings successfully saved to local .env configuration!' });
      } else {
        throw new Error('Save response rejected.');
      }
    } catch {
      setStatus({ type: 'error', message: 'Failed to write settings to local config.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="text-violet-400" /> Settings &amp; Config
        </h1>
        <p className="text-sm text-slate-400 mt-1">Configure API keys, model selections, and defaults.</p>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          status.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{status.message}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-lg">
        {/* Preset Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Provider Preset</label>
          <select 
            value={providerPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
          >
            <option value="openai">OpenAI (Cloud Services)</option>
            <option value="groq">Groq (High-Speed Llama 3 Cloud)</option>
            <option value="ollama">Ollama (Local Offline Model)</option>
          </select>
        </div>

        {/* API Key Form */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="gsk_... or sk-..."
            className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all font-mono"
          />
          <p className="text-[10px] text-slate-500">Provide the credential key for the chosen service provider.</p>
        </div>

        {/* API Base URL - Conditional rendering */}
        {providerPreset !== 'groq' && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">API Base URL</label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all font-mono"
            />
          </div>
        )}

        {/* Model ID */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Model Name</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o-mini"
            className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all font-mono"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md shadow-violet-900/10"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
