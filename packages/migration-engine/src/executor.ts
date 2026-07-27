import fs from 'node:fs';
import path from 'node:path';
import type { MigrationPlan, MigrationResult, MigrationRule } from './types.js';
import { react19Rules } from './rules/react19.js';
import { nextjsRules } from './rules/nextjs.js';
import { createBackup } from './backup.js';
import { generateMarkdownReport } from './reporter.js';

export interface ExecuteOptions {
  backup?: boolean;
  dryRun?: boolean;
}

/**
 * Execute the migration plan.
 * Applies AST/Regex rules, creates backups, and compiles reports.
 */
export function executeMigration(
  projectRoot: string,
  plan: MigrationPlan,
  options: ExecuteOptions = {}
): MigrationResult {
  const rules = plan.mode === 'react19' ? react19Rules : nextjsRules;
  const rulesMap = new Map<string, MigrationRule>(rules.map((r) => [r.id, r]));

  const appliedSteps: MigrationResult['appliedSteps'] = [];
  const backupEnabled = options.backup !== false && !options.dryRun;

  // 1. Create Backup
  let backupDir: string | undefined;
  if (backupEnabled && plan.filesAffected.length > 0) {
    backupDir = createBackup(projectRoot, plan.filesAffected);
  }

  // 2. Apply transformations
  for (const step of plan.steps) {
    const rule = rulesMap.get(step.ruleId);
    if (!rule) continue;

    const absPath = path.resolve(projectRoot, step.filePath);
    try {
      const code = fs.readFileSync(absPath, 'utf-8');
      const transformed = rule.transform(step.filePath, code);

      if (!options.dryRun && transformed !== code) {
        fs.writeFileSync(absPath, transformed, 'utf-8');
      }

      appliedSteps.push({
        ruleId: step.ruleId,
        filePath: step.filePath,
        success: true,
      });
    } catch (err) {
      appliedSteps.push({
        ruleId: step.ruleId,
        filePath: step.filePath,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const result: MigrationResult = {
    mode: plan.mode,
    appliedSteps,
    backupDir,
    timestamp: new Date().toISOString(),
    reportMarkdown: '',
  };

  result.reportMarkdown = generateMarkdownReport(result, plan);

  return result;
}
