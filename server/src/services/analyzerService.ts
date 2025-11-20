import { analyzeProject } from '@reactpilot/analyzer';

export function runAnalyzer(targetPath: string) {
  return analyzeProject(targetPath);
}

