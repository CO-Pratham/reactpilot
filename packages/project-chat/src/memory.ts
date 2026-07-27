import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ChatSession, ChatMessage } from './types.js';

export class ChatMemoryManager {
  private historyFile: string;
  private sessions: ChatSession[] = [];

  constructor(cacheDir: string) {
    this.historyFile = path.join(cacheDir, 'chat-history.json');
    this.load();
  }

  /**
   * Load history from disk.
   */
  load(): void {
    if (!fs.existsSync(this.historyFile)) return;
    try {
      const raw = fs.readFileSync(this.historyFile, 'utf-8');
      this.sessions = JSON.parse(raw) as ChatSession[];
    } catch {
      this.sessions = [];
    }
  }

  /**
   * Save history to disk.
   */
  save(): void {
    fs.mkdirSync(path.dirname(this.historyFile), { recursive: true });
    fs.writeFileSync(this.historyFile, JSON.stringify(this.sessions, null, 2), 'utf-8');
  }

  /**
   * Create a new session.
   */
  createSession(title: string): ChatSession {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    this.sessions.unshift(session);
    this.save();
    return session;
  }

  /**
   * Get a session by ID.
   */
  getSession(id: string): ChatSession | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  /**
   * Get recent sessions.
   */
  getSessions(): ChatSession[] {
    return this.sessions;
  }

  /**
   * Add message to a session.
   */
  addMessage(sessionId: string, message: Omit<ChatMessage, 'timestamp'>): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.messages.push({
      ...message,
      timestamp: new Date().toISOString(),
    });
    this.save();
  }

  /**
   * Clear all sessions.
   */
  clear(): void {
    this.sessions = [];
    this.save();
  }
}
