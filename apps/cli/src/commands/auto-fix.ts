import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { analyzeProject } from '@reactpilot/analyzer';
import { proposeFix } from '@reactpilot/ai-engine';
import { applyPatchToCode } from '@reactpilot/patcher';
import { isFeatureEnabled } from '@reactpilot/config';

export async function runAutoFix(target: string, options: { rule?: string[] }) {
  if (!isFeatureEnabled('ai-fix')) {
    console.error('The "ai-fix" feature is not enabled.\nRun: reactpilot features -> select "AI Fix Engine" to enable it.');
    process.exit(1);
  }
  const targetPath = path.resolve(process.cwd(), target);
  const spinner = ora(`Analyzing ${target}...`).start();

  try {
    // 1. Analyze the project to find issues
    const report = analyzeProject(targetPath, {
      rules: options.rule
    });

    if (report.issues.length === 0) {
      spinner.succeed('No issues found to fix.');
      return;
    }

    spinner.info(`Found ${report.issues.length} issues. Starting auto-fix...`);

    let fixedCount = 0;
    let failedCount = 0;

    // Group issues by file to minimize file reads/writes
    const issuesByFile = new Map<string, typeof report.issues>();
    for (const issue of report.issues) {
      const fileIssues = issuesByFile.get(issue.file) || [];
      fileIssues.push(issue);
      issuesByFile.set(issue.file, fileIssues);
    }

    for (const [filePath, issues] of issuesByFile) {
      const fileSpinner = ora(`Fixing ${path.relative(process.cwd(), filePath)}`).start();
      
      try {
        const code = fs.readFileSync(filePath, 'utf-8');
        
        // We'll try to fix all issues in the file at once using the AI engine's batch capability
        // or by passing all issues to proposeFix
        const aiResponse = await proposeFix({
          filePath,
          code,
          instructions: 'Fix the detected issues automatically.',
          issues: issues.map(i => ({
            type: i.type,
            line: i.line,
            suggestion: i.suggestion
          }))
        });

        // Apply the patch
        const result = applyPatchToCode({
          filePath,
          originalCode: code,
          patchedCode: aiResponse.patchedCode
        });

        if (result.applied) {
          fs.writeFileSync(filePath, aiResponse.patchedCode);
          fileSpinner.succeed();
          fixedCount += issues.length; // Assuming all were fixed if patch applied
        } else {
          fileSpinner.warn('Could not apply fix automatically');
          failedCount += issues.length;
        }
      } catch (err) {
        fileSpinner.fail(`Error fixing file: ${err}`);
        failedCount += issues.length;
      }
    }

    console.log('\n' + chalk.bold('Auto-fix Summary:'));
    console.log(chalk.green(`✔ Fixed: ${fixedCount}`));
    if (failedCount > 0) {
      console.log(chalk.red(`✖ Failed: ${failedCount}`));
    }

  } catch (error) {
    spinner.fail('Auto-fix process failed');
    console.error(error);
    process.exit(1);
  }
}
