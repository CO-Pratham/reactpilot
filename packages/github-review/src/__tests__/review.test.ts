import { describe, it, expect } from 'vitest';
import { parseDiff } from '../index.js';

const mockDiff = `diff --git a/src/App.tsx b/src/App.tsx
index 1234567..89abcdf 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,5 +1,6 @@
 import React from 'react';
+import { Button } from './Button';
 
 export function App() {
-  return <div>Hello</div>;
+  return <Button>Hello</Button>;
 }
`;

describe('GitHub Review Diff Parser', () => {
  it('should parse unified git diff format correctly', () => {
    const files = parseDiff(mockDiff);
    expect(files.length).toBe(1);
    expect(files[0].filename).toBe('src/App.tsx');
    expect(files[0].addedLines).toContain('import { Button } from \'./Button\';');
    expect(files[0].removedLines).toContain('  return <div>Hello</div>;');
  });
});
