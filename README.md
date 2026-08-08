# ReactPilot 🚀

AI-powered React developer assistant with AST code analysis, AI patch engine, visual dependency graph, automated migration tools, and a local web dashboard.

---

## Supported Operating Systems

| OS | Status | Notes |
|---|---|---|
| **macOS** | ✅ Fully Supported | macOS 12+ (Intel & Apple Silicon) |
| **Windows** | ✅ Fully Supported | Windows 10/11 (PowerShell & cmd.exe) |
| **Linux** | ✅ Fully Supported | Ubuntu, Debian, Fedora, Arch |

---

## Installation & First Run

### Monorepo Setup (For Developers)

```bash
# Clone the repository
git clone https://github.com/CO-Pratham/reactpilot.git
cd reactpilot

# Install workspace dependencies
npm install

# Build all packages
npm run build
```

---

## Feature Setup (Opt-In Modular Architecture)

ReactPilot features are opt-in. You choose which features to install during setup so you don't waste disk space or install unnecessary dependencies.

When you run `reactpilot` for the first time, an interactive prompt will ask which features to install:

```
? Select the features you want to install:
  [X] Code Analyzer        — AST-based React issue detection (always on)
  [X] Dependency Graph     — Interactive architecture graph
  [X] Local Dashboard      — Web dashboard to view results
  [ ] AI Fix Engine        — AI-powered code fixes [requires API key]
  [ ] Project Chat         — Ask questions about your codebase [requires API key]
  [ ] GitHub / PR Review   — Review diffs and pull requests
  [ ] Migration Engine     — React 19 / Next.js migration
  [ ] Plugin System        — Install community plugins
```

### Managing Features

You can reconfigure or check feature status at any time:

```bash
# Display feature status and reconfigure interactively
reactpilot features

# Reset and force re-run interactive feature selector
reactpilot features --reset

# Non-interactive CI mode (enable all features)
reactpilot features --all

# Non-interactive CI mode (minimal core features only)
reactpilot features --none
```

---

## CLI Commands Reference

```bash
# Scan project for performance, hook, and architectural issues
reactpilot analyze [path]

# Generate an interactive visual dependency graph (HTML, SVG, PNG, JSON)
reactpilot graph [path] --open

# Launch local Developer Center web dashboard (http://localhost:3000)
reactpilot dashboard

# Ask AI questions about your codebase using RAG
reactpilot ask "Where is auth state handled?"

# Auto-fix issues using AI engine
reactpilot fix src/components/Header.tsx
reactpilot auto-fix

# Review git diff or pull request
reactpilot review

# Automated React 19 / Next.js 15 migration
reactpilot migrate react19
reactpilot migrate status

# Manage community plugins
reactpilot plugin search [query]
reactpilot plugin install [name]
reactpilot plugin list
```

---

## Environment Configuration

Configure optional LLM secrets by setting environment variables or creating a `.env` file in your project root:

```env
# Optional: Set API Key for AI engine and RAG Chat
REACTPILOT_API_KEY=sk-...

# Optional: Custom API Base URL (OpenAI, Groq, Ollama, etc.)
REACTPILOT_API_BASE_URL=https://api.openai.com/v1

# Optional: LLM Model selection (defaults to gpt-4o-mini for low latency & cost)
REACTPILOT_MODEL=gpt-4o-mini
```

---

## Project Structure

- `apps/cli` – Command-line interface (`reactpilot`)
- `apps/web` – Next.js Developer Center web dashboard
- `apps/vscode-extension` – VSCode extension for inline diagnostics
- `packages/analyzer` – AST-driven React inspection rules
- `packages/ai-engine` – LLM orchestration & prompt engine
- `packages/patcher` – AST-validated diff merge engine
- `packages/graph-engine` – Visual dependency graph generator
- `packages/migration-engine` – Automated React 19 / Next.js migration
- `packages/project-chat` – RAG indexer and codebase QA engine
- `packages/plugin-system` – Dynamic plugin loader & registry
- `packages/config` – Shared Zod configuration & feature store
- `packages/utils` – Cross-platform path helpers & UI formatters

---

## License

MIT © ReactPilot Team
