import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { parse as parseDotenv } from 'dotenv';
import { getDashboardSnapshot } from './dashboard/dashboard-data.js';
import { getReactPilotVersionInfo } from './dashboard/reactpilot-version.js';
import {
  listRuns,
  getLatestReview,
} from '@reactpilot/github-review';
import {
  buildGraph,
  detectCircularDependencies,
  detectUnusedNodes,
  exportToHtml,
} from '@reactpilot/graph-engine';
import {
  listInstalledPlugins,
  fetchMarketplace,
} from '@reactpilot/plugin-system';
import {
  resolveProjectRoot,
  getProjectContext,
  ChatMemoryManager,
  EmbedderService,
  LocalVectorStore,
  RetrieverService,
  ChatEngine,
  indexProject,
} from '@reactpilot/project-chat';
import { loadConfig } from '@reactpilot/config';
import os from 'node:os';

const CACHE_DIR = path.join(os.homedir(), '.reactpilot', 'cache');
const PLUGINS_DIR = path.join(os.homedir(), '.reactpilot', 'plugins');

// In tsup CommonJS bundle, we can use __dirname
const staticDir = path.join(__dirname, 'dashboard-ui');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

export async function runDashboard(options: { port?: string } = {}) {
  const preferredPort = parseInt(options.port || '3000', 10);

  const server = http.createServer(async (req, res) => {
    // CORS: allow only localhost origins to prevent any website from reading API keys or chat data
    const origin = req.headers.origin || '';
    const isLocalOrigin =
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://[::1]') ||
      origin === '';
    if (isLocalOrigin && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    // === API ROUTES ===
    if (pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json');
      try {
        if (pathname === '/api/dashboard' && req.method === 'GET') {
          return res.end(JSON.stringify(getDashboardSnapshot()));
        }

        if (pathname === '/api/history' && req.method === 'GET') {
          return res.end(JSON.stringify({
            runs: listRuns(50),
            review: getLatestReview(),
          }));
        }

        if (pathname === '/api/review' && req.method === 'GET') {
          return res.end(JSON.stringify({ review: getLatestReview() }));
        }

        if (pathname === '/api/graph' && req.method === 'GET') {
          const projectRoot = resolveProjectRoot(process.cwd());
          const graph = buildGraph(projectRoot);
          detectCircularDependencies(graph);
          detectUnusedNodes(graph);
          const html = exportToHtml(graph, 'dark');

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          return res.end(html);
        }

        if (pathname === '/api/settings') {
          const projectRoot = resolveProjectRoot(process.cwd());
          const envPath = path.join(projectRoot, '.env');

          if (req.method === 'GET') {
            let variables: Record<string, string> = {};
            if (fs.existsSync(envPath)) {
              // Use dotenv.parse — handles quoted values, = in values, comments correctly
              variables = parseDotenv(fs.readFileSync(envPath, 'utf-8'));
            }
            return res.end(JSON.stringify({
              apiKey: variables.REACTPILOT_API_KEY || '',
              apiBaseUrl: variables.REACTPILOT_API_BASE_URL || '',
              model: variables.REACTPILOT_MODEL || '',
            }));
          }

          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) {
              body += chunk;
            }
            const { apiKey, apiBaseUrl, model } = JSON.parse(body);

            // Warn if .env is not in .gitignore before writing API key
            const gitignorePath = path.join(projectRoot, '.gitignore');
            if (apiKey && fs.existsSync(gitignorePath)) {
              const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
              if (!gitignoreContent.includes('.env')) {
                console.warn(
                  '\u26a0  WARNING: .env is not listed in .gitignore. ' +
                  'Your API key may be accidentally committed to version control.'
                );
              }
            }

            const envLines = [
              `REACTPILOT_API_KEY=${apiKey || ''}`,
              `REACTPILOT_API_BASE_URL=${apiBaseUrl || ''}`,
              `REACTPILOT_MODEL=${model || ''}`,
              ''
            ];
            fs.writeFileSync(envPath, envLines.join('\n'), 'utf-8');
            return res.end(JSON.stringify({ success: true }));
          }
        }

        if (pathname === '/api/plugins' && req.method === 'GET') {
          const installed = listInstalledPlugins(PLUGINS_DIR);
          const marketplace = await fetchMarketplace(CACHE_DIR);
          return res.end(JSON.stringify({ installed, marketplace }));
        }

        if (pathname === '/api/insights' && req.method === 'GET') {
          const projectRoot = resolveProjectRoot(process.cwd());
          const data = getDashboardSnapshot();
          const reactpilot = await getReactPilotVersionInfo(projectRoot);
          return res.end(JSON.stringify({
            project: data.project,
            graph: data.graph,
            migration: data.migration,
            setup: data.setup,
            plugins: data.plugins,
            unusedNodes: data.graph?.unusedNodes ?? [],
            circularCycles: data.graph?.circularCycles ?? [],
            reactpilot,
          }));
        }

        if (pathname === '/api/chat') {
          const memory = new ChatMemoryManager(CACHE_DIR);
          if (req.method === 'GET') {
            const sessions = memory.getSessions();
            if (sessions.length === 0) {
              const defaultSession = memory.createSession('General Conversation');
              return res.end(JSON.stringify([defaultSession]));
            }
            return res.end(JSON.stringify(sessions));
          }

          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) {
              body += chunk;
            }
            const { message, sessionId, action, title } = JSON.parse(body);

            if (action === 'create') {
              const newSession = memory.createSession(title || 'New Chat Session');
              return res.end(JSON.stringify(newSession));
            }

            if (!message) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Message query is required' }));
            }

            let activeSessionId = sessionId;
            if (!activeSessionId) {
              const sessions = memory.getSessions();
              activeSessionId = sessions[0]?.id || memory.createSession('General Conversation').id;
            }

            const projectRoot = resolveProjectRoot(process.cwd());
            const projectContext = getProjectContext(projectRoot);
            const { config } = await loadConfig(projectRoot);

            // Read env values directly from file using dotenv.parse — never mutate process.env
            let apiKey = process.env.REACTPILOT_API_KEY || '';
            let apiBaseUrl = process.env.REACTPILOT_API_BASE_URL || '';
            let model = process.env.REACTPILOT_MODEL || config.chat.model || 'gpt-4o-mini';

            if (fs.existsSync(envPath)) {
              const envVars = parseDotenv(fs.readFileSync(envPath, 'utf-8'));
              if (envVars.REACTPILOT_API_KEY) apiKey = envVars.REACTPILOT_API_KEY;
              if (envVars.REACTPILOT_API_BASE_URL) apiBaseUrl = envVars.REACTPILOT_API_BASE_URL;
              if (envVars.REACTPILOT_MODEL) model = envVars.REACTPILOT_MODEL;
            }

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

            return res.end(JSON.stringify({
              role: 'assistant',
              content: responseText,
              sessionId: activeSessionId,
              project: {
                name: projectContext.name,
                path: projectContext.rootPath,
              },
            }));
          }
        }

        res.statusCode = 404;
        return res.end(JSON.stringify({ error: 'Not Found' }));
      } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: String(err) }));
      }
    }

    // === STATIC FILES ===
    let safePath = pathname === '/' ? '/index.html' : pathname;
    
    // Check if filename has extension, otherwise append .html (for clean routes like /chat, /settings)
    if (!path.extname(safePath)) {
      safePath += '.html';
    }

    const filePath = path.join(staticDir, safePath);

    // Basic path traversal protection
    if (!filePath.startsWith(staticDir)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html if not found (for SPA client-side routing)
        const fallbackPath = path.join(staticDir, 'index.html');
        fs.readFile(fallbackPath, (fallbackErr, data) => {
          if (fallbackErr) {
            res.statusCode = 404;
            return res.end('Not Found');
          }
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(data);
        });
        return;
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });

  // Find port and start server
  const startServer = (port: number) => {
    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log(`\n🚀 ReactPilot Developer Center started at: ${url}`);
      console.log('Press Ctrl+C to stop the dashboard server.\n');
      
      openBrowser(url);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} in use, trying ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };

  startServer(preferredPort);
}

function openBrowser(url: string) {
  if (process.platform === 'darwin') {
    exec(`open "${url}"`);
  } else if (process.platform === 'win32') {
    // 'start' alone fails in PowerShell; cmd /c start handles both cmd.exe and PowerShell.
    // The empty string "" is the window title, required before the URL.
    exec(`cmd /c start "" "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}
