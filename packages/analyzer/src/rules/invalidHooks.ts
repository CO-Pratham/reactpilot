import type { Rule } from '../types';

export const invalidHooks: Rule = {
  name: 'invalid-hook',
  visitor: {
    CallExpression(path: any, context: any) {
      const callee = path.node.callee;
      if (callee.type === 'Identifier' && callee.name.startsWith('use')) {
        const hookName = callee.name;
        
        // Check 1: Conditional execution
        if (isConditionallyExecuted(path)) {
          context.issues.push({
            file: context.filePath,
            type: 'invalid-hook',
            line: path.node.loc?.start.line ?? 0,
            severity: 'error',
            suggestion: `Hook '${hookName}' is called conditionally. Hooks must be called at the top level.`
          });
        }

        // Check 2: Inside loop
        if (isInLoop(path)) {
          context.issues.push({
            file: context.filePath,
            type: 'invalid-hook',
            line: path.node.loc?.start.line ?? 0,
            severity: 'error',
            suggestion: `Hook '${hookName}' is called inside a loop. Hooks must be called at the top level.`
          });
        }

        // Check 3: useEffect dependencies
        if (hookName === 'useEffect' || hookName === 'useCallback' || hookName === 'useMemo') {
           if (path.node.arguments.length < 2) {
             context.issues.push({
               file: context.filePath,
               type: 'invalid-hook',
               line: path.node.loc?.start.line ?? 0,
               severity: 'warning',
               suggestion: `${hookName} is missing a dependency array. It will run on every render.`
             });
           }
        }
      }
    }
  }
};

function isConditionallyExecuted(path: any): boolean {
  let current = path.parentPath;
  while (current) {
    if (
      current.isIfStatement() ||
      current.isConditionalExpression() ||
      current.isLogicalExpression() ||
      current.isSwitchCase()
    ) {
      return true;
    }
    if (current.isFunction()) break;
    current = current.parentPath;
  }
  return false;
}

function isInLoop(path: any): boolean {
  let current = path.parentPath;
  while (current) {
    if (
      current.isLoop() ||
      current.type === 'ForStatement' ||
      current.type === 'WhileStatement' ||
      current.type === 'ForInStatement' ||
      current.type === 'ForOfStatement'
    ) {
      return true;
    }
    if (current.isFunction()) break;
    current = current.parentPath;
  }
  return false;
}
