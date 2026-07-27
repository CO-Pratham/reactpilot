import { OpenAI } from 'openai';
import type { ChatMessage, SearchChunk } from './types.js';
import type { ProjectContext } from './project-context.js';
import { formatProjectContextForPrompt } from './project-context.js';

export interface ChatEngineOptions {
  provider?: 'openai' | 'ollama';
  model?: string;
  ollamaBaseUrl?: string;
  apiKey?: string;
}

export class ChatEngine {
  private openai: OpenAI | null = null;
  private provider: 'openai' | 'ollama' = 'openai';
  private model: string = 'gpt-4o-mini';
  private ollamaBaseUrl: string = 'http://localhost:11434';

  constructor(opts: ChatEngineOptions = {}) {
    const key = opts.apiKey || process.env.REACTPILOT_API_KEY;
    const envBaseUrl = process.env.REACTPILOT_API_BASE_URL || '';
    const hasLocalBase = envBaseUrl.includes('localhost') || envBaseUrl.includes('11434') || envBaseUrl.includes('ollama');

    this.provider = opts.provider || (key && !hasLocalBase ? 'openai' : 'ollama');
    if (hasLocalBase) {
      this.provider = 'ollama';
    }

    this.model = process.env.REACTPILOT_MODEL || opts.model || 'gpt-4o-mini';

    // Clean base URL for Ollama direct requests
    const rawOllamaUrl = opts.ollamaBaseUrl || envBaseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.ollamaBaseUrl = rawOllamaUrl.replace(/\/v1\/?$/, '');

    if (key && this.provider === 'openai') {
      this.openai = new OpenAI({ 
        apiKey: key,
        baseURL: envBaseUrl || undefined
      });
    }
  }

  /**
   * Run chat completion, calling the callback with chunks as they arrive.
   */
  async chatStream(
    query: string,
    contextChunks: SearchChunk[],
    history: ChatMessage[],
    onChunk: (text: string) => void,
    projectContext?: ProjectContext
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(contextChunks, projectContext);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: query },
    ];

    if (this.provider === 'openai' && this.openai) {
      try {
        const stream = await this.openai.chat.completions.create({
          model: this.model,
          messages: messages as any,
          stream: true,
        });

        let fullText = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        }
        return fullText;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errorResponse = `Error contacting AI provider: ${errMsg}`;
        onChunk(errorResponse);
        return errorResponse;
      }
    }

    // Ollama streaming
    return this.ollamaStream(messages, onChunk);
  }

  private async ollamaStream(
    messages: { role: string; content: string }[],
    onChunk: (text: string) => void
  ): Promise<string> {
    try {
      const res = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model === 'gpt-4o-mini' ? 'llama3' : this.model, // Safe default for Ollama
          messages,
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`Ollama status ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line) as { message?: { content?: string } };
            const content = data.message?.content || '';
            if (content) {
              fullText += content;
              onChunk(content);
            }
          } catch { /* parse error */ }
        }
      }
      return fullText;
    } catch (err) {
      const fallback = 'Mock Response: AI engine is offline. Please start Ollama or set GITHUB_TOKEN/REACTPILOT_API_KEY.';
      onChunk(fallback);
      return fallback;
    }
  }

  private buildSystemPrompt(chunks: SearchChunk[], projectContext?: ProjectContext): string {
    let prompt =
      `You are ReactPilot, an expert React coding assistant embedded in the user's local React project.\n\n`;

    if (projectContext) {
      prompt += `${formatProjectContextForPrompt(projectContext)}\n\n`;
    }

    prompt +=
      `Answer the user's questions based on the project context above and the retrieved code chunks below.\n\n` +
      `CRITICAL REQUIREMENT:\n` +
      `Always reference files and lines using markdown links in this exact format:\n` +
      `[filename](file:///absolute/path/to/file#Lstart-Lend) where filename is the base name and the path is absolute.\n` +
      `Example: "Check out the hook in [useAuth.ts](file:///Users/project/hooks/useAuth.ts#L10-L25)."\n\n` +
      `Retrieved Context:\n`;

    chunks.forEach((chunk, i) => {
      prompt += `\n--- Chunk ${i + 1} (${chunk.filePath} Lines ${chunk.lineStart}-${chunk.lineEnd}) ---\n`;
      prompt += chunk.content;
      prompt += `\n`;
    });

    return prompt;
  }
}
