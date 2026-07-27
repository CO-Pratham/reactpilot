import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getLatestReview,
  getLatestRun,
  listRuns,
  type DashboardRun,
  type StoredReview,
} from '@reactpilot/github-review';
import {
  resolveProjectRoot,
  getProjectContext,
  ChatMemoryManager,
} from '@reactpilot/project-chat';
import {
  buildGraph,
  detectCircularDependencies,
  detectUnusedNodes,
} from '@reactpilot/graph-engine';
import { detectProjectVersions } from '@reactpilot/migration-engine';
import { listInstalledPlugins } from '@reactpilot/plugin-system';

const CACHE_DIR = path.join(os.homedir(), '.reactpilot', 'cache');
const PLUGINS_DIR = path.join(os.homedir(), '.reactpilot', 'plugins');

export interface CommandStatus {
  id: string;
  command: string;
  tag: string;
  description: string;
  lastRun: DashboardRun | null;
}

export interface DashboardSnapshot {
  project: ReturnType<typeof getProjectContext>;
  review: StoredReview | null;
  runs: DashboardRun[];
  graph: {
    nodeCount: number;
    edgeCount: number;
    unusedCount: number;
    circularCount: number;
    unusedNodes: string[];
    circularCycles: string[][];
  } | null;
  migration: ReturnType<typeof detectProjectVersions>;
  plugins: Array<{ name: string; version: string; description: string }>;
  chatSessionCount: number;
  hasApiKey: boolean;
  setup: {
    apiKeyConfigured: boolean;
    reviewCompleted: boolean;
    graphScanned: boolean;
    pluginsInstalled: boolean;
    chatStarted: boolean;
  };
  commands: CommandStatus[];
}

function loadEnvFlag(projectRoot: string): boolean {
  const candidates = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '../../.env'),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf-8');
    return /REACTPILOT_API_KEY\s*=\s*\S+/.test(content);
  }

  return false;
}

const COMMAND_DEFS = [
  {
    id: 'review',
    command: 'node apps/cli/dist/index.cjs review',
    tag: 'Review',
    description: 'Audit local git diff for quality scores across 6 categories.',
  },
  {
    id: 'plugins',
    command: 'node apps/cli/dist/index.cjs plugin list',
    tag: 'Plugins',
    description: 'List installed custom analyzers and engines.',
  },
  {
    id: 'ask',
    command: 'node apps/cli/dist/index.cjs ask',
    tag: 'Chat',
    description: 'Run interactive semantic AI code chat in the terminal.',
  },
  {
    id: 'graph',
    command: 'node apps/cli/dist/index.cjs graph --open',
    tag: 'Graph',
    description: 'Export and launch visual import cycle dependency map.',
  },
  {
    id: 'migrate',
    command: 'node apps/cli/dist/index.cjs migrate status',
    tag: 'Migrate',
    description: 'Check React 19 / Next.js dependency version status.',
  },
] as const;

export function getDashboardSnapshot(): DashboardSnapshot {
  const projectRoot = resolveProjectRoot(process.cwd());
  const project = getProjectContext(projectRoot);
  const review = getLatestReview();
  const runs = listRuns(30);
  const hasApiKey = loadEnvFlag(projectRoot);

  let graph: DashboardSnapshot['graph'] = null;
  try {
    const data = buildGraph(projectRoot);
    detectCircularDependencies(data);
    detectUnusedNodes(data);
    graph = {
      nodeCount: data.nodes.length,
      edgeCount: data.edges.length,
      unusedCount: data.unusedNodes.length,
      circularCount: data.circularCycles.length,
      unusedNodes: data.unusedNodes.slice(0, 30),
      circularCycles: data.circularCycles.slice(0, 10),
    };
  } catch {
    graph = null;
  }

  const migration = detectProjectVersions(projectRoot);
  const plugins = listInstalledPlugins(PLUGINS_DIR);
  const chatMemory = new ChatMemoryManager(CACHE_DIR);
  const chatSessionCount = chatMemory.getSessions().length;

  const latestGraph = getLatestRun('graph');
  const setup = {
    apiKeyConfigured: hasApiKey,
    reviewCompleted: Boolean(review),
    graphScanned: Boolean(latestGraph || graph),
    pluginsInstalled: plugins.length > 0,
    chatStarted: chatSessionCount > 0,
  };

  const commands: CommandStatus[] = COMMAND_DEFS.map((def) => ({
    ...def,
    lastRun: getLatestRun(def.id as DashboardRun['type']),
  }));

  return {
    project,
    review,
    runs,
    graph,
    migration,
    plugins,
    chatSessionCount,
    hasApiKey,
    setup,
    commands,
  };
}
