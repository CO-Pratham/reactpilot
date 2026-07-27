import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export interface ProjectContext {
  name: string;
  version?: string;
  description?: string;
  rootPath: string;
  gitRemote?: string;
  gitBranch?: string;
}

const REACTPILOT_INTERNAL_PACKAGES = new Set([
  '@reactpilot/web',
  '@reactpilot/cli',
]);

const CONFIG_FILENAMES = [
  'reactpilot.config.ts',
  'reactpilot.config.js',
  'reactpilot.config.mjs',
  'reactpilot.config.cjs',
  'reactpilot.config.json',
];

function hasReactPilotConfig(dir: string): boolean {
  return CONFIG_FILENAMES.some((name) => fs.existsSync(path.join(dir, name)));
}

function isReactPilotInternalDir(dir: string): boolean {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
    return typeof pkg.name === 'string' && REACTPILOT_INTERNAL_PACKAGES.has(pkg.name);
  } catch {
    return false;
  }
}

function isHostProjectDir(dir: string): boolean {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath) || isReactPilotInternalDir(dir)) return false;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
      name?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    return Boolean(
      hasReactPilotConfig(dir) ||
        deps['@reactpilot/cli'] ||
        deps['reactpilot'] ||
        deps['@reactpilot/web'] ||
        pkg.name === 'reactpilot'
    );
  } catch {
    return hasReactPilotConfig(dir);
  }
}

/**
 * Resolve the host project root from a starting directory.
 * Walks up the tree, skipping ReactPilot internal packages (e.g. apps/web).
 */
export function resolveProjectRoot(startDir: string = process.cwd()): string {
  if (process.env.REACTPILOT_PROJECT_ROOT) {
    return path.resolve(process.env.REACTPILOT_PROJECT_ROOT);
  }

  let current = path.resolve(startDir);
  let fallback: string | null = null;

  while (true) {
    if (hasReactPilotConfig(current)) {
      return current;
    }

    if (isHostProjectDir(current)) {
      fallback = current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return fallback ?? path.resolve(startDir);
}

/**
 * Collect metadata about the host project for chat context injection.
 */
export function getProjectContext(projectRoot: string): ProjectContext {
  const context: ProjectContext = {
    name: path.basename(projectRoot),
    rootPath: projectRoot,
  };

  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
        name?: string;
        version?: string;
        description?: string;
      };
      if (pkg.name) context.name = pkg.name;
      context.version = pkg.version;
      context.description = pkg.description;
    } catch {
      // ignore malformed package.json
    }
  }

  const gitDir = path.join(projectRoot, '.git');
  if (fs.existsSync(gitDir)) {
    try {
      context.gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      context.gitRemote = execSync('git remote get-url origin', {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      // git not available or no origin remote
    }
  }

  return context;
}

export function formatProjectContextForPrompt(context: ProjectContext): string {
  const lines = [
    'CURRENT PROJECT (ReactPilot is installed here — you already have full local access):',
    `- Name: ${context.name}`,
    `- Path: ${context.rootPath}`,
  ];

  if (context.description) lines.push(`- Description: ${context.description}`);
  if (context.version) lines.push(`- Version: ${context.version}`);
  if (context.gitRemote) lines.push(`- Git remote: ${context.gitRemote}`);
  if (context.gitBranch) lines.push(`- Git branch: ${context.gitBranch}`);

  lines.push(
    '',
    'IMPORTANT: Never ask the user for a repository URL, file path, or permission to access this project. You are running inside it and can answer questions about it directly.'
  );

  return lines.join('\n');
}
