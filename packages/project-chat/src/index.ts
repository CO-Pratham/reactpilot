// Public API for @reactpilot/project-chat
export type {
  IndexedFile,
  IndexedComponent,
  IndexedHook,
  IndexedImport,
  IndexedApiCall,
  SearchChunk,
  ChatMessage,
  ChatSession,
} from './types.js';

export { indexProject, indexFile } from './indexer.js';
export { EmbedderService } from './embedder.js';
export { LocalVectorStore } from './store.js';
export type { VectorDocument } from './store.js';
export { RetrieverService } from './retriever.js';
export { ChatEngine } from './chat-engine.js';
export type { ChatEngineOptions } from './chat-engine.js';
export { ChatMemoryManager } from './memory.js';
export { formatResponse } from './formatter.js';
export {
  resolveProjectRoot,
  getProjectContext,
  formatProjectContextForPrompt,
} from './project-context.js';
export type { ProjectContext } from './project-context.js';
