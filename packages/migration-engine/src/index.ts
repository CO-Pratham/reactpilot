// Public API for @reactpilot/migration-engine
export type {
  MigrationMode,
  MigrationRule,
  MigrationStep,
  MigrationPlan,
  MigrationResult,
} from './types.js';

export { detectProjectVersions } from './detector.js';
export type { ProjectVersions } from './detector.js';
export { buildMigrationPlan } from './planner.js';
export { executeMigration } from './executor.js';
export { createBackup } from './backup.js';
export { rollbackLatestBackup } from './rollback.js';
export { generateMarkdownReport } from './reporter.js';
export { react19Rules } from './rules/react19.js';
export { nextjsRules } from './rules/nextjs.js';
export type { ExecuteOptions } from './executor.js';
