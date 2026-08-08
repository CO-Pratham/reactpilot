import { Command } from "commander";
import dotenv from "dotenv";
import packageJson from "../package.json" with { type: "json" };
import { runAnalyze } from "./commands/analyze.js";
import { runFix } from "./commands/fix.js";

// Load environment variables silently
dotenv.config({ path: "../../.env", quiet: true });
dotenv.config({ quiet: true });
import { runOptimize } from "./commands/optimize.js";
import { runGenerate } from "./commands/generate.js";
import { runRefactor } from "./commands/refactor.js";

const program = new Command();
program
  .name("reactpilot")
  .description("AI-powered React assistant CLI")
  .version(packageJson.version);

program
  .command("analyze [target]")
  .alias("analyzer")
  .alias("anazlyer")
  .description("Scan a React project for issues")
  .option(
    "-r, --rule <name...>",
    "Run only the specified rule(s). Defaults to all rules."
  )
  .action((target = ".", options) => runAnalyze(target, options));

program
  .command("fix <file>")
  .description("Auto-fix a specific file using the AI engine")
  .action((file) => runFix(file));

program
  .command("optimize [target]")
  .description("Run performance optimizations")
  .action((target = ".") => runOptimize(target));

program
  .command("generate <type> <name>")
  .description("Generate React primitives (component, hook, etc.)")
  .action((type, name) => runGenerate(type, name));

program
  .command("refactor <file>")
  .description("Run refactor suggestions for a file")
  .action((file) => runRefactor(file));

import { getRuleNames } from "@reactpilot/analyzer";

program
  .command("auto-fix [target]")
  .description("Automatically fix issues in the project")
  .option("-r, --rule <name...>", "Run only the specified rule(s)")
  .action((target = ".", options) => {
    const rules = getRuleNames();
    if (rules.includes(target)) {
      options.rule = [target];
      target = ".";
    }
    import("./commands/auto-fix.js").then(m => m.runAutoFix(target, options));
  });

// === NEW COMMANDS (ReactPilot v1.0) ===
import { runPlugin }  from './commands/plugin.js';
import { runReview }  from './commands/review.js';
import { runAsk }     from './commands/ask.js';
import { runGraph }   from './commands/graph.js';
import { runMigrate } from './commands/migrate.js';
import { runDashboard } from './commands/dashboard.js';
import { runFeatures } from './commands/features.js';
import { readFeatureStore } from '@reactpilot/config';

program
  .command('features')
  .description('Configure or install ReactPilot features on demand')
  .option('--reset', 'Force re-run interactive feature selector')
  .option('--all', 'Enable all features non-interactively (CI mode)')
  .option('--none', 'Disable optional features non-interactively (CI mode)')
  .action((opts) => runFeatures(opts));

program
  .command('plugin <action> [name]')
  .description('Manage ReactPilot plugins (search|install|remove|list|update|info)')
  .option('--local <path>', 'Install from local directory')
  .action((action, name, opts) => runPlugin(action, name, opts));

program
  .command('review [target]')
  .description('Review a GitHub PR or local diff')
  .option('--github-action', 'Running inside GitHub Actions')
  .option('--output <path>', 'Write report to file')
  .action((target = '.', opts) => runReview(target, opts));

program
  .command('ask [question]')
  .description('Chat with your React project using AI')
  .option('--index', 'Force re-index the project')
  .option('--no-stream', 'Disable streaming output')
  .action((question, opts) => runAsk(question, opts));

program
  .command('graph [target]')
  .description('Generate an interactive architecture graph')
  .option('--output <path>', 'Output file path (default: ./reactpilot-graph.html)')
  .option('--format <fmt>', 'html | svg | png | json (default: html)')
  .option('--open', 'Open in browser after generation')
  .option('--theme <t>', 'dark | light (default: dark)')
  .option('--filter <f>', 'component,hook,context,route,unused,circular')
  .action((target = '.', opts) => runGraph(target, opts));

program
  .command('migrate <mode> [target]')
  .description('Migrate project (react19 | nextjs | rollback | status)')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--no-backup', 'Skip creating a backup')
  .option('--report <path>', 'Write markdown report to file')
  .action((mode, target = '.', opts) => runMigrate(mode, target, opts));

program
  .command('dashboard')
  .alias('web')
  .description('Launch the local Developer Center dashboard')
  .option('-p, --port <number>', 'Port to run the dashboard server on', '3000')
  .action((opts) => runDashboard(opts));
// === END NEW COMMANDS ===

import { printBoxCallout, colors } from '@reactpilot/utils/ui';

async function main() {
  const firstArg = process.argv[2];
  const isHelpOrVersion = !firstArg || firstArg === '--help' || firstArg === '-h' || firstArg === '--version' || firstArg === '-v';
  const isFeatureCmd = firstArg === 'features' || firstArg === 'feature' || firstArg === 'fetures' || firstArg === 'fetrues';

  if (isHelpOrVersion) {
    printBoxCallout(
      `⚡ REACTPILOT CLI v${packageJson.version} — AI-Powered React Assistant`,
      [
        `${colors.bold('👉 First Command:')}  reactpilot features`,
        `${colors.bold('✨ Pro Plan:')}       reactpilot dashboard → Click "Join Pro Waitlist"`,
        `${colors.bold('📚 Documentation:')}  https://co-pratham.github.io/reactpilot-docs/`
      ]
    );
  }

  // First-run auto-prompt if unconfigured and in interactive terminal
  if (!readFeatureStore() && !isHelpOrVersion && !isFeatureCmd && process.stdin.isTTY) {
    printBoxCallout(
      `👋 WELCOME TO REACTPILOT CLI v${packageJson.version}`,
      [
        'Let\'s set up your features first!',
        `${colors.bold('✨ Pro Plan:')}   reactpilot dashboard → "Join Pro Waitlist"`
      ]
    );
    await runFeatures();
    console.log('');
  }

  program.parse(process.argv);
}

main();


