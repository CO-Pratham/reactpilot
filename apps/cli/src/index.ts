import { Command } from "commander";
import dotenv from "dotenv";
import packageJson from "../package.json" with { type: "json" };
import { runAnalyze } from "./commands/analyze.js";
import { runFix } from "./commands/fix.js";

// Load environment variables from root .env if present
dotenv.config({ path: "../../.env" });
dotenv.config(); // Also try default location
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

program.parse(process.argv);

