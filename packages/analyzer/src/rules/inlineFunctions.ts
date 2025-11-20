import type { Rule } from '../types';

export const inlineFunctions: Rule = {
  name: 'inline-function',
  visitor: {
    JSXAttribute(path: any, context: any) {
      const value = path.node.value;
      if (value?.type === 'JSXExpressionContainer') {
        const expression = value.expression;
        if (expression.type === 'ArrowFunctionExpression' || expression.type === 'FunctionExpression') {
          context.issues.push({
            file: context.filePath,
            type: 'inline-function-jsx',
            line: path.node.loc?.start.line ?? 0,
            severity: 'warning',
            suggestion: 'Inline function in JSX prop causes re-renders. Use useCallback.'
          });
        }
      }
    }
  }
};
