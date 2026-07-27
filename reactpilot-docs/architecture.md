# ReactPilot v1.0 System Architecture Overview

ReactPilot is a modular developer assistant for React applications, organized as a Turborepo monorepo.

## Monorepo Layout

The system is composed of the following packages and applications:

```
reactpilot/
├── apps/
│   ├── cli/             # @reactpilot/cli - Main Commander-based CLI executable
│   ├── vscode-extension/# VS Code extension interface integration
│   └── web/             # @reactpilot/web - Next.js 15 local developer dashboard
│
└── packages/
    ├── config/          # @reactpilot/config - jiti-based configuration loader
    ├── utils/           # @reactpilot/utils - Shared CLI visual theme elements
    ├── plugin-system/   # @reactpilot/plugin-system - Sandboxed loader and marketplace
    ├── github-review/   # @reactpilot/github-review - PR code reviews & diff analyzer
    ├── project-chat/    # @reactpilot/project-chat - AST indexer & semantic AI chat
    ├── graph-engine/    # @reactpilot/graph-engine - Dependency cycle & dead code grapher
    ├── migration-engine/# @reactpilot/migration-engine - React 19 / Next.js migrator
    ├── analyzer/        # @reactpilot/analyzer - AST scanner & core rules engine (existing)
    └── patcher/         # @reactpilot/patcher - Unified diff patcher library (existing)
```

## Core Workflows

```mermaid
graph TD
  User[CLI or Web Client] --> Config[@reactpilot/config]
  User --> Plugins[@reactpilot/plugin-system]
  User --> Review[@reactpilot/github-review]
  User --> Chat[@reactpilot/project-chat]
  User --> Graph[@reactpilot/graph-engine]
  User --> Migrate[@reactpilot/migration-engine]
```

## CLI Reference

- `reactpilot plugin <action>`: Search, install, uninstall, update, and inspect plugins.
- `reactpilot review`: Run code audits on local unstaged diffs or PRs in GitHub Action workflows.
- `reactpilot ask`: Query project files using AST and vector-space embeddings.
- `reactpilot graph`: Build interactive graphs, cycle maps, and dead code diagrams.
- `reactpilot migrate <mode>`: Run React 19 or Next.js App Router upgrade plans.
