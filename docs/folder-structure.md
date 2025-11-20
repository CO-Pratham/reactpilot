# ReactPilot - Folder Structure & Naming Conventions

## Overview

This document defines the complete folder structure and naming conventions for the ReactPilot monorepo.

## Root Structure

```
reactpilot/
├── apps/                    # Application packages
│   ├── web-dashboard/       # React web application
│   ├── cli/                 # Command-line interface
│   └── vscode-extension/    # VSCode extension
├── packages/                # Shared packages
│   ├── analyzer/            # AST analysis engine
│   ├── ai-engine/           # AI code generation
│   ├── patcher/             # Code patching utilities
│   └── utils/               # Shared utilities
├── server/                  # Express API server
├── docs/                    # Documentation
├── examples/                # Example projects
└── scripts/                 # Build/deployment scripts
```

---

## Apps Structure

### `apps/web-dashboard/` - React Web Dashboard

```
web-dashboard/
├── public/                  # Static assets
│   ├── favicon.ico
│   └── assets/
├── src/
│   ├── app/                 # App-level configuration
│   │   ├── App.tsx          # Root component
│   │   ├── App.css          # Global styles
│   │   └── router.tsx       # Route configuration
│   ├── features/            # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/  # Auth-specific components
│   │   │   ├── hooks/       # Auth hooks (useAuth, etc.)
│   │   │   ├── pages/       # Auth pages
│   │   │   ├── services/    # Auth API calls
│   │   │   ├── stores/      # Auth state (if feature-specific)
│   │   │   └── types.ts     # Auth types
│   │   ├── projects/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── stores/
│   │   │   └── types.ts
│   │   └── dashboard/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── pages/
│   │       └── types.ts
│   ├── shared/              # Shared across features
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Base UI components (Button, Input, etc.)
│   │   │   ├── layout/      # Layout components (Navbar, Sidebar, etc.)
│   │   │   └── common/      # Common components (CodeViewer, FileTree, etc.)
│   │   ├── hooks/           # Shared hooks
│   │   ├── stores/          # Global state stores
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   ├── constants/       # Constants
│   │   ├── types/           # Shared TypeScript types
│   │   └── config/          # Configuration
│   ├── assets/              # Images, fonts, etc.
│   ├── styles/              # Global styles
│   │   ├── index.css        # Main stylesheet
│   │   └── tailwind.css     # Tailwind imports
│   └── main.tsx             # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### `apps/cli/` - Command Line Interface

```
cli/
├── src/
│   ├── commands/            # CLI commands
│   │   ├── analyze.ts
│   │   ├── fix.ts
│   │   ├── generate.ts
│   │   ├── optimize.ts
│   │   └── refactor.ts
│   ├── utils/              # CLI utilities
│   │   ├── logger.ts
│   │   ├── spinner.ts
│   │   └── file-utils.ts
│   ├── config/              # CLI configuration
│   └── index.ts             # Entry point
├── package.json
└── tsconfig.json
```

### `apps/vscode-extension/` - VSCode Extension

```
vscode-extension/
├── src/
│   ├── extension.ts         # Main extension entry
│   ├── commands/            # VSCode commands
│   ├── providers/           # Language providers
│   ├── webview/             # Webview UI
│   └── utils/
├── package.json
└── tsconfig.json
```

---

## Server Structure

### `server/` - Express API Server

```
server/
├── src/
│   ├── app/                 # App configuration
│   │   ├── index.ts         # Server entry point
│   │   ├── express.ts       # Express app setup
│   │   └── middleware.ts    # Global middleware
│   ├── api/                 # API routes
│   │   ├── v1/              # API version 1
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── auth.controller.ts
│   │   │   └── projects/
│   │   │       ├── projects.routes.ts
│   │   │       └── projects.controller.ts
│   │   └── index.ts         # Route aggregator
│   ├── controllers/         # Request handlers (legacy, migrate to api/)
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── project.service.ts
│   │   ├── analyzer.service.ts
│   │   ├── ai.service.ts
│   │   └── patcher.service.ts
│   ├── models/              # Data models/schemas
│   │   ├── user.model.ts
│   │   ├── project.model.ts
│   │   └── index.ts
│   ├── db/                  # Database
│   │   ├── connection.ts    # DB connection
│   │   ├── migrations/      # DB migrations
│   │   └── seeds/           # Seed data
│   ├── middlewares/          # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── validators/          # Request validators
│   │   ├── auth.validator.ts
│   │   └── project.validator.ts
│   ├── types/               # TypeScript types
│   │   ├── express.d.ts     # Express type extensions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── helpers.ts
│   └── config/              # Configuration
│       ├── env.ts            # Environment variables
│       └── constants.ts
├── package.json
└── tsconfig.json
```

---

## Packages Structure

### `packages/analyzer/` - AST Analyzer

```
analyzer/
├── src/
│   ├── index.ts             # Barrel export
│   ├── lib/                 # Main implementation
│   │   ├── analyzer.ts      # Core analyzer
│   │   ├── parsers/         # AST parsers
│   │   │   ├── babel.parser.ts
│   │   │   └── typescript.parser.ts
│   │   ├── detectors/        # Issue detectors
│   │   │   ├── re-render.detector.ts
│   │   │   ├── hook-usage.detector.ts
│   │   │   └── performance.detector.ts
│   │   └── reporters/       # Report generators
│   │       └── json.reporter.ts
│   ├── types/               # Type definitions
│   │   ├── issue.types.ts
│   │   └── report.types.ts
│   ├── utils/               # Utilities
│   │   ├── file-utils.ts
│   │   └── ast-utils.ts
│   └── constants/           # Constants
│       └── rules.ts
├── package.json
└── tsconfig.json
```

### `packages/ai-engine/` - AI Code Generator

```
ai-engine/
├── src/
│   ├── index.ts             # Barrel export
│   ├── lib/
│   │   ├── ai-client.ts     # LLM client wrapper
│   │   ├── prompt-builder.ts # Prompt construction
│   │   └── generators/      # Code generators
│   │       ├── component.generator.ts
│   │       ├── hook.generator.ts
│   │       └── fix.generator.ts
│   ├── types/
│   │   └── ai.types.ts
│   ├── utils/
│   │   └── prompt-utils.ts
│   └── constants/
│       └── prompts.ts
├── package.json
└── tsconfig.json
```

### `packages/patcher/` - Code Patcher

```
patcher/
├── src/
│   ├── index.ts             # Barrel export
│   ├── lib/
│   │   ├── patcher.ts       # Core patcher
│   │   ├── diff-engine.ts   # Diff generation
│   │   └── apply-engine.ts  # Patch application
│   ├── types/
│   │   └── patch.types.ts
│   └── utils/
│       └── code-utils.ts
├── package.json
└── tsconfig.json
```

### `packages/utils/` - Shared Utilities

```
utils/
├── src/
│   ├── index.ts             # Barrel export
│   ├── logger/              # Logging utilities
│   ├── validation/          # Validation helpers
│   ├── formatting/          # Code formatting
│   └── helpers/             # General helpers
├── package.json
└── tsconfig.json
```

---

## Naming Conventions

### Files

- **Components**: PascalCase (e.g., `Navbar.tsx`, `ProjectCard.tsx`)
- **Pages**: PascalCase with `Page` suffix (e.g., `DashboardPage.tsx`, `LoginPage.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useProject.ts`)
- **Services**: camelCase with `.service.ts` suffix (e.g., `auth.service.ts`, `project.service.ts`)
- **Controllers**: camelCase with `.controller.ts` suffix (e.g., `auth.controller.ts`)
- **Routes**: camelCase with `.routes.ts` suffix (e.g., `auth.routes.ts`)
- **Stores**: camelCase with `.store.ts` suffix (e.g., `project.store.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `user.types.ts`)
- **Utils**: camelCase with `.utils.ts` suffix (e.g., `file.utils.ts`)
- **Constants**: UPPER_SNAKE_CASE files (e.g., `API_CONSTANTS.ts`)
- **Config**: camelCase with `.config.ts` suffix (e.g., `db.config.ts`)

### Folders

- **Features**: kebab-case (e.g., `user-profile/`, `project-management/`)
- **Components**: kebab-case (e.g., `ui/`, `layout/`, `common/`)
- **Utilities**: kebab-case (e.g., `file-utils/`, `validation/`)

### Variables & Functions

- **Variables**: camelCase (e.g., `userName`, `projectList`)
- **Functions**: camelCase (e.g., `getUser()`, `createProject()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `ProjectData`)
- **Enums**: PascalCase (e.g., `UserRole`, `ProjectStatus`)

### Exports

- **Default exports**: Use for main component/page files
- **Named exports**: Use for utilities, types, constants
- **Barrel exports**: Use `index.ts` files to re-export from subdirectories

---

## Best Practices

1. **Feature-based organization**: Group related files by feature/domain
2. **Separation of concerns**: Keep UI, logic, and data separate
3. **Barrel exports**: Use `index.ts` for clean imports
4. **Type safety**: Define types close to where they're used
5. **Consistent naming**: Follow conventions strictly
6. **Documentation**: Add README.md in complex directories
