import OpenAI from 'openai';

export class LLMService {
  private openai: OpenAI | null = null;
  private model: string = 'gpt-4o';

  constructor(apiKey?: string, baseURL?: string, model?: string) {
    const key = apiKey || process.env.REACTPILOT_API_KEY;
    const url = baseURL || process.env.REACTPILOT_API_BASE_URL;
    this.model = model || process.env.REACTPILOT_MODEL || 'gpt-4o';

    if (key) {
      this.openai = new OpenAI({ 
        apiKey: key,
        baseURL: url // Optional, defaults to OpenAI
      });
    }
  }

  isConfigured(): boolean {
    return !!this.openai;
  }

  async getCompletion(prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Please set REACTPILOT_API_KEY.');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.model,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('LLM Call Failed:', error);
      throw error;
    }
  }
}
