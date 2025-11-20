import type { Rule } from '../types';

export const deepJSX: Rule = {
  name: 'deep-jsx',
  visitor: {
    JSXElement(path: any, context: any) {
      let depth = 0;
      let current = path;
      
      while (current.parentPath && current.parentPath.isJSXElement()) {
        depth++;
        current = current.parentPath;
      }

      if (depth > 5 && !path.node.seen) { // Avoid reporting multiple times for the same tree
        path.node.seen = true; // Mark as seen (hacky but works for simple traversal)
        context.issues.push({
          file: context.filePath,
          type: 'deep-jsx-nesting',
          line: path.node.loc?.start.line ?? 0,
          severity: 'warning',
          suggestion: `Deeply nested JSX detected (${depth} levels). Consider extracting components.`
        });
      }
    }
  }
};
