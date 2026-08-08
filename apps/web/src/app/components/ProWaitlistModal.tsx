'use client';

import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Zap, Mail, Users } from 'lucide-react';

interface ProWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProWaitlistModal({ isOpen, onClose }: ProWaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [teamSize, setTeamSize] = useState('1-5');
  const [features, setFeatures] = useState<string[]>([
    'Managed AI (No API keys required)',
    'Automated GitHub PR Review Bot',
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleFeature = (feat: string) => {
    if (features.includes(feat)) {
      setFeatures(features.filter((f) => f !== feat));
    } else {
      setFeatures([...features, feat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);

    // 1. Local backup
    try {
      const existingRaw = localStorage.getItem('reactpilot_waitlist') || '[]';
      const existing = JSON.parse(existingRaw);
      existing.push({
        email,
        teamSize,
        features,
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem('reactpilot_waitlist', JSON.stringify(existing));
    } catch { /* ignore */ }

    // 2. Submit to Web3Forms API
    try {
      const formData = new FormData();
      formData.append("access_key", "c655cbf8-6db4-4834-9bd0-27c4823bbafc");
      formData.append("subject", "🚀 New ReactPilot Pro Waitlist Lead!");
      formData.append("from_name", "ReactPilot Dashboard");
      formData.append("email", email);
      formData.append("team_size", teamSize);
      formData.append("features_requested", features.join(", "));

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-gray-900 border border-indigo-500/30 rounded-2xl shadow-2xl">
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-2">You're on the Waitlist! 🎉</h3>
              <p className="text-gray-300 text-sm max-w-md mx-auto mb-6">
                Thank you for joining. We'll notify you at <span className="text-indigo-400 font-semibold">{email}</span> as soon as managed AI and team PR bots are ready.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/25"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 text-xs font-semibold tracking-wide text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 rounded-full uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Early Access
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                ReactPilot Pro Waitlist
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Get zero-setup managed AI, instant code fixes, and automated GitHub PR reviews for your team without setting up custom API keys or local LLMs.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-gray-700 focus:border-indigo-500 rounded-xl text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Team Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Solo', '1-5', '6-20', '20+'].map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setTeamSize(size)}
                        className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                          teamSize === size
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Features You Need
                  </label>
                  <div className="space-y-2">
                    {[
                      'Managed AI (No API keys required)',
                      'Automated GitHub PR Review Bot',
                      'Centralized Multi-Repo Health Dashboard',
                      'Custom Enterprise AST Rules',
                    ].map((item) => (
                      <label
                        key={item}
                        onClick={() => toggleFeature(item)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-all ${
                          features.includes(item)
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200'
                            : 'bg-gray-800/50 border-gray-700/60 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={features.includes(item)}
                          onChange={() => {}}
                          className="rounded border-gray-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      'Joining Waitlist...'
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Request Early Access
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 14-Day Free Trial
                  </span>
                  <span>•</span>
                  <span>No credit card required</span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
