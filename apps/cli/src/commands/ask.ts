import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import {
  indexProject,
  LocalVectorStore,
  EmbedderService,
  RetrieverService,
  ChatEngine,
  ChatMemoryManager,
  formatResponse,
  resolveProjectRoot,
  getProjectContext,
  type ProjectContext,
} from '@reactpilot/project-chat';
import { saveRun } from '@reactpilot/github-review';
import { loadConfig } from '@reactpilot/config';
import {
  withSpinner,
  printSection,
  printSuccess,
  printInfo,
  colors,
  input,
} from '@reactpilot/utils/ui';

const CACHE_DIR = path.join(os.homedir(), '.reactpilot', 'cache');

interface AskOptions {
  index?: boolean;
  stream?: boolean;
}

/**
 * CLI command runner for `reactpilot ask [question]`
 */
export async function runAsk(question: string | undefined, options: AskOptions = {}): Promise<void> {
  printSection('ReactPilot Project AI Chat');

  const cwd = resolveProjectRoot(process.cwd());
  const projectContext = getProjectContext(cwd);
  const { config } = await loadConfig(cwd);

  const embedder = new EmbedderService({
    provider: config.chat.provider,
    model: config.chat.embeddingModel,
    ollamaModel: config.chat.ollamaEmbeddingModel,
  });

  const store = new LocalVectorStore(cwd, CACHE_DIR);
  const retriever = new RetrieverService(store, embedder);
  const chatEngine = new ChatEngine({
    provider: config.chat.provider,
    model: config.chat.model,
  });

  const memory = new ChatMemoryManager(CACHE_DIR);

  // Check index existence, index if missing or forced
  const hasIndex = store.load();
  if (!hasIndex || options.index) {
    await withSpinner(
      'Scanning and AST-indexing project files (this may take a moment)...',
      async () => {
        const indexed = indexProject(cwd);
        await retriever.buildIndex(indexed);
      },
      'Project indexed successfully'
    );
  }

  // Create or load active session
  let session = memory.getSessions()[0];
  if (!session) {
    session = memory.createSession('New Chat Session');
  }

  if (question) {
    await handleQuery(question, session.id, retriever, chatEngine, memory, cwd, projectContext, options);
    return;
  }

  // Interactive mode
  printInfo('Entering interactive chat mode. Type "exit" or "quit" to end.');
  console.log(colors.muted(`Session ID: ${session.id}`));

  while (true) {
    let query: string;
    try {
      query = await input({
        message: colors.bold('Ask ReactPilot'),
      });
    } catch {
      // User pressed Ctrl+C or cancelled
      break;
    }

    if (query.trim().toLowerCase() === 'exit' || query.trim().toLowerCase() === 'quit') {
      break;
    }

    if (!query.trim()) continue;

    await handleQuery(query, session.id, retriever, chatEngine, memory, cwd, projectContext, options);
    console.log('\n');
  }
}

async function handleQuery(
  query: string,
  sessionId: string,
  retriever: RetrieverService,
  chatEngine: ChatEngine,
  memory: ChatMemoryManager,
  projectRoot: string,
  projectContext: ProjectContext,
  options: AskOptions
): Promise<void> {
  // 1. Retrieve Context Chunks
  const chunks = await retriever.retrieve(query);

  // 2. Fetch Chat History
  const history = memory.getSession(sessionId)?.messages || [];

  // 3. Print Header
  console.log(`\n${colors.cyan('🤖 ReactPilot:')}\n`);

  // 4. Stream response
  let fullResponse = '';
  if (options.stream !== false) {
    fullResponse = await chatEngine.chatStream(query, chunks, history, (text) => {
      process.stdout.write(text);
    }, projectContext);
  } else {
    // Non-streaming mode (fallback)
    await withSpinner(
      'Thinking...',
      async () => {
        fullResponse = await chatEngine.chatStream(query, chunks, history, () => {}, projectContext);
        console.log(formatResponse(fullResponse, projectRoot));
      },
      'Done'
    );
  }

  // Format any links if we streamed raw text
  if (options.stream !== false) {
    // If output matches standard terminal markdown link format, print a final formatted line
    console.log('\n');
  }

  // 5. Append to memory
  memory.addMessage(sessionId, { role: 'user', content: query });
  memory.addMessage(sessionId, { role: 'assistant', content: fullResponse });

  saveRun({
    type: 'ask',
    title: 'AI Chat Session',
    projectPath: projectRoot,
    summary: {
      sessionId,
      queryPreview: query.slice(0, 120),
      responseLength: fullResponse.length,
    },
  });
}
