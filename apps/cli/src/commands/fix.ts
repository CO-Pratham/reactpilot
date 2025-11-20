import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import { proposeFix } from '@reactpilot/ai-engine';
import { applyPatchToCode } from '@reactpilot/patcher';

export async function runFix(targetFile: string) {
  const filePath = path.resolve(process.cwd(), targetFile);
  const spinner = ora(`Generating AI fix for ${targetFile}`).start();
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    const aiResponse = await proposeFix({
      filePath,
      code,
      instructions: 'Identify issues and propose improvements.'
    });
    const result = applyPatchToCode({
      filePath,
      originalCode: code,
      patchedCode: aiResponse.patchedCode
    });
    if (result.applied) {
      fs.writeFileSync(filePath, aiResponse.patchedCode);
      spinner.succeed('Patch applied successfully');
    } else {
      spinner.warn('Patch could not be auto-applied. Showing preview:');
      console.log(aiResponse.patchedCode);
    }
  } catch (error) {
    spinner.fail('Fix failed');
    throw error;
  }
}

