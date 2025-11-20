// src/index.ts
import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

// src/rules/unusedImports.ts
var unusedImports = {
  name: "unused-import",
  visitor: {
    Program(path2, context) {
      const declaredImports = /* @__PURE__ */ new Map();
      const usedIdentifiers = /* @__PURE__ */ new Set();
      path2.traverse({
        ImportDeclaration(p) {
          p.node.specifiers.forEach((spec) => {
            declaredImports.set(spec.local.name, {
              line: p.node.loc?.start.line ?? 0,
              name: spec.local.name
            });
          });
        },
        Identifier(p) {
          if (p.parent.type !== "ImportSpecifier" && p.parent.type !== "ImportDefaultSpecifier" && p.parent.type !== "ImportNamespaceSpecifier") {
            usedIdentifiers.add(p.node.name);
          }
          if (p.parent.type === "JSXOpeningElement" || p.parent.type === "JSXClosingElement") {
            usedIdentifiers.add(p.node.name);
          }
        },
        JSXIdentifier(p) {
          usedIdentifiers.add(p.node.name);
        }
      });
      declaredImports.forEach((info, name) => {
        if (!usedIdentifiers.has(name)) {
          if (name === "React" && !usedIdentifiers.has("React")) {
          } else {
            context.issues.push({
              file: context.filePath,
              type: "unused-import",
              line: info.line,
              severity: "info",
              suggestion: `Import '${name}' is declared but never used.`
            });
          }
        }
      });
    }
  }
};

// src/rules/heavyComponent.ts
var heavyComponent = {
  name: "heavy-component",
  visitor: {
    FunctionDeclaration(path2, context) {
      checkComponentSize(path2.node, context);
    },
    VariableDeclarator(path2, context) {
      if (path2.node.init && (path2.node.init.type === "ArrowFunctionExpression" || path2.node.init.type === "FunctionExpression")) {
        checkComponentSize({ ...path2.node.init, id: path2.node.id }, context);
      }
    }
  }
};
function checkComponentSize(node, context) {
  if (!node.id || !isComponentName(node.id.name)) return;
  const start = node.loc?.start.line || 0;
  const end = node.loc?.end.line || 0;
  const lines = end - start;
  if (lines > 80) {
    context.issues.push({
      file: context.filePath,
      type: "heavy-component",
      line: start,
      severity: "warning",
      suggestion: `Component '${node.id.name}' is ${lines} lines long (> 80). Consider breaking it into smaller components.`
    });
  }
}
function isComponentName(name) {
  return /^[A-Z]/.test(name);
}

// src/rules/invalidHooks.ts
var invalidHooks = {
  name: "invalid-hook",
  visitor: {
    CallExpression(path2, context) {
      const callee = path2.node.callee;
      if (callee.type === "Identifier" && callee.name.startsWith("use")) {
        const hookName = callee.name;
        if (isConditionallyExecuted(path2)) {
          context.issues.push({
            file: context.filePath,
            type: "invalid-hook",
            line: path2.node.loc?.start.line ?? 0,
            severity: "error",
            suggestion: `Hook '${hookName}' is called conditionally. Hooks must be called at the top level.`
          });
        }
        if (isInLoop(path2)) {
          context.issues.push({
            file: context.filePath,
            type: "invalid-hook",
            line: path2.node.loc?.start.line ?? 0,
            severity: "error",
            suggestion: `Hook '${hookName}' is called inside a loop. Hooks must be called at the top level.`
          });
        }
        if (hookName === "useEffect" || hookName === "useCallback" || hookName === "useMemo") {
          if (path2.node.arguments.length < 2) {
            context.issues.push({
              file: context.filePath,
              type: "invalid-hook",
              line: path2.node.loc?.start.line ?? 0,
              severity: "warning",
              suggestion: `${hookName} is missing a dependency array. It will run on every render.`
            });
          }
        }
      }
    }
  }
};
function isConditionallyExecuted(path2) {
  let current = path2.parentPath;
  while (current) {
    if (current.isIfStatement() || current.isConditionalExpression() || current.isLogicalExpression() || current.isSwitchCase()) {
      return true;
    }
    if (current.isFunction()) break;
    current = current.parentPath;
  }
  return false;
}
function isInLoop(path2) {
  let current = path2.parentPath;
  while (current) {
    if (current.isLoop() || current.type === "ForStatement" || current.type === "WhileStatement" || current.type === "ForInStatement" || current.type === "ForOfStatement") {
      return true;
    }
    if (current.isFunction()) break;
    current = current.parentPath;
  }
  return false;
}

// src/rules/inlineFunctions.ts
var inlineFunctions = {
  name: "inline-function",
  visitor: {
    JSXAttribute(path2, context) {
      const value = path2.node.value;
      if (value?.type === "JSXExpressionContainer") {
        const expression = value.expression;
        if (expression.type === "ArrowFunctionExpression" || expression.type === "FunctionExpression") {
          context.issues.push({
            file: context.filePath,
            type: "inline-function-jsx",
            line: path2.node.loc?.start.line ?? 0,
            severity: "warning",
            suggestion: "Inline function in JSX prop causes re-renders. Use useCallback."
          });
        }
      }
    }
  }
};

