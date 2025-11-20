import type { Rule } from '../types';

export const unusedImports: Rule = {
  name: 'unused-import',
  visitor: {
    Program(path: any, context: any) {
      const declaredImports = new Map<string, any>();
      const usedIdentifiers = new Set<string>();

      path.traverse({
        ImportDeclaration(p: any) {
          p.node.specifiers.forEach((spec: any) => {
            declaredImports.set(spec.local.name, {
              line: p.node.loc?.start.line ?? 0,
              name: spec.local.name
            });
          });
        },
        Identifier(p: any) {
          if (p.parent.type !== 'ImportSpecifier' && 
              p.parent.type !== 'ImportDefaultSpecifier' &&
              p.parent.type !== 'ImportNamespaceSpecifier') {
            usedIdentifiers.add(p.node.name);
          }
          // Handle JSX identifiers
          if (p.parent.type === 'JSXOpeningElement' || p.parent.type === 'JSXClosingElement') {
             usedIdentifiers.add(p.node.name);
          }
        },
        JSXIdentifier(p: any) {
           usedIdentifiers.add(p.node.name);
        }
      });

      declaredImports.forEach((info, name) => {
        if (!usedIdentifiers.has(name)) {
          // Check if it's a React import which might be implicitly used in older React versions
          // But for modern React (17+), we don't strictly need it, but let's keep it simple
          if (name === 'React' && !usedIdentifiers.has('React')) {
             // skip if React is unused (often handled by transform)
          } else {
            context.issues.push({
              file: context.filePath,
              type: 'unused-import',
              line: info.line,
              severity: 'info',
              suggestion: `Import '${name}' is declared but never used.`
            });
          }
        }
      });
    }
  }
};
