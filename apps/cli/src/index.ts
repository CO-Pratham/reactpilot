import { Command } from "commander";
import dotenv from "dotenv";
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
  .version("0.1.0");

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

program.parse(process.argv);
