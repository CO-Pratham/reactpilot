import fs from "node:fs";
import path from "node:path";
import ora, { Ora } from "ora";
import chalk from "chalk";
import { analyzeProject, getRuleNames } from "@reactpilot/analyzer";

interface AnalyzeOptions {
  rule?: string[] | string;
}

export async function runAnalyze(
  targetDir: string,
  options: AnalyzeOptions = {}
) {
  let spinner: Ora | undefined;
  try {
    const projectPath = resolveProjectPath(targetDir);
    const selectedRules = await resolveRuleSelection(options.rule);

    spinner = ora(
      `Analyzing project at ${targetDir} with rules: ${selectedRules.join(
        ", "
      )}`
    ).start();

    const report = analyzeProject(projectPath, { rules: selectedRules });
    spinner.succeed("Analysis complete");
    printSummary(report, selectedRules);
  } catch (error) {
    if (spinner) {
      spinner.fail("Analysis failed");
    } else {
      ora().fail("Analysis failed");
    }
    throw error;
  }
}

async function resolveRuleSelection(
  ruleOption?: string[] | string
): Promise<string[]> {
  const available = getRuleNames();
  const explicit = resolveRulesFromOptions(ruleOption, available);
  if (explicit) {
    return explicit;
  }

  if (!process.stdout.isTTY || available.length <= 1) {
    return available;
  }

  const enquirerModule: any = await import("enquirer");
  const Select = enquirerModule.Select ?? enquirerModule.default?.Select;
  if (!Select) {
    throw new Error("Unable to load enquirer Select prompt.");
  }

  const selection = await new Select({
    name: "rule",
    message: "Select analyzer rule to run (choose 'all' to run every rule)",
    choices: [
      { name: "all", message: "All rules" },
      ...available.map((rule) => ({ name: rule, message: rule })),
    ],
  }).run();

  return selection === "all" ? available : [selection];
}

function resolveRulesFromOptions(
  ruleOption: string[] | string | undefined,
  available: string[]
): string[] | null {
  if (!ruleOption || (Array.isArray(ruleOption) && ruleOption.length === 0)) {
    return null;
  }

  const requested = Array.isArray(ruleOption) ? ruleOption : [ruleOption];
  const normalized = requested
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  const valid = normalized.filter((rule) => available.includes(rule));
  if (valid.length === 0) {
    console.warn(
      chalk.yellow(
        "No matching rules found for the provided filter. Running all rules instead."
      )
    );
    return available;
  }

  return Array.from(new Set(valid));
}

function resolveProjectPath(targetDir: string): string {
  const visited = new Set<string>();
  let current = process.cwd();

  while (true) {
    const candidate = path.resolve(current, targetDir);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    visited.add(candidate);
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error(
    `Cannot locate '${targetDir}'. Checked paths: ${[...visited].join(", ")}`
  );
}

const RULE_TYPE_MAP: Record<string, string[]> = {
  "unused-import": ["unused-import"],
  "heavy-component": ["heavy-component"],
  "invalid-hook": ["invalid-hook"],
  "inline-function": ["inline-function", "inline-function-jsx"],
  "deep-jsx": ["deep-jsx", "deep-jsx-nesting"],
  "unused-state": ["unused-state"],
  "expensive-render": ["expensive-render", "expensive-render-call"],
};

function printSummary(
  report: {
    filesScanned: number;
    componentsScanned: number;
    summary: { errors: number; warnings: number; info: number };
    issues: Array<{
      file: string;
      line: number;
      type: string;
      severity: string;
      suggestion: string;
    }>;
  },
  selectedRules: string[]
) {
  const { filesScanned, componentsScanned, summary, issues } = report;

  console.log(chalk.bold("\nScan Summary"));
  console.log(
    [
      `Files: ${chalk.cyan(filesScanned)}`,
      `Components: ${chalk.cyan(componentsScanned)}`,
      `Issues: ${chalk.red(summary.errors)} errors, ${chalk.yellow(
        summary.warnings
      )} warnings, ${chalk.blue(summary.info)} info`,
    ].join(" | ")
  );

  console.log(chalk.bold("\nRules executed:"));
  selectedRules.forEach((rule) => {
    const matchTypes = RULE_TYPE_MAP[rule] ?? [rule];
    const count = issues.filter((issue) =>
      matchTypes.includes(issue.type)
    ).length;
    const status =
      count > 0
        ? chalk.yellow(`${count} issue${count === 1 ? "" : "s"}`)
        : chalk.green("0 issues");
    console.log(`- ${rule}: ${status}`);
  });

  if (issues.length === 0) {
    console.log(
      chalk.green("\n✔ No issues detected for the selected rule(s).")
    );
    return;
  }

  console.log(chalk.bold("\nIssues by file:"));
  const issuesByFile = issues.reduce<Record<string, typeof issues>>(
    (acc, issue) => {
      acc[issue.file] = acc[issue.file] || [];
      acc[issue.file].push(issue);
      return acc;
    },
    {}
  );

  Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
    console.log(chalk.cyan(`\n${file}`));
    fileIssues.forEach((issue) => {
      const severityColor =
        issue.severity === "error"
          ? chalk.red
          : issue.severity === "warning"
          ? chalk.yellow
          : chalk.blue;

      console.log(
        `  ${chalk.gray(`L${issue.line}`)} ${severityColor(issue.type)} - ${
          issue.suggestion
        }`
      );
    });
  });
}
