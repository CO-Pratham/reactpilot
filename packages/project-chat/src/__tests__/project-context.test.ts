import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveProjectRoot, getProjectContext } from '../project-context.js';

describe('resolveProjectRoot', () => {
  it('finds the host project when starting inside a ReactPilot internal app directory', () => {
    const repoRoot = path.resolve(process.cwd(), '../..');
    const webDir = path.join(repoRoot, 'apps', 'web');

    if (!fs.existsSync(webDir)) {
      return;
    }

    expect(resolveProjectRoot(webDir)).toBe(repoRoot);
  });

  it('respects REACTPILOT_PROJECT_ROOT when set', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reactpilot-root-'));
    const previous = process.env.REACTPILOT_PROJECT_ROOT;

    try {
      fs.writeFileSync(
        path.join(tmpRoot, 'package.json'),
        JSON.stringify({ name: 'demo-app', dependencies: { '@reactpilot/cli': '1.0.0' } })
      );
      process.env.REACTPILOT_PROJECT_ROOT = tmpRoot;
      expect(resolveProjectRoot('/some/other/path')).toBe(tmpRoot);
    } finally {
      if (previous === undefined) {
        delete process.env.REACTPILOT_PROJECT_ROOT;
      } else {
        process.env.REACTPILOT_PROJECT_ROOT = previous;
      }
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

describe('getProjectContext', () => {
  it('reads package metadata from the project root', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reactpilot-context-'));

    try {
      fs.writeFileSync(
        path.join(tmpRoot, 'package.json'),
        JSON.stringify({
          name: 'my-react-app',
          version: '2.0.0',
          description: 'A sample React app',
        })
      );

      const context = getProjectContext(tmpRoot);
      expect(context.name).toBe('my-react-app');
      expect(context.version).toBe('2.0.0');
      expect(context.description).toBe('A sample React app');
      expect(context.rootPath).toBe(tmpRoot);
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});