// src/rules/deepJSX.ts
var deepJSX = {
  name: "deep-jsx",
  visitor: {
    JSXElement(path2, context) {
      let depth = 0;
      let current = path2;
      while (current.parentPath && current.parentPath.isJSXElement()) {
        depth++;
        current = current.parentPath;
      }
      if (depth > 5 && !path2.node.seen) {
        path2.node.seen = true;
        context.issues.push({
          file: context.filePath,
          type: "deep-jsx-nesting",
          line: path2.node.loc?.start.line ?? 0,
          severity: "warning",
          suggestion: `Deeply nested JSX detected (${depth} levels). Consider extracting components.`
        });
      }
    }
  }
};

// src/rules/unusedState.ts
var unusedState = {
  name: "unused-state",
  visitor: {
    CallExpression(path2, context) {
      if (path2.node.callee.name === "useState" && path2.parent.type === "VariableDeclarator") {
        const id = path2.parent.id;
        if (id.type === "ArrayPattern") {
          const stateVar = id.elements[0];
          const setterVar = id.elements[1];
          if (stateVar && stateVar.type === "Identifier") {
            const binding = path2.scope.getBinding(stateVar.name);
            if (binding && !binding.referenced) {
              context.issues.push({
                file: context.filePath,
                type: "unused-state",
                line: stateVar.loc?.start.line ?? 0,
                severity: "warning",
                suggestion: `State variable '${stateVar.name}' is defined but never used.`
              });
            }
          }
        }
      }
    }
  }
};

// src/rules/expensiveRender.ts
var expensiveRender = {
  name: "expensive-render",
  visitor: {
    CallExpression(path2, context) {
      if (!isInRenderScope(path2)) return;
      const callee = path2.node.callee;
      const expensiveCalls = ["filter", "reduce", "sort", "JSON.parse"];
      let name = "";
      if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
        name = callee.property.name;
      } else if (callee.type === "Identifier") {
        name = callee.name;
      }
      if (expensiveCalls.includes(name)) {
        context.issues.push({
          file: context.filePath,
          type: "expensive-render-call",
          line: path2.node.loc?.start.line ?? 0,
          severity: "warning",
          suggestion: `Expensive call '${name}' inside render. Consider using useMemo.`
        });
      }
    }
  }
};
function isInRenderScope(path2) {
  let current = path2.parentPath;
  while (current) {
    if (current.isFunction()) {
      if (isComponent(current.node)) return true;
      if (current.parentPath.isCallExpression() && current.parentPath.node.callee.name?.startsWith("use")) return false;
      if (current.parentPath.isJSXAttribute()) return false;
      return false;
    }
    current = current.parentPath;
  }
  return false;
}
function isComponent(node) {
  return node.id && /^[A-Z]/.test(node.id.name);
}

// src/rules/index.ts
var rules = [
  unusedImports,
  heavyComponent,
  invalidHooks,
  inlineFunctions,
  deepJSX,
  unusedState,
  expensiveRender
];

// src/index.ts
var traverse = traverseModule.default || traverseModule;
var EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
var EXCLUDE_DIRS = ["node_modules", "dist", "build", ".git", "coverage"];
function analyzeProject(projectPath, options = {}) {
  const files = collectSourceFiles(projectPath);
  const issues = [];
  let componentsScanned = 0;
  const selectedRules = getSelectedRules(options);
  const combinedVisitor = buildCombinedVisitor(selectedRules);
  files.forEach((filePath) => {
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      const fileIssues = analyzeFile(filePath, code, combinedVisitor);
      issues.push(...fileIssues);
      if (hasReactComponent(code)) {
        componentsScanned++;
      }
    } catch (error) {
      console.warn(`Failed to analyze ${filePath}:`, error);
    }
  });
  const summary = {
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length
  };
  return {
    issues,
    componentsScanned,
    filesScanned: files.length,
    summary
  };
}
function analyzeFile(filePath, code, visitor) {
  const issues = [];
  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx", "decorators-legacy"]
    });
    const context = {
      filePath,
      code,
      ast,
      issues
    };
    traverse(ast, visitor, void 0, context);
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }
  return issues;
}
function hasReactComponent(code) {
  return /function\s+[A-Z][a-zA-Z0-9]*/.test(code) || /const\s+[A-Z][a-zA-Z0-9]*\s*=/.test(code) || code.includes("JSX.Element") || code.includes("React.FC");
}
function collectSourceFiles(projectPath, acc = []) {
  try {
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
    console.warn(`Cannot read directory ${projectPath}:`, error);
  }
  return acc;
}
function buildCombinedVisitor(ruleDefinitions) {
  const handlerMap = {};
  ruleDefinitions.forEach((rule) => {
    Object.entries(rule.visitor).forEach(([nodeType, handler]) => {
      if (!handlerMap[nodeType]) {
        handlerMap[nodeType] = [];
      }
      handlerMap[nodeType].push(handler);
    });
  });
  const mergedVisitor = {};
  Object.entries(handlerMap).forEach(([nodeType, handlers]) => {
    mergedVisitor[nodeType] = function(path2, state) {
      handlers.forEach((fn) => fn.call(this, path2, state));
    };
  });
  return mergedVisitor;
}
function getSelectedRules(options) {
  if (!options.rules || options.rules.length === 0) {
    return rules;
  }
  const normalized = new Set(options.rules);
  const filtered = rules.filter((rule) => normalized.has(rule.name));
  return filtered.length > 0 ? filtered : rules;
}
function getRuleNames() {
  return rules.map((rule) => rule.name);
}
export {
  analyzeProject,
  getRuleNames
};
