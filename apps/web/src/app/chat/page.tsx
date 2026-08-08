'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Bot, User, Loader2, Plus } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from API
  const loadSessions = (selectFirst = false) => {
    fetch('/api/chat')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        if (data.length > 0 && (selectFirst || !selectedSessionId)) {
          setSelectedSessionId(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSessions(true);
  }, []);

  // Scroll to bottom of message list on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, selectedSessionId, sending]);

  const activeSession = sessions.find((s) => s.id === selectedSessionId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending || !selectedSessionId) return;

    const query = inputMessage;
    setInputMessage('');
    setSending(true);

    // Optimistically update message history
    setSessions((prev) =>
      prev.map((s) =>
        s.id === selectedSessionId
          ? {
              ...s,
              messages: [...s.messages, { role: 'user', content: query }],
            }
          : s
      )
    );

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          sessionId: selectedSessionId,
        }),
      });

      if (res.ok) {
        const reply = await res.json();
        // Update with assistant's reply
        setSessions((prev) =>
          prev.map((s) =>
            s.id === selectedSessionId
              ? {
                  ...s,
                  messages: [
                    ...s.messages.filter((m) => m.content !== query || m.role !== 'user'),
                    { role: 'user', content: query },
                    { role: 'assistant', content: reply.content },
                  ],
                }
              : s
          )
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Chat response failed.`);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Connection error. Please ensure your API settings are set up correctly.';
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { role: 'assistant', content: `⚠️ ${errMsg}` },
                ],
              }
            : s
        )
      );
    } finally {
      setSending(false);
      // Reload sessions list to keep metadata synced
      loadSessions();
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: `New Chat Session`,
        }),
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions((prev) => [newSession, ...prev]);
        setSelectedSessionId(newSession.id);
      }
    } catch {
      // quiet fail
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="text-violet-400" /> AI Chat Sessions
          </h1>
          <p className="text-sm text-slate-400 mt-1">Review your conversational history with ReactPilot Copilot.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Session List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-[600px] flex flex-col justify-between">
          <div className="overflow-y-auto space-y-2 flex-1">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Sessions</h3>
              <button
                onClick={handleNewChat}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Plus size={14} /> New Chat
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="animate-spin text-violet-400" />
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all space-y-1 block ${
                    session.id === selectedSessionId
                      ? 'bg-violet-600/10 border-violet-500/30'
                      : 'bg-transparent border-transparent hover:bg-slate-800 hover:border-slate-700/50'
                  }`}
                >
                  <h4 className="font-bold text-white text-sm truncate">{session.title}</h4>
                  <span className="text-[10px] text-slate-500 block font-mono">{session.messages.length} messages</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Session Conversation Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[600px] flex flex-col justify-between">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {activeSession?.messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-violet-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    isUser
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <User size={16} className="text-slate-400" />
                    </div>
                  )}
                </div>
              );
            })}
            
            {sending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-violet-400" />
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-slate-800 text-slate-400 rounded-tl-none border border-slate-700/50 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>ReactPilot is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form message input */}
          <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-slate-800">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={sending}
              placeholder="Ask anything about the React project..."
              className="flex-1 bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-all placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="p-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-violet-900/10 flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
