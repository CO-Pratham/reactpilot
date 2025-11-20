# ReactPilot Architecture

## Overview

ReactPilot is an AI-enabled assistant spanning a CLI, VSCode extension, and web dashboard. It provides static/project analysis, AI generated fixes, safe patch application, and telemetry surfaced via a web UI.

## Packages

- `@reactpilot/analyzer`: AST-powered scanner discovering React anti-patterns.
- `@reactpilot/ai-engine`: Prompt builders + LLM client wrappers.
- `@reactpilot/patcher`: Diff helpers that preview/apply code changes.
- `@reactpilot/utils`: Shared schemas, date helpers, and logging primitives.

## Apps

- `apps/web-dashboard`: Upload projects, review issues, accept/reject patches, and monitor metrics.
- `apps/cli`: Run `reactpilot analyze|fix|optimize|generate|refactor`.
- `apps/vscode-extension`: Inline diagnostics, hover explanations, and quick patches.

## Server

Express API exposing:

- Auth (`/auth/login`, `/auth/register`)
- Project ingestion, analysis, fix, report, and patch endpoints under `/projects`.

## Data

PostgreSQL tables (future implementation):

- `users`, `projects`, `project_files`, `analysis_reports`, `ai_patches`.

