# ReactPilot

AI-powered React developer assistant with web dashboard, CLI, VSCode extension, and pluggable analysis/AI engines.

## Structure

- `apps/web-dashboard` – Vite + React + TS + Tailwind dashboard for uploading projects, reviewing analyses, and applying AI patches.
- `apps/cli` – Node-based CLI (`reactpilot`) to analyze, fix, optimize, refactor, and generate React code.
- `apps/vscode-extension` – VSCode extension surfacing inline diagnostics and one-click AI fixes.
- `packages/analyzer` – AST-driven project inspection utilities.
- `packages/ai-engine` – Prompt builders and LLM orchestration helpers.
- `packages/patcher` – Diff + AST safe patch application utilities.
- `packages/utils` – Shared helpers, schema validators, and logging.
- `server` – Express API for auth, project uploads, analysis requests, and patch workflows.
- `docs` – Specifications and architecture notes.
- `examples` – Sample React projects for testing ReactPilot features.

## Getting Started

```bash
npm install
npm run dev        # Runs turbo dev across workspaces
npm run build      # Builds all packages/apps
```

See per-package READMEs for more details.
