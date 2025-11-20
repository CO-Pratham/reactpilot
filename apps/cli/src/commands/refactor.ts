import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { proposeFix } from '@reactpilot/ai-engine';
import { applyPatchToCode, createPatchPreview } from '@reactpilot/patcher';

export async function runRefactor(targetFile: string) {
  const spinner = ora(`Refactoring ${targetFile}`).start();
  
  try {
    const filePath = path.resolve(process.cwd(), targetFile);
    if (!fs.existsSync(filePath)) {
      spinner.fail(`File not found: ${filePath}`);
      return;
    }

    const code = fs.readFileSync(filePath, 'utf-8');
    
    spinner.text = 'Analyzing and generating refactor suggestions...';
    const response = await proposeFix({
      filePath,
      code,
      instructions: 'Refactor this code to improve performance, readability, and follow React best practices.'
    });

    spinner.text = 'Applying changes...';
    const patchResult = applyPatchToCode({
      filePath,
      originalCode: code,
      patchedCode: response.patchedCode
    });

    if (patchResult.applied) {
      fs.writeFileSync(filePath, response.patchedCode);
      spinner.succeed(`Refactored ${targetFile}`);
      
      console.log('\n' + chalk.bold('Changes applied:'));
      console.log(createPatchPreview({
        filePath,
        originalCode: code,
        patchedCode: response.patchedCode
      }));

      console.log('\n' + chalk.bold('AI Explanation:'));
      console.log(response.explanation);
    } else {
      spinner.fail('Failed to apply refactor patch automatically');
      if (patchResult.diff) {
        console.log('\n' + chalk.yellow('Diff that failed to apply:'));
        console.log(patchResult.diff);
      }
    }

  } catch (error) {
    spinner.fail('Refactor failed');
    console.error(error);
  }
}


