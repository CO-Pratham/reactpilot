import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { analyzeProject } from '@reactpilot/analyzer';
import { generateOptimizationSuggestions } from '@reactpilot/ai-engine';

export async function runOptimize(targetDir: string) {
  const spinner = ora(`Optimizing project at ${targetDir}`).start();
  
  try {
    const projectPath = path.resolve(process.cwd(), targetDir);
    
    // 1. Analyze project
    spinner.text = 'Analyzing project...';
    const report = analyzeProject(projectPath);
    
    let fixedCount = 0;
    const suggestions: string[] = [];

    // 2. Auto-fix unused imports
    spinner.text = 'Removing unused imports...';
    const unusedImports = report.issues.filter(i => i.type === 'unused-import');
    
    for (const issue of unusedImports) {
      try {
        const fileContent = fs.readFileSync(issue.file, 'utf-8');
        const lines = fileContent.split('\n');
        // Simple removal of the line (this is a naive implementation, AST removal would be better)
        // But for this CLI, we'll just comment it out or remove if it's a clear single-line import
        if (lines[issue.line - 1].includes('import')) {
            lines.splice(issue.line - 1, 1);
            fs.writeFileSync(issue.file, lines.join('\n'));
            fixedCount++;
        }
      } catch (err) {
        // Ignore read/write errors
      }
    }

    // 3. Generate optimization suggestions for heavy components
    spinner.text = 'Generating optimization suggestions...';
    const heavyComponents = report.issues.filter(i => i.type === 'heavy-component');
    heavyComponents.forEach(issue => {
        suggestions.push(`${chalk.yellow('Heavy Component')}: ${path.relative(process.cwd(), issue.file)} (Line ${issue.line}) - ${issue.suggestion}`);
    });

    // 4. Check for re-render risks
    const reRenderRisks = report.issues.filter(i => i.type === 're-render-risk');
    reRenderRisks.forEach(issue => {
        suggestions.push(`${chalk.red('Re-render Risk')}: ${path.relative(process.cwd(), issue.file)} (Line ${issue.line}) - ${issue.suggestion}`);
    });

    spinner.succeed(`Optimization complete. Removed ${fixedCount} unused imports.`);
    
    if (suggestions.length > 0) {
      console.log('\n' + chalk.bold('Optimization Suggestions:'));
      suggestions.forEach(s => console.log(`- ${s}`));
    }

  } catch (error) {
    spinner.fail('Optimization failed');
    console.error(error);
  }
}


