import path from 'node:path';
import fs from 'node:fs';
import {
  detectProjectVersions,
  buildMigrationPlan,
  executeMigration,
  rollbackLatestBackup,
} from '@reactpilot/migration-engine';
import { saveRun } from '@reactpilot/github-review';
import { loadConfig, isFeatureEnabled } from '@reactpilot/config';
import {
  withSpinner,
  printSection,
  printSuccess,
  printWarning,
  printInfo,
  colors,
} from '@reactpilot/utils/ui';

interface MigrateOptions {
  dryRun?: boolean;
  backup?: boolean;
  report?: string;
}

/**
 * CLI command runner for `reactpilot migrate <mode> [target]`
 */
export async function runMigrate(
  mode: string,
  targetDir: string = '.',
  options: MigrateOptions = {}
): Promise<void> {
  if (!isFeatureEnabled('migration')) {
    console.error(colors.error('The "migration" feature is not enabled.\nRun: reactpilot features -> select "Migration Engine" to enable it.'));
    process.exit(1);
  }
  printSection('ReactPilot Migration Assistant');

  const cwd = path.resolve(targetDir);
  const { config } = await loadConfig(cwd);

  const isDryRun = options.dryRun ?? config.migration.dryRun ?? false;
  const isBackup = options.backup ?? config.migration.backup ?? true;

  // 1. Handle Special modes: rollback / status
  if (mode === 'rollback') {
    try {
      const restored = await withSpinner(
        'Rolling back latest migration changes...',
        async () => rollbackLatestBackup(cwd, config.migration.backupDir),
        'Rollback successful'
      );
      printSuccess(`Restored ${restored.length} files from backup.`);
    } catch (err) {
      console.error(colors.error(`Rollback failed: ${err instanceof Error ? err.message : String(err)}`));
    }
    return;
  }

  if (mode === 'status') {
    const versions = detectProjectVersions(cwd);
    console.log(`React Version: ${colors.cyan(versions.react)} (Needs upgrade? ${versions.isReact19 ? colors.success('No') : colors.warning('Yes')})`);
    if (versions.next) {
      console.log(`Next.js Version: ${colors.cyan(versions.next)} (Needs upgrade? ${versions.isNext15 ? colors.success('No') : colors.warning('Yes')})`);
    }

    saveRun({
      type: 'migrate',
      title: 'Migration Status',
      projectPath: cwd,
      summary: {
        react: versions.react,
        next: versions.next,
        isReact19: versions.isReact19,
        isNext15: versions.isNext15,
      },
    });
    printInfo('Migration status saved. Refresh the Developer Center dashboard to view it.');
    return;
  }

  if (mode !== 'react19' && mode !== 'nextjs') {
    console.error(colors.error(`Invalid mode: "${mode}". Choose react19, nextjs, rollback, or status.`));
    process.exit(1);
  }

  // 2. Build Migration Plan
  const plan = await withSpinner(
    `Analyzing codebase and planning ${mode} upgrades...`,
    async () => buildMigrationPlan(cwd, mode),
    'Upgrade plan generated'
  );

  if (plan.totalSteps === 0) {
    printSuccess('No migration steps needed. Your project is already up-to-date!');
    return;
  }

  printInfo(`Plan includes ${plan.totalSteps} changes across ${plan.filesAffected.length} files.`);
  if (isDryRun) {
    printInfo('Dry-run enabled. No files will be modified.');
  }

  // 3. Execute Migration
  const result = await withSpinner(
    isDryRun ? 'Simulating upgrades...' : 'Applying upgrades...',
    async () => executeMigration(cwd, plan, { backup: isBackup, dryRun: isDryRun }),
    isDryRun ? 'Simulation complete' : 'Migration applied successfully'
  );

  console.log('\n' + result.reportMarkdown);

  // 4. Save Report
  const defaultReportPath = `./reactpilot-migration-${mode}.md`;
  const reportPath = path.resolve(options.report ?? defaultReportPath);
  fs.writeFileSync(reportPath, result.reportMarkdown, 'utf-8');
  printSuccess(`Migration report written to ${reportPath}`);
}
