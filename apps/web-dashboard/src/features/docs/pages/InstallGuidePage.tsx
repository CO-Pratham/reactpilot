import { CopyButton } from "../../../shared/components/ui/CopyButton";

const sections = [
  {
    id: "introduction",
    title: "Creating a ReactPilot Workflow",
    description:
      "ReactPilot ships as a CLI that audits any React repo with opinionated rules. Install it via npm/yarn/pnpm, run it inside your project, and review the structured summary.",
  },
  {
    id: "install",
    title: "Install the CLI",
    note: "ReactPilot supports macOS, Windows, and Linux. Node 18+ is required.",
    commands: [
      { label: "npm", value: "npm i @reactpilot/cli" },
      { label: "yarn", value: "yarn add @reactpilot/cli" },
      { label: "pnpm", value: "pnpm add @reactpilot/cli" },
    ],
  },
  {
    id: "analyze",
    title: "Analyze a Project",
    body: [
      "Run the analyzer in any React repository. By default all rules execute and produce a per-file summary.",
      "Use --rule to focus on a single rule or --format json (coming soon) to emit machine-readable output.",
    ],
    commands: [
      { label: "Full scan", value: "reactpilot analyze ." },
      {
        label: "Single rule",
        value: "reactpilot analyze . --rule inline-function",
      },
      {
        label: "Interactive picker",
        value: "reactpilot analyze ./apps/web-dashboard",
      },
    ],
  },
  {
    id: "rules",
    title: "Rules & Features",
    features: [
      {
        name: "unused-import",
        summary: "Detect stray imports and surface exact line numbers.",
      },
      {
        name: "inline-function",
        summary:
          "Flags inline handlers that cause re-renders inside JSX props.",
      },
      {
        name: "heavy-component",
        summary:
          "Warns when components exceed 80 lines so you can split logic early.",
      },
      {
        name: "invalid-hook",
        summary:
          "Catches hooks executed in loops, conditions, or nested callbacks.",
      },
      {
        name: "deep-jsx",
        summary:
          "Highlights JSX trees deeper than 5 levels to encourage composition.",
      },
      {
        name: "unused-state",
        summary: "Finds useState declarations that are never referenced.",
      },
    ],
  },
  {
    id: "faq",
    title: "How to Use Results",
    list: [
      "ReactPilot prints a summary grouped by file. Apply fixes manually or send files to the built-in fixer command (coming soon).",
      "Share CLI logs with your team or commit them to CI to block regressions.",
      "Pair the analyzer with the dashboard to visualize issues over time.",
    ],
  },
];

const navLinks = ["introduction", "install", "analyze", "rules", "faq"];

export function InstallGuidePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-12">
        <aside className="hidden w-64 flex-shrink-0 md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
            ReactPilot Docs
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            {navLinks.map((link) => (
              <li key={link}>
                <a
                  href={`#${link}`}
                  className="block rounded-lg px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {sections.find((section) => section.id === link)?.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1 space-y-10">
          <header className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
              Learn ReactPilot · Installation
            </p>
            <h1 className="text-4xl font-bold text-slate-900">
              Creating a ReactPilot Environment
            </h1>
            <p className="text-base text-slate-600">
              If you plan to analyze React apps regularly, start with the CLI.
              It works with any framework (Create React App, Next.js, Expo,
              Vite, Remix, Astro, etc.) because the analyzer only reads source
              files on disk.
            </p>
          </header>

          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {section.title}
                </h2>
                {section.description && (
                  <p className="text-sm text-slate-600">
                    {section.description}
                  </p>
                )}
                {section.note && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 text-sm text-indigo-600">
                    {section.note}
                  </div>
                )}
                {section.body?.map((paragraph) => (
                  <p key={paragraph} className="text-sm text-slate-600">
                    {paragraph}
                  </p>
                ))}
                {section.commands && (
                  <div className="space-y-4">
                    {section.commands.map((command) => (
                      <div key={command.value}>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                          {command.label}
                        </p>
                        <div className="relative mt-2">
                          <code className="block rounded-2xl bg-slate-900 px-4 py-3 font-mono text-sm text-lime-200">
                            {command.value}
                          </code>
                          <div className="absolute inset-y-0 right-2 flex items-center">
                            <CopyButton text={command.value} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {section.features && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {section.features.map((feature) => (
                      <article
                        key={feature.name}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {feature.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {feature.summary}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
                {section.list && (
                  <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
