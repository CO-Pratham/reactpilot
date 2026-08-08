import { describe, it, expect } from 'vitest';
import { analyzeProject, getRuleNames, hasReactComponent } from '../index.js';
import path from 'node:path';

describe('Analyzer Module', () => {
  it('returns valid rule names array', () => {
    const rules = getRuleNames();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules).toContain('unused-import');
  });

  it('correctly detects React components via AST in hasReactComponent', () => {
    const componentCode = `
      import React from 'react';
      export function MyButton() {
        return <button>Click me</button>;
      }
    `;
    expect(hasReactComponent(componentCode)).toBe(true);

    const nonComponentCode = `
      export const CONSTANT_VALUE = 42;
      export function calculateSum(a: number, b: number) { return a + b; }
    `;
    expect(hasReactComponent(nonComponentCode)).toBe(false);
  });

  it('runs analyzeProject on empty directory cleanly', () => {
    const root = path.resolve(import.meta.dirname, '..');
    const report = analyzeProject(root);
    expect(report.performanceScore).toBeGreaterThanOrEqual(0);
    expect(report.performanceScore).toBeLessThanOrEqual(100);
    expect(typeof report.filesScanned).toBe('number');
    expect(typeof report.componentsScanned).toBe('number');
  });
});
