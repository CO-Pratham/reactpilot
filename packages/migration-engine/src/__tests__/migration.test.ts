import { describe, it, expect } from 'vitest';
import { react19Rules, nextjsRules } from '../index.js';

describe('Migration Assistant Rules', () => {
  it('should transform Context.Provider tags to Context tags', () => {
    const rule = react19Rules.find((r) => r.id === 'context-no-provider')!;
    const input = '<MyContext.Provider value={value}><Child /></MyContext.Provider>';
    const output = rule.transform('src/App.tsx', input);
    expect(output).toBe('<MyContext value={value}><Child /></MyContext>');
  });

  it('should replace forwardRef wrappers', () => {
    const rule = react19Rules.find((r) => r.id === 'ref-as-prop')!;
    const input = 'const MyComponent = forwardRef((props, ref) => <div ref={ref} />);';
    const output = rule.transform('src/App.tsx', input);
    expect(output).toBe('const MyComponent = (props) => <div ref={ref} />);');
  });

  it('should rename legacy next/image paths', () => {
    const rule = nextjsRules.find((r) => r.id === 'next-legacy-image')!;
    const input = 'import Image from "next/legacy/image";';
    const output = rule.transform('src/App.tsx', input);
    expect(output).toBe("import Image from 'next/image';");
  });
});
