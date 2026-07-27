import fs from 'node:fs';
import path from 'node:path';
import type { MigrationMode, MigrationPlan, MigrationStep, MigrationRule } from './types.js';
import { react19Rules } from './rules/react19.js';
import { nextjsRules } from './rules/nextjs.js';

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage', '.next'];

/**
 * Scan target directory and build an ordered checklist of all changes.
 */
export function buildMigrationPlan(
  projectRoot: string,
  mode: MigrationMode
): MigrationPlan {
  const files = collectFiles(projectRoot);
  const rules = mode === 'react19' ? react19Rules : nextjsRules;
  const steps: MigrationStep[] = [];
  const filesAffected = new Set<string>();

  for (const file of files) {
    const relativePath = path.relative(projectRoot, file);
    try {
      const code = fs.readFileSync(file, 'utf-8');

      for (const rule of rules) {
        if (rule.check(relativePath, code)) {
          steps.push({
            ruleId: rule.id,
            filePath: relativePath,
            description: rule.description,
          });
          filesAffected.add(relativePath);
        }
      }
    } catch { /* ignore unreadable files */ }
  }

  return {
    mode,
    steps,
    filesAffected: Array.from(filesAffected),
    totalSteps: steps.length,
  };
}

function collectFiles(dir: string, acc: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          collectFiles(fullPath, acc);
        }
      } else if (EXTENSIONS.includes(path.extname(entry.name))) {
        acc.push(fullPath);
      }
    }
  } catch { /* ignored */ }
  return acc;
}
