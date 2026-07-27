import type { MigrationRule } from '../types.js';

export const react19Rules: MigrationRule[] = [
  // 1. replace Context.Provider with Context
  {
    id: 'context-no-provider',
    name: 'Context Provider simplification',
    description: 'React 19 allows using <Context> directly instead of <Context.Provider>',
    mode: 'react19',
    check(filePath, code) {
      return /\.tsx?$/.test(filePath) && code.includes('.Provider');
    },
    transform(filePath, code) {
      // Regex approach for robustness on small/medium blocks
      return code
        .replace(/<(\w+)\.Provider([^>]*)>/g, '<$1$2>')
        .replace(/<\/(\w+)\.Provider>/g, '</$1>');
    },
  },

  // 2. forwardRef to direct ref prop
  {
    id: 'ref-as-prop',
    name: 'Remove forwardRef wrappers',
    description: 'React 19 supports ref as a regular prop. forwardRef wrappers are no longer needed.',
    mode: 'react19',
    check(filePath, code) {
      return /\.tsx?$/.test(filePath) && code.includes('forwardRef');
    },
    transform(filePath, code) {
      // Clean forwardRef wrapper imports and wraps
      let cleaned = code
        .replace(/import\s+\{\s*[^}]*\bforwardRef\b[^}]*\}\s+from\s+['"]react['"];?/g, (match) => {
          const inner = match.slice(match.indexOf('{') + 1, match.indexOf('}'));
          const filtered = inner.split(',').map(s => s.trim()).filter(s => s !== 'forwardRef').join(', ');
          return filtered ? `import { ${filtered} } from 'react';` : '';
        });

      // Replace forwardRef((props, ref) => ...) with (props) => ...
      // where props contains ref.
      cleaned = cleaned.replace(/forwardRef\(\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)\s*=>/g, '($1) =>');
      cleaned = cleaned.replace(/forwardRef\(\s*function\s*[^(]*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, 'function ($1)');

      return cleaned;
    },
  },

  // 3. useFormState -> useActionState
  {
    id: 'use-action-state',
    name: 'useFormState to useActionState',
    description: 'Rename useFormState to useActionState in React 19',
    mode: 'react19',
    check(filePath, code) {
      return code.includes('useFormState');
    },
    transform(filePath, code) {
      return code
        .replace(/\buseFormState\b/g, 'useActionState')
        .replace(/import\s+\{\s*[^}]*\buseActionState\b[^}]*\}\s+from\s+['"]react-dom['"];?/g, (match) => {
          // React 19 moves useActionState to 'react'
          return `import { useActionState } from 'react';`;
        });
    },
  },

  // 4. remove defaultProps
  {
    id: 'remove-default-props',
    name: 'Remove defaultProps',
    description: 'defaultProps is deprecated in React 19. Use ES6 parameter defaults instead.',
    mode: 'react19',
    check(filePath, code) {
      return code.includes('.defaultProps') && !filePath.includes('node_modules');
    },
    transform(filePath, code) {
      // Replaces simple instances of Component.defaultProps = { ... } with a warning/removal hint
      // In a real transpiler, we destructure props in parameters.
      // We append a comment asking users to use ES6 defaults.
      return code.replace(/(\w+)\.defaultProps\s*=\s*\{([^}]+)\};?/g, (match, compName, inner) => {
        return `// TODO [ReactPilot]: Migrate defaultProps of ${compName} to ES6 parameter destructuring:\n// ${match}`;
      });
    },
  }
];
