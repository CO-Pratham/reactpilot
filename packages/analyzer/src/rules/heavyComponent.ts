import type { Rule } from '../types';

export const heavyComponent: Rule = {
  name: 'heavy-component',
  visitor: {
    FunctionDeclaration(path: any, context: any) {
      checkComponentSize(path.node, context);
    },
    VariableDeclarator(path: any, context: any) {
      if (path.node.init && (path.node.init.type === 'ArrowFunctionExpression' || path.node.init.type === 'FunctionExpression')) {
        checkComponentSize({ ...path.node.init, id: path.node.id }, context);
      }
    }
  }
};

function checkComponentSize(node: any, context: any) {
  if (!node.id || !isComponentName(node.id.name)) return;

  const start = node.loc?.start.line || 0;
  const end = node.loc?.end.line || 0;
  const lines = end - start;

  if (lines > 80) {
    context.issues.push({
      file: context.filePath,
      type: 'heavy-component',
      line: start,
      severity: 'warning',
      suggestion: `Component '${node.id.name}' is ${lines} lines long (> 80). Consider breaking it into smaller components.`
    });
  }
}

function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}
