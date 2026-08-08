import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import _traverseModule from "@babel/traverse";
import type { Visitor } from "@babel/traverse";
// @ts-ignore — @babel/traverse ships CJS default; this shim handles both ESM and CJS
const traverse: typeof _traverseModule = (_traverseModule as any).default ?? _traverseModule;
import { rules } from "./rules";
import type {
  AnalyzerIssue,
  AnalyzerContext,
  AnalyzeOptions,
  Rule,
  AnalyzerReport,
} from "./types";

export type { AnalyzerIssue, AnalyzerReport };

const EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const EXCLUDE_DIRS = ["node_modules", "dist", "build", ".git", "coverage"];

/**
 * Main analyzer function - scans project and detects React issues
 */
export function analyzeProject(
  projectPath: string,
  options: AnalyzeOptions = {}
): AnalyzerReport {
  const files = collectSourceFiles(projectPath);
  const issues: AnalyzerIssue[] = [];
  let componentsScanned = 0;
  let hooksUsed = 0;

  const selectedRules = getSelectedRules(options);
  const combinedVisitor = buildCombinedVisitor(selectedRules);

  files.forEach((filePath) => {
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      // AST-count hooks and components in a single pass alongside rule analysis
      const { fileIssues, componentCount, hookCount } = analyzeFileWithCounts(
        filePath,
        code,
        combinedVisitor
      );
      issues.push(...fileIssues);
      componentsScanned += componentCount;
      hooksUsed += hookCount;
    } catch (error) {
      console.warn(`Failed to analyze ${filePath}:`, error);
    }
  });

  const summary = {
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
  };

  // Performance Score formula (documented):
  //   errors   deduct 10 pts each  (rule violations, hook errors — high impact)
  //   warnings deduct  3 pts each  (style issues, missing deps — medium impact)
  //   info     deduct  0 pts each  (informational only — no score impact)
  // Score is clamped to [0, 100].
  let score = 100;
  score -= summary.errors * 10;
  score -= summary.warnings * 3;
  const performanceScore = Math.max(0, Math.min(100, Math.round(score)));

  // Collect detailed stats
  const inlineHandlers = issues.filter(i => i.type.includes('inline-function')).length;
  const heavyComponents = issues.filter(i => i.type === 'heavy-component').length;
  const potentialBugs = issues.filter(i => i.severity === 'error' || i.type === 'invalid-hook' || i.type === 'unused-state').length;

  return {
    issues,
    componentsScanned,
    filesScanned: files.length,
    performanceScore,
    stats: {
      hooksUsed,
      inlineHandlers,
      heavyComponents,
      potentialBugs
    },
    summary,
  };
}

/**
 * Analyze a single file for issues and simultaneously count components and hooks.
 * Performs a single AST traversal pass for all rules + metrics.
 */
function analyzeFileWithCounts(
  filePath: string,
  code: string,
  visitor: Visitor<AnalyzerContext>
): { fileIssues: AnalyzerIssue[]; componentCount: number; hookCount: number } {
  const issues: AnalyzerIssue[] = [];
  let componentCount = 0;
  let hookCount = 0;

  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx", "decorators-legacy"],
    });

    const context: AnalyzerContext = {
      filePath,
      code,
      ast,
      issues,
    };

    // Build a counting visitor to overlay on top of rule visitors
    const countingVisitor: Visitor<AnalyzerContext> = {
      // Count actual React component declarations (function/arrow returning JSX)
      FunctionDeclaration(p: any) {
        const name: string = p.node.id?.name ?? '';
        if (name && /^[A-Z]/.test(name)) componentCount++;
      },
      VariableDeclarator(p: any) {
        const name: string = p.node.id?.name ?? '';
        const initType: string = p.node.init?.type ?? '';
        const isFn =
          initType === 'ArrowFunctionExpression' || initType === 'FunctionExpression';
        if (name && isFn) {
          if (/^[A-Z]/.test(name)) componentCount++;
          else if (/^use[A-Z]/.test(name)) hookCount++;
        }
      },
      // Count hook call-sites (e.g. useState(), useEffect())
      CallExpression(p: any) {
        const callee = p.node.callee;
        if (callee.type === 'Identifier' && /^use[A-Z]/.test(callee.name)) {
          hookCount++;
        }
      },
    };

    traverse(ast, visitor, undefined, context);
    traverse(ast, countingVisitor, undefined, context);
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }

  return { fileIssues: issues, componentCount, hookCount };
}

/**
 * Helper functions
 */

// hasReactComponent kept for external callers but now unused internally
// (the AST counting in analyzeFileWithCounts is authoritative)
export function hasReactComponent(code: string): boolean {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    });
    let found = false;
    traverse(ast, {
      FunctionDeclaration(p: any) {
        const name: string = p.node.id?.name ?? '';
        if (name && /^[A-Z]/.test(name)) { found = true; p.stop(); }
      },
      VariableDeclarator(p: any) {
        const name: string = p.node.id?.name ?? '';
        const initType: string = p.node.init?.type ?? '';
        const isFn =
          initType === 'ArrowFunctionExpression' || initType === 'FunctionExpression';
        if (name && isFn && /^[A-Z]/.test(name)) { found = true; p.stop(); }
      },
    });
    return found;
  } catch {
    return false;
  }
}

function collectSourceFiles(projectPath: string, acc: string[] = []): string[] {
  try {
    const stat = fs.statSync(projectPath);
    if (stat.isFile()) {
      if (EXTENSIONS.includes(path.extname(projectPath))) {
        acc.push(projectPath);
      }
      return acc;
    }

    const entries = fs.readdirSync(projectPath, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(projectPath, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          collectSourceFiles(fullPath, acc);
        }
      } else if (EXTENSIONS.includes(path.extname(entry.name))) {
        acc.push(fullPath);
      }
    });
  } catch (error) {
    console.warn(`Cannot read path ${projectPath}:`, error);
  }
  return acc;
}

type VisitorHandler = (path: any, state: AnalyzerContext) => void;

function buildCombinedVisitor(
  ruleDefinitions: Rule[]
): Visitor<AnalyzerContext> {
  const handlerMap: Record<string, VisitorHandler[]> = {};

  ruleDefinitions.forEach((rule) => {
    Object.entries(rule.visitor).forEach(([nodeType, handler]) => {
      if (!handlerMap[nodeType]) {
        handlerMap[nodeType] = [];
      }
      handlerMap[nodeType].push(handler as VisitorHandler);
    });
  });

  const mergedVisitor: Record<string, VisitorHandler> = {};
  Object.entries(handlerMap).forEach(([nodeType, handlers]) => {
    mergedVisitor[nodeType] = function (
      this: any,
      path: any,
      state: AnalyzerContext
    ) {
      handlers.forEach((fn) => fn.call(this, path, state));
    };
  });

  return mergedVisitor as Visitor<AnalyzerContext>;
}

function getSelectedRules(options: AnalyzeOptions): Rule[] {
  if (!options.rules || options.rules.length === 0) {
    return rules;
  }

  const normalized = new Set(options.rules);
  const filtered = rules.filter((rule) => normalized.has(rule.name));
  return filtered.length > 0 ? filtered : rules;
}

export function getRuleNames(): string[] {
  return rules.map((rule) => rule.name);
}
