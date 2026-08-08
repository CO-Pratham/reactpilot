import { describe, it, expect } from 'vitest';
import { proposeFix, batchAnalyze, generateOptimizationSuggestions } from '../index.js';

describe('AI Engine Module', () => {
  it('proposeFix returns structured AiResponse with mock engine when unconfigured', async () => {
    const code = `
      import React, { useState } from 'react';
      export function Sample() {
        return <button onClick={() => console.log('hi')}>Click</button>;
      }
    `;

    const res = await proposeFix({
      filePath: 'Sample.tsx',
      code,
      instructions: 'Fix performance issues',
      issues: [{ type: 'unused-import', line: 1, suggestion: 'Remove unused import' }],
    });

    expect(res).toHaveProperty('explanation');
    expect(res).toHaveProperty('patchedCode');
    expect(res).toHaveProperty('suggestions');
    expect(typeof res.explanation).toBe('string');
  });

  it('generateOptimizationSuggestions produces actionable tips', () => {
    const sample = `
      export function LargeComponent() {
        const items = [1,2,3];
        return <div>{items.map(i => <div>{i}</div>)}</div>;
      }
    `;
    const tips = generateOptimizationSuggestions(sample);
    expect(Array.isArray(tips)).toBe(true);
    expect(tips.some(t => t.includes('React.memo') || t.includes('key'))).toBe(true);
  });

  it('batchAnalyze processes multiple files cleanly', async () => {
    const files = [
      { path: 'A.tsx', code: 'export const A = () => <div>A</div>;' },
      { path: 'B.tsx', code: 'export const B = () => <div>B</div>;' },
    ];
    const results = await batchAnalyze(files);
    expect(results.size).toBe(2);
    expect(results.has('A.tsx')).toBe(true);
    expect(results.has('B.tsx')).toBe(true);
  });
});
