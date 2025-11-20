#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";

// src/commands/analyze.ts
import fs from "fs";
import path from "path";
import ora from "ora";
import chalk from "chalk";
import { analyzeProject, getRuleNames } from "@reactpilot/analyzer";
async function runAnalyze(targetDir, options = {}) {
  let spinner;
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
async function resolveRuleSelection(ruleOption) {
  const available = getRuleNames();
  const explicit = resolveRulesFromOptions(ruleOption, available);
  if (explicit) {
    return explicit;
  }
  if (!process.stdout.isTTY || available.length <= 1) {
    return available;
  }
  const enquirerModule = await import("enquirer");
  const Select = enquirerModule.Select ?? enquirerModule.default?.Select;
  if (!Select) {
    throw new Error("Unable to load enquirer Select prompt.");
  }
  const selection = await new Select({
    name: "rule",
    message: "Select analyzer rule to run (choose 'all' to run every rule)",
    choices: [
      { name: "all", message: "All rules" },
      ...available.map((rule) => ({ name: rule, message: rule }))
    ]
  }).run();
  return selection === "all" ? available : [selection];
}
function resolveRulesFromOptions(ruleOption, available) {
  if (!ruleOption || Array.isArray(ruleOption) && ruleOption.length === 0) {
    return null;
  }
  const requested = Array.isArray(ruleOption) ? ruleOption : [ruleOption];
  const normalized = requested.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
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
function resolveProjectPath(targetDir) {
  const visited = /* @__PURE__ */ new Set();
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
var RULE_TYPE_MAP = {
  "unused-import": ["unused-import"],
  "heavy-component": ["heavy-component"],
  "invalid-hook": ["invalid-hook"],
  "inline-function": ["inline-function", "inline-function-jsx"],
  "deep-jsx": ["deep-jsx", "deep-jsx-nesting"],
  "unused-state": ["unused-state"],
  "expensive-render": ["expensive-render", "expensive-render-call"]
};
function printSummary(report, selectedRules) {
  const { filesScanned, componentsScanned, summary, issues } = report;
  console.log(chalk.bold("\nScan Summary"));
  console.log(
    [
      `Files: ${chalk.cyan(filesScanned)}`,
      `Components: ${chalk.cyan(componentsScanned)}`,
      `Issues: ${chalk.red(summary.errors)} errors, ${chalk.yellow(
        summary.warnings
      )} warnings, ${chalk.blue(summary.info)} info`
    ].join(" | ")
  );
  console.log(chalk.bold("\nRules executed:"));
  selectedRules.forEach((rule) => {
    const matchTypes = RULE_TYPE_MAP[rule] ?? [rule];
    const count = issues.filter(
      (issue) => matchTypes.includes(issue.type)
    ).length;
    const status = count > 0 ? chalk.yellow(`${count} issue${count === 1 ? "" : "s"}`) : chalk.green("0 issues");
    console.log(`- ${rule}: ${status}`);
  });
  if (issues.length === 0) {
    console.log(
      chalk.green("\n\u2714 No issues detected for the selected rule(s).")
    );
    return;
  }
  console.log(chalk.bold("\nIssues by file:"));
  const issuesByFile = issues.reduce(
    (acc, issue) => {
      acc[issue.file] = acc[issue.file] || [];
      acc[issue.file].push(issue);
      return acc;
    },
    {}
  );
  Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
    console.log(chalk.cyan(`
${file}`));
    fileIssues.forEach((issue) => {
      const severityColor = issue.severity === "error" ? chalk.red : issue.severity === "warning" ? chalk.yellow : chalk.blue;
      console.log(
        `  ${chalk.gray(`L${issue.line}`)} ${severityColor(issue.type)} - ${issue.suggestion}`
      );
    });
  });
}

// src/commands/fix.ts
import fs2 from "fs";
import path2 from "path";
import ora2 from "ora";
import { proposeFix } from "@reactpilot/ai-engine";
import { applyPatchToCode } from "@reactpilot/patcher";
async function runFix(targetFile) {
  const filePath = path2.resolve(process.cwd(), targetFile);
  const spinner = ora2(`Generating AI fix for ${targetFile}`).start();
  try {
    const code = fs2.readFileSync(filePath, "utf-8");
    const aiResponse = await proposeFix({
      filePath,
      code,
      instructions: "Identify issues and propose improvements."
    });
    const result = applyPatchToCode({
      filePath,
      originalCode: code,
      patchedCode: aiResponse.patchedCode
    });
    if (result.applied) {
      fs2.writeFileSync(filePath, aiResponse.patchedCode);
      spinner.succeed("Patch applied successfully");
    } else {
      spinner.warn("Patch could not be auto-applied. Showing preview:");
      console.log(aiResponse.patchedCode);
    }
  } catch (error) {
    spinner.fail("Fix failed");
    throw error;
  }
}

// src/commands/optimize.ts
import fs3 from "fs";
import path3 from "path";
import ora3 from "ora";
import chalk2 from "chalk";
import { analyzeProject as analyzeProject2 } from "@reactpilot/analyzer";
async function runOptimize(targetDir) {
  const spinner = ora3(`Optimizing project at ${targetDir}`).start();
  try {
    const projectPath = path3.resolve(process.cwd(), targetDir);
    spinner.text = "Analyzing project...";
    const report = analyzeProject2(projectPath);
    let fixedCount = 0;
    const suggestions = [];
    spinner.text = "Removing unused imports...";
    const unusedImports = report.issues.filter((i) => i.type === "unused-import");
    for (const issue of unusedImports) {
      try {
        const fileContent = fs3.readFileSync(issue.file, "utf-8");
        const lines = fileContent.split("\n");
        if (lines[issue.line - 1].includes("import")) {
          lines.splice(issue.line - 1, 1);
          fs3.writeFileSync(issue.file, lines.join("\n"));
          fixedCount++;
        }
      } catch (err) {
      }
    }
    spinner.text = "Generating optimization suggestions...";
    const heavyComponents = report.issues.filter((i) => i.type === "heavy-component");
    heavyComponents.forEach((issue) => {
      suggestions.push(`${chalk2.yellow("Heavy Component")}: ${path3.relative(process.cwd(), issue.file)} (Line ${issue.line}) - ${issue.suggestion}`);
    });
    const reRenderRisks = report.issues.filter((i) => i.type === "re-render-risk");
    reRenderRisks.forEach((issue) => {
      suggestions.push(`${chalk2.red("Re-render Risk")}: ${path3.relative(process.cwd(), issue.file)} (Line ${issue.line}) - ${issue.suggestion}`);
    });
    spinner.succeed(`Optimization complete. Removed ${fixedCount} unused imports.`);
    if (suggestions.length > 0) {
      console.log("\n" + chalk2.bold("Optimization Suggestions:"));
      suggestions.forEach((s) => console.log(`- ${s}`));
    }
  } catch (error) {
    spinner.fail("Optimization failed");
    console.error(error);
  }
}

// src/commands/generate.ts
import fs4 from "fs";
import path4 from "path";
import ora4 from "ora";
import chalk3 from "chalk";
async function runGenerate(type, name) {
  if (!["component", "hook", "context", "page", "layout"].includes(type)) {
    console.error(chalk3.red(`Invalid type: ${type}. Supported types: component, hook, context, page, layout`));
    process.exit(1);
  }
  const spinner = ora4(`Generating ${type} named ${name}`).start();
  try {
    const cwd = process.cwd();
    const srcDir = path4.join(cwd, "src");
    if (!fs4.existsSync(srcDir)) {
      fs4.mkdirSync(srcDir);
    }
    let targetDir = "";
    let fileName = "";
    let content = "";
    let testContent = "";
    let cssContent = "";
    switch (type) {
      case "component":
        targetDir = path4.join(srcDir, "components", name);
        fileName = `${name}.tsx`;
        content = generateComponentTemplate(name);
        testContent = generateTestTemplate(name);
        cssContent = generateCssTemplate(name);
        break;
      case "hook":
        targetDir = path4.join(srcDir, "hooks");
        fileName = `${name}.ts`;
        content = generateHookTemplate(name);
        break;
      case "context":
        targetDir = path4.join(srcDir, "contexts");
        fileName = `${name}Context.tsx`;
        content = generateContextTemplate(name);
        break;
      case "page":
        targetDir = path4.join(srcDir, "pages");
        fileName = `${name}Page.tsx`;
        content = generatePageTemplate(name);
        break;
      case "layout":
        targetDir = path4.join(srcDir, "layouts");
        fileName = `${name}Layout.tsx`;
        content = generateLayoutTemplate(name);
        break;
    }
    if (!fs4.existsSync(targetDir)) {
      fs4.mkdirSync(targetDir, { recursive: true });
    }
    const filePath = path4.join(targetDir, fileName);
    if (fs4.existsSync(filePath)) {
      spinner.fail(`File ${filePath} already exists`);
      return;
    }
    fs4.writeFileSync(filePath, content);
    if (testContent) {
      const testPath = path4.join(targetDir, `${name}.test.tsx`);
      fs4.writeFileSync(testPath, testContent);
    }
    if (cssContent) {
      const cssPath = path4.join(targetDir, `${name}.css`);
      fs4.writeFileSync(cssPath, cssContent);
    }
    spinner.succeed(`Generated ${type} ${chalk3.bold(name)} at ${targetDir}`);
  } catch (error) {
    spinner.fail(`Failed to generate ${type}`);
    console.error(error);
  }
}
function generateComponentTemplate(name) {
  return `import React from 'react';
import './${name}.css';

export interface ${name}Props {
  children?: React.ReactNode;
}

export const ${name}: React.FC<${name}Props> = ({ children }) => {
  return (
    <div className="${name.toLowerCase()}-container">
      <h1>${name}</h1>
      {children}
    </div>
  );
};
`;
}
function generateTestTemplate(name) {
  return `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders correctly', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });
});
`;
}
function generateCssTemplate(name) {
  return `.${name.toLowerCase()}-container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}
`;
}
function generateHookTemplate(name) {
  return `import { useState, useEffect } from 'react';

export function ${name}() {
  const [value, setValue] = useState(null);

  useEffect(() => {
    // TODO: Implement hook logic
  }, []);

  return value;
}
`;
}
function generateContextTemplate(name) {
  return `import React, { createContext, useContext, useState } from 'react';

interface ${name}ContextType {
  // TODO: Define context shape
}

const ${name}Context = createContext<${name}ContextType | undefined>(undefined);

export function ${name}Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(null);

  return (
    <${name}Context.Provider value={{}}>
      {children}
    </${name}Context.Provider>
  );
}

export function use${name}() {
  const context = useContext(${name}Context);
  if (context === undefined) {
    throw new Error('use${name} must be used within a ${name}Provider');
  }
  return context;
}
`;
}
function generatePageTemplate(name) {
  return `import React from 'react';

export const ${name}Page: React.FC = () => {
  return (
    <div className="page-container">
      <h1>${name} Page</h1>
    </div>
  );
};
`;
}
function generateLayoutTemplate(name) {
  return `import React from 'react';
import { Outlet } from 'react-router-dom';

export const ${name}Layout: React.FC = () => {
  return (
    <div className="layout-container">
      <header>Header</header>
      <main>
        <Outlet />
      </main>
      <footer>Footer</footer>
    </div>
  );
};
`;
}

// src/commands/refactor.ts
import fs5 from "fs";
import path5 from "path";
import ora5 from "ora";
import chalk4 from "chalk";
import { proposeFix as proposeFix2 } from "@reactpilot/ai-engine";
import { applyPatchToCode as applyPatchToCode2, createPatchPreview } from "@reactpilot/patcher";
async function runRefactor(targetFile) {
  const spinner = ora5(`Refactoring ${targetFile}`).start();
  try {
    const filePath = path5.resolve(process.cwd(), targetFile);
    if (!fs5.existsSync(filePath)) {
      spinner.fail(`File not found: ${filePath}`);
      return;
    }
    const code = fs5.readFileSync(filePath, "utf-8");
    spinner.text = "Analyzing and generating refactor suggestions...";
    const response = await proposeFix2({
      filePath,
      code,
      instructions: "Refactor this code to improve performance, readability, and follow React best practices."
    });
    spinner.text = "Applying changes...";
    const patchResult = applyPatchToCode2({
      filePath,
      originalCode: code,
      patchedCode: response.patchedCode
    });
    if (patchResult.applied) {
      fs5.writeFileSync(filePath, response.patchedCode);
      spinner.succeed(`Refactored ${targetFile}`);
      console.log("\n" + chalk4.bold("Changes applied:"));
      console.log(createPatchPreview({
        filePath,
        originalCode: code,
        patchedCode: response.patchedCode
      }));
      console.log("\n" + chalk4.bold("AI Explanation:"));
      console.log(response.explanation);
    } else {
      spinner.fail("Failed to apply refactor patch automatically");
      if (patchResult.diff) {
        console.log("\n" + chalk4.yellow("Diff that failed to apply:"));
        console.log(patchResult.diff);
      }
    }
  } catch (error) {
    spinner.fail("Refactor failed");
    console.error(error);
  }
}

// src/index.ts
var program = new Command();
program.name("reactpilot").description("AI-powered React assistant CLI").version("0.1.0");
program.command("analyze [target]").alias("analyzer").alias("anazlyer").description("Scan a React project for issues").option(
  "-r, --rule <name...>",
  "Run only the specified rule(s). Defaults to all rules."
).action((target = ".", options) => runAnalyze(target, options));
program.command("fix <file>").description("Auto-fix a specific file using the AI engine").action((file) => runFix(file));
program.command("optimize [target]").description("Run performance optimizations").action((target = ".") => runOptimize(target));
program.command("generate <type> <name>").description("Generate React primitives (component, hook, etc.)").action((type, name) => runGenerate(type, name));
program.command("refactor <file>").description("Run refactor suggestions for a file").action((file) => runRefactor(file));
program.parse(process.argv);
