import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = (traverseModule as any).default || traverseModule;
import type { GraphNode, GraphEdge, GraphData, GraphNodeType } from './types.js';

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage', '.next'];

/**
 * Scan the directory and build the raw dependency graph.
 */
export function buildGraph(projectRoot: string): GraphData {
  const files = collectFiles(projectRoot);
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  // Initialize nodes
  for (const file of files) {
    const relativePath = path.relative(projectRoot, file);
    const label = path.basename(file);
    const size = fs.statSync(file).size;
    const type = detectNodeType(relativePath, fs.readFileSync(file, 'utf-8'));

    nodesMap.set(relativePath, {
      id: relativePath,
      label,
      type,
      isUnused: false,
      isCircular: false,
      dependencies: [],
      size,
    });
  }

  // Parse imports and draw edges
  for (const file of files) {
    const relativePath = path.relative(projectRoot, file);
    const sourceNode = nodesMap.get(relativePath);
    if (!sourceNode) continue;

    try {
      const code = fs.readFileSync(file, 'utf-8');
      const imports = extractImports(file, code);

      for (const imp of imports) {
        const resolved = resolveImport(file, imp, projectRoot);
        if (resolved && nodesMap.has(resolved)) {
          sourceNode.dependencies.push(resolved);
          edges.push({
            source: relativePath,
            target: resolved,
            type: sourceNode.type === 'context' ? 'context' : 'import',
            isCircular: false,
          });
        }
      }
    } catch { /* parse failure */ }
  }

  const nodes = Array.from(nodesMap.values());

  return {
    nodes,
    edges,
    circularCycles: [],
    unusedNodes: [],
  };
}

function collectFiles(dir: string, acc: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          collectFiles(fullPath, acc);
        }
      } else if (EXTENSIONS.includes(path.extname(entry.name))) {
        acc.push(fullPath);
      }
    }
  } catch { /* ignored */ }
  return acc;
}

function detectNodeType(relativePath: string, code: string): GraphNodeType {
  const normalized = relativePath.replace(/\\/g, '/');

  if (normalized.includes('/pages/') || normalized.includes('app/') && (normalized.endsWith('page.tsx') || normalized.endsWith('page.jsx'))) {
    return 'page';
  }
  if (normalized.includes('/hooks/') || path.basename(normalized).startsWith('use')) {
    return 'hook';
  }
  if (code.includes('createContext') || normalized.includes('context')) {
    return 'context';
  }
  if (code.includes('JSX.Element') || code.includes('React.FC') || /^[A-Z]/.test(path.basename(normalized))) {
    return 'component';
  }
  return 'utility';
}

function extractImports(filePath: string, code: string): string[] {
  const imports: string[] = [];
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    });

    traverse(ast, {
      ImportDeclaration(p: any) {
        imports.push(p.node.source.value);
      },
      CallExpression(p: any) {
        if (p.node.callee.type === 'Import' || (p.node.callee.type === 'Identifier' && p.node.callee.name === 'require')) {
          const arg = p.node.arguments[0];
          if (arg?.type === 'StringLiteral') {
            imports.push(arg.value);
          }
        }
      },
    });
  } catch { /* ignore parsing errors */ }
  return imports;
}

function resolveImport(sourceFile: string, importPath: string, projectRoot: string): string | null {
  if (!importPath.startsWith('.')) return null; // Ignore node_modules / absolute paths for graph dependencies

  const dirname = path.dirname(sourceFile);
  const candidateBase = path.resolve(dirname, importPath);

  // Try exact file, then with extensions, then as index file in directory
  const candidates = [
    candidateBase,
    ...EXTENSIONS.map((ext) => candidateBase + ext),
    ...EXTENSIONS.map((ext) => path.join(candidateBase, 'index' + ext)),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return path.relative(projectRoot, c);
    }
  }

  return null;
}
