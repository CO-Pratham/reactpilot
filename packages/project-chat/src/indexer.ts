import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = (traverseModule as any).default || traverseModule;
import type { IndexedFile, IndexedComponent, IndexedHook, IndexedImport, IndexedApiCall } from './types.js';

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage', '.next'];

/**
 * Scan project files and perform AST analysis to build a complete index.
 */
export function indexProject(projectPath: string): IndexedFile[] {
  const files = collectFiles(projectPath);
  const index: IndexedFile[] = [];

  for (const file of files) {
    try {
      const code = fs.readFileSync(file, 'utf-8');
      const hash = crypto.createHash('md5').update(code).digest('hex');
      const relativePath = path.relative(projectPath, file);

      const fileIndex = indexFile(relativePath, code, hash);
      index.push(fileIndex);
    } catch (err) {
      console.warn(`⚠ Failed to index file "${file}":`, err);
    }
  }

  return index;
}

/**
 * Perform AST analysis on a single file.
 */
export function indexFile(filePath: string, code: string, hash: string): IndexedFile {
  const components: IndexedComponent[] = [];
  const hooks: IndexedHook[] = [];
  const imports: IndexedImport[] = [];
  const exports: string[] = [];
  const apiCalls: IndexedApiCall[] = [];
  const contextProviders: string[] = [];
  const routes: string[] = [];

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    });

    traverse(ast, {
      // Imports
      ImportDeclaration(p: any) {
        const from = p.node.source.value;
        const names = p.node.specifiers.map((spec: any) => spec.local.name);
        imports.push({ names, from });
      },

      // Exports
      ExportNamedDeclaration(p: any) {
        if (p.node.declaration) {
          if (p.node.declaration.declarations) {
            for (const decl of p.node.declaration.declarations) {
              if (decl.id.name) exports.push(decl.id.name);
            }
          } else if (p.node.declaration.id?.name) {
            exports.push(p.node.declaration.id.name);
          }
        }
      },
      ExportDefaultDeclaration(p: any) {
        if (p.node.declaration.id?.name) {
          exports.push(p.node.declaration.id.name);
        } else {
          exports.push('default');
        }
      },

      // Functions (Components / Custom Hooks)
      FunctionDeclaration(p: any) {
        const name = p.node.id?.name;
        if (!name) return;

        const line = p.node.loc?.start.line ?? 1;

        if (name.startsWith('use') && name.charCodeAt(3) >= 65 && name.charCodeAt(3) <= 90) {
          hooks.push({ name, line });
        } else if (name.charCodeAt(0) >= 65 && name.charCodeAt(0) <= 90) {
          // React Component
          components.push({
            name,
            line,
            props: getComponentProps(p),
            isRSC: !code.includes('"use client"') && !code.includes("'use client'"),
          });
        }
      },

      // Variable Declarations (Arrow Function Components / Hook calls)
      VariableDeclarator(p: any) {
        const name = p.node.id?.name;
        if (!name) return;

        const line = p.node.loc?.start.line ?? 1;

        // Arrow Component or Hook
        const initType = p.node.init?.type;
        if (initType === 'ArrowFunctionExpression' || initType === 'FunctionExpression') {
          if (name.startsWith('use') && name.charCodeAt(3) >= 65 && name.charCodeAt(3) <= 90) {
            hooks.push({ name, line });
          } else if (name.charCodeAt(0) >= 65 && name.charCodeAt(0) <= 90) {
            components.push({
              name,
              line,
              props: getComponentProps(p.get('init')),
              isRSC: !code.includes('"use client"') && !code.includes("'use client'"),
            });
          }
        }
      },

      // API calls & Context references
      CallExpression(p: any) {
        const callee = p.node.callee;
        const line = p.node.loc?.start.line ?? 1;

        // fetch()
        if (callee.type === 'Identifier' && callee.name === 'fetch') {
          const arg = p.node.arguments[0];
          const url = arg?.type === 'StringLiteral' ? arg.value : '[dynamic]';
          apiCalls.push({ method: 'GET', url, line });
        }

        // axios.get(), axios.post(), etc.
        if (callee.type === 'MemberExpression' && callee.object.name === 'axios') {
          const method = callee.property.name?.toUpperCase() ?? 'GET';
          const arg = p.node.arguments[0];
          const url = arg?.type === 'StringLiteral' ? arg.value : '[dynamic]';
          apiCalls.push({ method, url, line });
        }

        // createContext() / Context.Provider
        if (callee.type === 'Identifier' && callee.name === 'createContext') {
          contextProviders.push(filePath);
        }
      },

      // JSX Elements (e.g. router Route elements)
      JSXOpeningElement(p: any) {
        const name = p.node.name.name;
        if (name === 'Route') {
          const pathAttr = p.node.attributes.find((attr: any) => attr.name?.name === 'path');
          if (pathAttr?.value?.value) {
            routes.push(pathAttr.value.value);
          }
        }
      },
    });
  } catch {
    // AST parsing failed, indexer falls back to basic metadata
  }

  // File-based Next.js route mapping
  if (filePath.includes('app/') && (filePath.endsWith('page.tsx') || filePath.endsWith('page.jsx'))) {
    const routePath = '/' + filePath
      .replace(/\\/g, '/')
      .split('app/')[1]
      .replace(/\/page\.[jt]sx?$/, '')
      .replace(/\(.*\)\/?/g, '') // Remove group routes e.g. (dashboard)
      .replace(/\[([^\]]+)\]/g, ':$1'); // Next.js dynamic path [id] -> :id
    routes.push(routePath === '/' ? '/' : routePath.replace(/\/$/, ''));
  }

  return {
    filePath,
    hash,
    components,
    hooks,
    imports,
    exports,
    apiCalls,
    contextProviders,
    routes,
    rawText: code,
  };
}

function loadIgnorePatterns(dir: string): string[] {
  const ignoreFile = path.join(dir, '.reactpilotignore');
  if (!fs.existsSync(ignoreFile)) return [];
  try {
    return fs
      .readFileSync(ignoreFile, 'utf-8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  } catch {
    return [];
  }
}

function collectFiles(dir: string, acc: string[] = [], customIgnore?: string[]): string[] {
  const ignorePatterns = customIgnore ?? loadIgnorePatterns(dir);
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (ignorePatterns.some((pattern) => entry.name === pattern || fullPath.includes(pattern))) {
        continue;
      }
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          collectFiles(fullPath, acc, ignorePatterns);
        }
      } else if (EXTENSIONS.includes(path.extname(entry.name))) {
        acc.push(fullPath);
      }
    }
  } catch { /* ignored */ }
  return acc;
}

function getComponentProps(pathObj: any): string[] {
  const params = pathObj.node?.params;
  if (!params || params.length === 0) return [];
  const firstParam = params[0];

  if (firstParam.type === 'ObjectPattern') {
    return firstParam.properties
      .map((p: any) => p.key?.name)
      .filter(Boolean);
  }

  if (firstParam.type === 'Identifier') {
    return [firstParam.name];
  }

  return [];
}
