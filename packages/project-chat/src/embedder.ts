import { OpenAI } from 'openai';

/**
 * Thrown when no embedding provider is available.
 * Callers should surface this as a user-facing error, not swallow it.
 */
export class EmbeddingUnavailableError extends Error {
  constructor(reason: string) {
    super(
      `Embedding provider unavailable: ${reason}. ` +
      'Run Ollama locally (https://ollama.com) or set REACTPILOT_API_KEY to enable chat.'
    );
    this.name = 'EmbeddingUnavailableError';
  }
}

export class EmbedderService {
  private openai: OpenAI | null = null;
  private provider: 'openai' | 'ollama' | 'mock' = 'openai';
  private model: string = 'text-embedding-ada-002';
  private ollamaModel: string = 'nomic-embed-text';
  private ollamaBaseUrl: string = 'http://localhost:11434';

  constructor(options: {
    provider?: 'openai' | 'ollama';
    model?: string;
    ollamaModel?: string;
    ollamaBaseUrl?: string;
    apiKey?: string;
  } = {}) {
    const key = options.apiKey || process.env.REACTPILOT_API_KEY;
    const envBaseUrl = process.env.REACTPILOT_API_BASE_URL || '';
    const isGroq = envBaseUrl.includes('groq.com');

    if (isGroq) {
      this.provider = 'mock';
    } else {
      const hasLocalBase = envBaseUrl.includes('localhost') || envBaseUrl.includes('11434') || envBaseUrl.includes('ollama');
      this.provider = options.provider || (key && !hasLocalBase ? 'openai' : 'ollama');
      if (hasLocalBase) {
        this.provider = 'ollama';
      }
    }
    
    this.model = options.model || process.env.REACTPILOT_MODEL || 'text-embedding-ada-002';
    this.ollamaModel = options.ollamaModel || process.env.REACTPILOT_MODEL || 'nomic-embed-text';
    
    // Clean base URL for Ollama direct requests
    const rawOllamaUrl = options.ollamaBaseUrl || envBaseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.ollamaBaseUrl = rawOllamaUrl.replace(/\/v1\/?$/, '');

    if (key && this.provider === 'openai') {
      this.openai = new OpenAI({ 
        apiKey: key,
        baseURL: envBaseUrl || undefined
      });
    }
  }

  private hasLoggedOpenAIError = false;

  /**
   * Generate an embedding vector (array of numbers) for a text.
   */
  async embed(text: string): Promise<number[]> {
    if (this.provider === 'mock') {
      // Groq does not support embeddings — require user to switch to a provider that does
      throw new EmbeddingUnavailableError(
        'Groq does not support text embeddings. ' +
        'Use REACTPILOT_API_BASE_URL pointing to OpenAI, or start Ollama locally.'
      );
    }

    if (this.provider === 'openai' && this.openai) {
      try {
        const response = await this.openai.embeddings.create({
          input: text,
          model: this.model,
        });
        return response.data[0].embedding;
      } catch (err) {
        if (!this.hasLoggedOpenAIError) {
          console.warn('OpenAI embedding failed, falling back to Ollama:', err instanceof Error ? err.message : err);
          this.hasLoggedOpenAIError = true;
        }
      }
    }

    // Ollama fallback / primary
    return this.embedOllama(text);
  }

  private hasLoggedOllamaError = false;

  private async embedOllama(text: string): Promise<number[]> {
    try {
      const res = await fetch(`${this.ollamaBaseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: text,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama responded with status: ${res.status}`);
      }

      const data = await res.json() as { embedding: number[] };
      return data.embedding;
    } catch (err) {
      // Throw a clear, actionable error instead of silently returning random vectors.
      // Random vectors produce garbage retrieval results that are impossible to debug.
      throw new EmbeddingUnavailableError(
        `Ollama is not reachable at ${this.ollamaBaseUrl}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
}
