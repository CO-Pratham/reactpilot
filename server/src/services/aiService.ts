import { proposeFix } from '@reactpilot/ai-engine';

export async function requestAiFix(filePath: string, code: string, instructions: string) {
  return proposeFix({ filePath, code, instructions });
}

