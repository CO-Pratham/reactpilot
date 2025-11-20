import type { Rule } from '../types';

export const expensiveRender: Rule = {
  name: 'expensive-render',
  visitor: {
    CallExpression(path: any, context: any) {
      // Check if we are inside a component render scope (not inside useEffect/useCallback/event handler)
      if (!isInRenderScope(path)) return;

      const callee = path.node.callee;
      const expensiveCalls = ['filter', 'reduce', 'sort', 'JSON.parse'];
      
      let name = '';
      if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
        name = callee.property.name;
      } else if (callee.type === 'Identifier') {
        name = callee.name;
      }

      if (expensiveCalls.includes(name)) {
        context.issues.push({
          file: context.filePath,
          type: 'expensive-render-call',
          line: path.node.loc?.start.line ?? 0,
          severity: 'warning',
          suggestion: `Expensive call '${name}' inside render. Consider using useMemo.`
        });
      }
    }
  }
};

function isInRenderScope(path: any): boolean {
  let current = path.parentPath;
  while (current) {
    if (current.isFunction()) {
       // If it's the component function itself, we are in render
       if (isComponent(current.node)) return true;
       
       // If we are inside a hook callback or event handler, we are NOT in render (mostly)
       // Simple heuristic: if parent is CallExpression (useEffect) or JSXAttribute (onClick), return false
       if (current.parentPath.isCallExpression() && current.parentPath.node.callee.name?.startsWith('use')) return false;
       if (current.parentPath.isJSXAttribute()) return false;
       
       return false; // Nested function that is not component
    }
    current = current.parentPath;
  }
  return false; // Top level
}

function isComponent(node: any): boolean {
  return node.id && /^[A-Z]/.test(node.id.name);
}
