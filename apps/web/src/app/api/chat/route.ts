import { NextResponse } from 'next/server';
import {
  ChatMemoryManager,
  LocalVectorStore,
  EmbedderService,
  RetrieverService,
  ChatEngine,
  indexProject,
  resolveProjectRoot,
  getProjectContext,
} from '@reactpilot/project-chat';
import { loadConfig } from '@reactpilot/config';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const CACHE_DIR = path.join(os.homedir(), '.reactpilot', 'cache');

function loadEnvVariables(projectRoot: string): Record<string, string> {
  const candidates = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '../../.env'),
  ];

  const variables: Record<string, string> = {};
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;

    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        variables[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    });
    break;
  }

  return variables;
}

// Initialize memory manager
const memory = new ChatMemoryManager(CACHE_DIR);

export async function GET() {
  try {
    const sessions = memory.getSessions();
    if (sessions.length === 0) {
      const defaultSession = memory.createSession('General Conversation');
      return NextResponse.json([defaultSession]);
    }
    return NextResponse.json(sessions);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId, action, title } = body;

    if (action === 'create') {
      const newSession = memory.createSession(title || 'New Chat Session');
      return NextResponse.json(newSession);
    }

    if (!message) {
      return NextResponse.json({ error: 'Message query is required' }, { status: 400 });
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const sessions = memory.getSessions();
      activeSessionId = sessions[0]?.id || memory.createSession('General Conversation').id;
    }

    const projectRoot = resolveProjectRoot(process.cwd());
    const projectContext = getProjectContext(projectRoot);
    const { config } = await loadConfig(projectRoot);

    const variables = loadEnvVariables(projectRoot);
    const apiKey = variables.REACTPILOT_API_KEY || '';
    const apiBaseUrl = variables.REACTPILOT_API_BASE_URL || '';
    const model = variables.REACTPILOT_MODEL || config.chat.model || 'gpt-4o-mini';

    process.env.REACTPILOT_API_KEY = apiKey;
    process.env.REACTPILOT_API_BASE_URL = apiBaseUrl;
    process.env.REACTPILOT_MODEL = model;

    const embedder = new EmbedderService({
      provider: config.chat.provider,
      model: config.chat.embeddingModel,
      ollamaModel: config.chat.ollamaEmbeddingModel,
    });
    const store = new LocalVectorStore(projectRoot, CACHE_DIR);
    const retriever = new RetrieverService(store, embedder);
    const chatEngine = new ChatEngine({
      provider: config.chat.provider,
      model,
    });

    const hasIndex = store.load();
    if (!hasIndex) {
      const indexed = indexProject(projectRoot);
      await retriever.buildIndex(indexed);
    }

    const chunks = await retriever.retrieve(message, config.chat.topK);
    const history = memory.getSession(activeSessionId)?.messages || [];

    memory.addMessage(activeSessionId, { role: 'user', content: message });

    const responseText = await chatEngine.chatStream(
      message,
      chunks,
      history,
      () => {},
      projectContext
    );

    memory.addMessage(activeSessionId, { role: 'assistant', content: responseText });

    return NextResponse.json({
      role: 'assistant',
      content: responseText,
      sessionId: activeSessionId,
      project: {
        name: projectContext.name,
        path: projectContext.rootPath,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
