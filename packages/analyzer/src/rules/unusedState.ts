import type { Rule } from '../types';

export const unusedState: Rule = {
  name: 'unused-state',
  visitor: {
    CallExpression(path: any, context: any) {
      if (path.node.callee.name === 'useState' && path.parent.type === 'VariableDeclarator') {
        const id = path.parent.id;
        if (id.type === 'ArrayPattern') {
          const stateVar = id.elements[0];
          const setterVar = id.elements[1];

          if (stateVar && stateVar.type === 'Identifier') {
            const binding = path.scope.getBinding(stateVar.name);
            if (binding && !binding.referenced) {
              context.issues.push({
                file: context.filePath,
                type: 'unused-state',
                line: stateVar.loc?.start.line ?? 0,
                severity: 'warning',
                suggestion: `State variable '${stateVar.name}' is defined but never used.`
              });
            }
          }
        }
      }
    }
  }
};
