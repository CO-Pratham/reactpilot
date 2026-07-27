import type { IndexedFile, SearchChunk } from './types.js';
import type { LocalVectorStore } from './store.js';
import type { EmbedderService } from './embedder.js';

export class RetrieverService {
  constructor(
    private readonly store: LocalVectorStore,
    private readonly embedder: EmbedderService
  ) {}

  /**
   * Chunk the AST-indexed files and save them to the vector store.
   */
  async buildIndex(indexedFiles: IndexedFile[]): Promise<void> {
    this.store.clear();

    for (const file of indexedFiles) {
      const lines = file.rawText.split('\n');

      // 1. Chunk AST Components
      for (const comp of file.components) {
        const start = Math.max(0, comp.line - 1);
        const end = Math.min(lines.length, start + 40); // Capture up to 40 lines of component
        const content = lines.slice(start, end).join('\n');
        if (!content.trim()) continue;

        const embedding = await this.embedder.embed(content);
        this.store.add({
          filePath: file.filePath,
          content,
          embedding,
          lineStart: start + 1,
          lineEnd: end,
          type: 'component',
        });
      }

      // 2. Chunk AST Hooks
      for (const hook of file.hooks) {
        const start = Math.max(0, hook.line - 1);
        const end = Math.min(lines.length, start + 25);
        const content = lines.slice(start, end).join('\n');
        if (!content.trim()) continue;

        const embedding = await this.embedder.embed(content);
        this.store.add({
          filePath: file.filePath,
          content,
          embedding,
          lineStart: start + 1,
          lineEnd: end,
          type: 'hook',
        });
      }

      // 3. General Sliding Window Chunks (to capture imports, context, utility logic)
      const chunkSize = 30;
      const overlap = 10;
      for (let i = 0; i < lines.length; i += chunkSize - overlap) {
        const start = i;
        const end = Math.min(lines.length, start + chunkSize);
        const content = lines.slice(start, end).join('\n');
        if (!content.trim()) continue;

        // Skip if this chunk is highly redundant with already captured components
        const embedding = await this.embedder.embed(content);
        this.store.add({
          filePath: file.filePath,
          content,
          embedding,
          lineStart: start + 1,
          lineEnd: end,
          type: 'general',
        });

        if (end === lines.length) break;
      }
    }

    this.store.save();
  }

  /**
   * Search for chunks relevant to a query.
   */
  async retrieve(query: string, topK = 10): Promise<SearchChunk[]> {
    const queryVector = await this.embedder.embed(query);
    return this.store.search(queryVector, topK);
  }
}
