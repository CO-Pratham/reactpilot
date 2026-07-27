export type MigrationMode = 'react19' | 'nextjs';

export interface MigrationRule {
  id: string;
  name: string;
  description: string;
  mode: MigrationMode;
  /** Check if file needs changes */
  check(filePath: string, code: string): boolean;
  /** Apply transformation to code */
  transform(filePath: string, code: string): string;
}

export interface MigrationStep {
  ruleId: string;
  filePath: string;
  description: string;
  diffPreview?: string;
}

export interface MigrationPlan {
  mode: MigrationMode;
  steps: MigrationStep[];
  filesAffected: string[];
  totalSteps: number;
}

export interface MigrationResult {
  mode: MigrationMode;
  appliedSteps: { ruleId: string; filePath: string; success: boolean; error?: string }[];
  backupDir?: string;
  timestamp: string;
  reportMarkdown: string;
}
