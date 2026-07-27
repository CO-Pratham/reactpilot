export interface IndexedFile {
  filePath: string;
  hash: string;
  components: IndexedComponent[];
  hooks: IndexedHook[];
  imports: IndexedImport[];
  exports: string[];
  apiCalls: IndexedApiCall[];
  contextProviders: string[];
  routes: string[];
  rawText: string;
}

export interface IndexedComponent {
  name: string;
  line: number;
  props: string[];
  isRSC: boolean;
}

export interface IndexedHook {
  name: string;
  line: number;
}

export interface IndexedImport {
  names: string[];
  from: string;
}

export interface IndexedApiCall {
  method: string;
  url: string;
  line: number;
}

export interface SearchChunk {
  filePath: string;
  content: string;
  score: number;
  lineStart: number;
  lineEnd: number;
  type: 'component' | 'hook' | 'general' | 'file';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}
