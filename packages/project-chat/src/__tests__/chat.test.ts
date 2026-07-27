import { describe, it, expect } from 'vitest';
import { indexFile } from '../index.js';

describe('Project Chat Indexer', () => {
  it('should parse JSX and identify React Component structures', () => {
    const code = `
      import React from 'react';
      export function MainHeader({ title }) {
        return <h1>{title}</h1>;
      }
    `;

    const result = indexFile('src/MainHeader.tsx', code, 'dummy-hash');
    expect(result.components.length).toBe(1);
    expect(result.components[0].name).toBe('MainHeader');
    expect(result.components[0].props).toContain('title');
  });

  it('should identify custom hooks', () => {
    const code = `
      export function useTheme() {
        return 'dark';
      }
    `;

    const result = indexFile('src/useTheme.ts', code, 'dummy-hash');
    expect(result.hooks.length).toBe(1);
    expect(result.hooks[0].name).toBe('useTheme');
  });
});
