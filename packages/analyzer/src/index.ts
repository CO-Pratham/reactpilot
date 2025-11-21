import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import type { Visitor } from "@babel/traverse";
const traverse = (traverseModule as any).default || traverseModule;
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
      const fileIssues = analyzeFile(filePath, code, combinedVisitor);
      issues.push(...fileIssues);

      // Count components in this file
      if (hasReactComponent(code)) {
        componentsScanned++;
      }
      
      // Count hooks usage (naive regex approach for speed)
      const hookMatches = code.match(/use[A-Z][a-zA-Z0-9]*/g);
      if (hookMatches) {
        hooksUsed += hookMatches.length;
      }
    } catch (error) {
      console.warn(`Failed to analyze ${filePath}:`, error);
    }
  });

  const summary = {
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
  };

  // Calculate Performance Score
  // Start at 100, deduct points based on issues
  let score = 100;
  score -= summary.errors * 5;
  score -= summary.warnings * 2;
  score -= summary.info * 0.5;
  
  // Cap score between 0 and 100
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
 * Analyze a single file for issues using modular rules
 */
function analyzeFile(
  filePath: string,
  code: string,
  visitor: Visitor<AnalyzerContext>
): AnalyzerIssue[] {
  const issues: AnalyzerIssue[] = [];

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

    traverse(ast, visitor, undefined, context);
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }

  return issues;
}

/**
 * Helper functions
 */

function hasReactComponent(code: string): boolean {
  return (
    /function\s+[A-Z][a-zA-Z0-9]*/.test(code) ||
    /const\s+[A-Z][a-zA-Z0-9]*\s*=/.test(code) ||
    code.includes("JSX.Element") ||
    code.includes("React.FC")
  );
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
