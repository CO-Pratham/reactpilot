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
  const oraFactory = getOraFactory();
  try {
    const projectPath = resolveProjectPath(targetDir);
    const selectedRules = await resolveRuleSelection(options.rule);

    spinner = oraFactory(
      `Analyzing project at ${targetDir} with rules: ${selectedRules.join(
        ", "
      )}`
    ).start();

    const report = analyzeProject(projectPath, { rules: selectedRules });
    spinner.succeed("Analysis complete");
    printSummary(report, selectedRules);
  } catch (error) {
    const isPromptAbort =
      typeof error === "object" &&
      error !== null &&
      "isTtyError" in error &&
      // enquirer sets either `isTtyError` or `isCancelled`
      // depending on how the prompt was exited
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (error.isTtyError || error.isCanceled || error.name === "AbortError");

    if (isPromptAbort) {
      // user intentionally closed the prompt, nothing to do
      oraFactory().info("Prompt cancelled, exiting without running rules.");
      return;
    }

    if (spinner) {
      spinner.fail("Analysis failed");
    } else {
      oraFactory().fail("Analysis failed");
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

  const prompt = new Select({
    name: "rule",
    message: "Select analyzer rule to run (choose 'all' to run every rule)",
    choices: [
      { name: "all", message: "All rules" },
      ...available.map((rule) => ({ name: rule, message: rule })),
    ],
  });

  return new Promise<string[]>((resolve) => {
    const finalize = (selection: string | null) => {
      if (!selection || selection === "all") {
        resolve(available);
      } else {
        resolve([selection]);
      }
    };

    prompt.once("cancel", () => finalize(null));

    prompt
      .run()
      .then((selection) => finalize(selection))
      .catch(() => finalize(null));
  });
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
      getChalkModule().yellow(
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

  const theme = getChalkModule();
  console.log(theme.bold("\nScan Summary"));
  console.log(
    [
      `Files: ${theme.cyan(filesScanned)}`,
      `Components: ${theme.cyan(componentsScanned)}`,
      `Issues: ${theme.red(summary.errors)} errors, ${theme.yellow(
        summary.warnings
      )} warnings, ${theme.blue(summary.info)} info`,
    ].join(" | ")
  );

  console.log(theme.bold("\nRules executed:"));
  selectedRules.forEach((rule) => {
    const matchTypes = RULE_TYPE_MAP[rule] ?? [rule];
    const count = issues.filter((issue) =>
      matchTypes.includes(issue.type)
    ).length;
    const status =
      count > 0
        ? theme.yellow(`${count} issue${count === 1 ? "" : "s"}`)
        : theme.green("0 issues");
    console.log(`- ${rule}: ${status}`);
  });

  if (issues.length === 0) {
    console.log(
      theme.green("\n✔ No issues detected for the selected rule(s).")
    );
    return;
  }

  console.log(theme.bold("\nIssues by file:"));
  const issuesByFile = issues.reduce<Record<string, typeof issues>>(
    (acc, issue) => {
      acc[issue.file] = acc[issue.file] || [];
      acc[issue.file].push(issue);
      return acc;
    },
    {}
  );

  Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
    console.log(theme.cyan(`\n${file}`));
    fileIssues.forEach((issue) => {
      const severityColor =
        issue.severity === "error"
          ? theme.red
          : issue.severity === "warning"
          ? theme.yellow
          : theme.blue;

      console.log(
        `  ${theme.gray(`L${issue.line}`)} ${severityColor(issue.type)} - ${
          issue.suggestion
        }`
      );
    });
  });
}

function getOraFactory(): (...args: Parameters<typeof ora>) => Ora {
  const candidate = (ora as unknown as { default?: typeof ora }).default ?? ora;
  if (typeof candidate !== "function") {
    throw new Error("Unable to load ora spinner.");
  }
  return candidate as typeof ora;
}

function getChalkModule(): typeof chalk {
  return ((chalk as unknown as { default?: typeof chalk }).default ??
    chalk) as typeof chalk;
}
