import {
  CheckCircle2,
  Command,
  Github,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CopyButton } from "../../../shared/components/ui/CopyButton";

const heroFeatures = [
  {
    title: "Official",
    description:
      "ReactPilot is maintained by the ReactPilot team and kept current with the latest AST and React best practices.",
    icon: Shield,
  },
  {
    title: "Predictable",
    description:
      "Designed to work with React’s component model, so rule feedback stays consistent across your repos and CI environments.",
    icon: CheckCircle2,
  },
  {
    title: "Encapsulated",
    description:
      "Provides APIs that let components talk to the analyzer without leaking implementation details into app code.",
    icon: Command,
  },
  {
    title: "Optimized",
    description:
      "Warns about expensive renders and deep JSX trees before they hit production, keeping performance budgets healthy.",
    icon: Zap,
  },
];

const otherTools = [
  {
    name: "ReactPilot Analyzer",
    description: "Rule-based inspections for components and hooks.",
  },
  {
    name: "ReactPilot Fixer",
    description: "AI-assisted patches for files the analyzer reports.",
  },
];

const installSteps = [
  { label: "npm", command: "npm i @reactpilot/cli" },
  { label: "yarn", command: "yarn add @reactpilot/cli" },
  { label: "pnpm", command: "pnpm add @reactpilot/cli" },
];

const quickCommands = [
  {
    title: "Scaffold a project",
    command: "npx create-reactpilot-app@latest MyAnalyses",
    detail: "Bootstrap a fresh workspace with sample rules and dashboards.",
  },
  {
    title: "Analyze an existing repo",
    command: "reactpilot analyze .",
    detail: "Runs every rule and prints a grouped summary.",
  },
  {
    title: "Target a single rule",
    command: "reactpilot analyze . --rule inline-function",
    detail: "Great for deep dives during refactors.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-indigo-600/10">
        <div className="mx-auto max-w-5xl px-6 py-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
            <Command size={14} />
            ReactPilot CLI
          </p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">
            Official React bindings for AI-assisted code health
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Keep React repos predictable, encapsulated, and optimized.
            ReactPilot pairs AST analysis with AI insights so every team member
            ships confidently.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500"
            >
              Open Dashboard
            </Link>
            <Link
              to="/docs"
              className="rounded-full border border-indigo-200 px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              View Docs
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-16 bg-white">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-5xl gap-6 px-6 py-12 md:grid-cols-4">
            {heroFeatures.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <Icon className="text-indigo-500" size={24} />
                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-slate-100/60 py-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 md:flex-row">
            <div className="flex-1 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                Install
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                Get started with the ReactPilot CLI
              </h2>
              <p className="text-sm text-slate-600">
                Install the CLI via your package manager (or use{" "}
                <code>npx @reactpilot/cli</code> when you need it). ReactPilot
                supports macOS, Windows, and Linux.
              </p>
              <div className="space-y-3">
                {installSteps.map((step) => (
                  <div
                    key={step.label}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {step.label}
                    </p>
                    <div className="relative mt-2">
                      <code className="block rounded-lg bg-slate-900 px-4 py-2 font-mono text-sm text-lime-200">
                        {step.command}
                      </code>
                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <CopyButton text={step.command} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Terminal size={18} />
                <p className="text-xs uppercase tracking-[0.3em]">Commands</p>
              </div>
              {quickCommands.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <div className="relative mt-2">
                    <code className="block rounded bg-slate-900 px-4 py-2 font-mono text-sm text-lime-200">
                      {item.command}
                    </code>
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <CopyButton text={item.command} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl space-y-6 px-6 py-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Other ReactPilot tools
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {otherTools.map((tool) => (
                <article
                  key={tool.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-left"
                >
                  <h3 className="text-base font-semibold text-slate-900">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {tool.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ReactPilot · CLI + Docs</p>
          <div className="flex gap-4">
            <a
              href="https://github.com/your-org/reactpilot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
            >
              <Github size={14} /> GitHub
            </a>
            <a
              href="mailto:hello@reactpilot.dev"
              className="text-slate-600 hover:text-slate-900"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
