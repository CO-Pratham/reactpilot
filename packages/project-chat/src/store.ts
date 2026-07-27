import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { SearchChunk } from './types.js';

export interface VectorDocument {
  id: string;
  filePath: string;
  content: string;
  embedding: number[];
  lineStart: number;
  lineEnd: number;
  type: SearchChunk['type'];
}

export class LocalVectorStore {
  private documents: VectorDocument[] = [];
  private dbPath: string;

  constructor(projectRoot: string, cacheDir: string) {
    const projectHash = crypto.createHash('md5').update(projectRoot).digest('hex');
    this.dbPath = path.join(cacheDir, 'embeddings', projectHash, 'vectors.json');
  }

  /**
   * Load store from disk.
   */
  load(): boolean {
    if (!fs.existsSync(this.dbPath)) return false;
    try {
      const raw = fs.readFileSync(this.dbPath, 'utf-8');
      this.documents = JSON.parse(raw) as VectorDocument[];
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save store to disk.
   */
  save(): void {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    fs.writeFileSync(this.dbPath, JSON.stringify(this.documents, null, 2), 'utf-8');
  }

  /**
   * Clear store.
   */
  clear(): void {
    this.documents = [];
  }

  /**
   * Add a document.
   */
  add(doc: Omit<VectorDocument, 'id'>): void {
    const id = crypto.createHash('md5').update(`${doc.filePath}:${doc.lineStart}:${doc.lineEnd}`).digest('hex');
    this.documents.push({ id, ...doc });
  }

  /**
   * Search for top K similar documents.
   */
  search(queryVector: number[], topK = 10): SearchChunk[] {
    const scored = this.documents.map((doc) => {
      const score = cosineSimilarity(queryVector, doc.embedding);
      return {
        filePath: doc.filePath,
        content: doc.content,
        score,
        lineStart: doc.lineStart,
        lineEnd: doc.lineEnd,
        type: doc.type,
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

// ─── Math Helpers ────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
