# ReactPilot CLI 🚀

> **Your AI-Powered Copilot for React Codebases.**
> Analyze, optimize, and fix your React applications with AST-based precision and LLM intelligence.

[![npm version](https://img.shields.io/npm/v/@reactpilot/cli.svg)](https://www.npmjs.com/package/@reactpilot/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ReactPilot is a powerful CLI tool designed to help developers maintain high-quality React codebases. It combines static analysis (AST) with Generative AI to detect issues, calculate performance scores, generate interactive architecture graphs, and automatically apply fixes.

---

## ✨ Features

- **🔍 Deep Static Analysis**: Detects unused imports, heavy components, inline function risks, and more using AST traversal.
- **🤖 AI Auto-Fix**: Automatically resolves issues using LLMs (OpenAI, Groq, or Ollama) with local rule-based fallbacks.
- **💻 Developer Center**: Launch a local web-based interactive dashboard to review reports, view dependency graphs, and chat with AI.
- **📊 Performance Score**: Gamified scoring system (0-100) to track your project's health.
- **📈 Project Summary**: Detailed insights into hook usage, component complexity, and potential bugs.
- **⚡ Optimization Suggestions**: Identifies re-render risks and expensive computations.

---

## 📦 Installation

Install globally via npm:

```bash
npm install -g @reactpilot/cli
```

Or run directly with `npx`:

```bash
npx reactpilot analyze .
```

---

## 🚀 Usage

### 1. Analyze Project
Scan your project for issues and get a performance score.

```bash
reactpilot analyze [path]
```
*Example:* `reactpilot analyze ./src`

**Output includes:**
- **Performance Score**: A grade from 0 to 100.
- **Project Summary**: Counts of files, components, hooks, etc.
- **Issues List**: Detailed list of errors, warnings, and suggestions.

### 2. Auto-Fix Issues
Automatically fix detected issues. You can target specific files or rules.

```bash
reactpilot auto-fix [target] [options]
```

*Examples:*
- Fix all issues in the current directory:
  ```bash
  reactpilot auto-fix .
  ```
- Fix only unused imports:
  ```bash
  reactpilot auto-fix unused-import
  ```
- Fix a specific file:
  ```bash
  reactpilot auto-fix src/components/App.tsx
  ```

### 3. Optimize
Run optimization checks and apply performance improvements (like removing unused imports).

```bash
reactpilot optimize [path]
```

### 4. Interactive Dashboard
Launch the local Developer Center dashboard to inspect audit reports, explore interactive dependency graphs, and manage plugins in the browser.

```bash
reactpilot dashboard [options]
# Or use the shortcut:
reactpilot web
```
*Options:*
- `-p, --port <number>`: Port to run the dashboard server on (default: `3000`).

### 5. Chat with Codebase (AI)
Ask questions, search for components, or request refactoring from the command line using semantic project context.

```bash
reactpilot ask "How does state management work in this project?"
# Or enter interactive chat mode:
<ctrl94>reactpilot ask
```

### 6. Architecture Graph
Generate an interactive HTML import cycle and dependency graph of your React project.

```bash
reactpilot graph [path] --open
```

---

## ⚙️ Configuration

ReactPilot uses LLMs (Large Language Models) for complex fixes and semantic chat. Configure your preferred provider using a `.env` file in your project root.

### OpenAI
Configure OpenAI:
```env
REACTPILOT_API_KEY=sk-...
REACTPILOT_MODEL=gpt-4o-mini
```

### Groq (High-Speed Cloud LLM)
Configure Groq:
```env
REACTPILOT_API_BASE_URL=https://api.groq.com/openai/v1
REACTPILOT_API_KEY=gsk_...
REACTPILOT_MODEL=llama-3.1-70b-versatile
```

### Ollama (Local LLM)
To use a local model like Llama 3 via Ollama:
```env
REACTPILOT_API_BASE_URL=http://localhost:11434/v1
REACTPILOT_MODEL=llama3
REACTPILOT_API_KEY=ollama # Arbitrary value required to bypass validation
```

---

## 🛡️ Supported Rules

All rules support AI-powered auto-fixing using the `auto-fix` command.

| Rule ID | Description | Rule-Based Fix | AI Auto-Fix |
| :--- | :--- | :---: | :---: |
| `unused-import` | Detects and removes unused imports | ✅ | ✅ |
| `heavy-component` | Identifies large components (>300 lines) | ❌ | ✅ |
| `inline-function` | Detects inline functions in JSX props | ❌ | ✅ |
| `invalid-hook` | Checks for hook rules violations | ❌ | ✅ |
| `deep-jsx` | Warns about excessive JSX nesting | ❌ | ✅ |
| `unused-state` | Detects unused `useState` variables | ❌ | ✅ |
| `expensive-render` | Identifies expensive calculations without `useMemo` | ❌ | ✅ |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
