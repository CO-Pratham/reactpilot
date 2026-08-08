export type FeatureId =
  | 'analyzer'
  | 'ai-fix'
  | 'graph'
  | 'migration'
  | 'project-chat'
  | 'github-review'
  | 'dashboard'
  | 'plugin-system';

export interface FeatureDef {
  id: FeatureId;
  name: string;
  description: string;
  requiresApiKey: boolean;
  packages: string[];           // @reactpilot/* workspace packages
  externalDeps: string[];       // heavy npm packages installed on-demand
  defaultEnabled: boolean;
}

export const FEATURES: FeatureDef[] = [
  {
    id: 'analyzer',
    name: 'Code Analyzer',
    description: 'AST-based React issue detection (unused imports, hook violations, heavy components)',
    requiresApiKey: false,
    packages: ['@reactpilot/analyzer'],
    externalDeps: ['@babel/parser', '@babel/traverse'],
    defaultEnabled: true,
  },
  {
    id: 'ai-fix',
    name: 'AI Fix Engine',
    description: 'AI-powered code fixes via OpenAI/Groq/Ollama (requires API key for full mode)',
    requiresApiKey: true,
    packages: ['@reactpilot/ai-engine', '@reactpilot/patcher'],
    externalDeps: ['openai'],
    defaultEnabled: false,
  },
  {
    id: 'graph',
    name: 'Dependency Graph',
    description: 'Interactive architecture graph showing component/hook/context relationships',
    requiresApiKey: false,
    packages: ['@reactpilot/graph-engine'],
    externalDeps: [],
    defaultEnabled: true,
  },
  {
    id: 'migration',
    name: 'Migration Engine',
    description: 'Automated React 19 and Next.js migration with dry-run and rollback',
    requiresApiKey: false,
    packages: ['@reactpilot/migration-engine'],
    externalDeps: ['semver'],
    defaultEnabled: false,
  },
  {
    id: 'project-chat',
    name: 'Project Chat (AI RAG)',
    description: 'Ask questions about your codebase using AI with local vector search',
    requiresApiKey: true,
    packages: ['@reactpilot/project-chat'],
    externalDeps: ['openai'],
    defaultEnabled: false,
  },
  {
    id: 'github-review',
    name: 'GitHub / PR Review',
    description: 'Review local git diffs and pull requests with a scored quality report',
    requiresApiKey: false,
    packages: ['@reactpilot/github-review'],
    externalDeps: ['@octokit/rest', 'parse-diff'],
    defaultEnabled: false,
  },
  {
    id: 'dashboard',
    name: 'Local Dashboard',
    description: 'Web dashboard served locally (reactpilot dashboard) to view all results',
    requiresApiKey: false,
    packages: [],
    externalDeps: [],
    defaultEnabled: true,
  },
  {
    id: 'plugin-system',
    name: 'Plugin System',
    description: 'Install and manage ReactPilot plugins to extend functionality',
    requiresApiKey: false,
    packages: ['@reactpilot/plugin-system'],
    externalDeps: ['semver'],
    defaultEnabled: false,
  },
];
