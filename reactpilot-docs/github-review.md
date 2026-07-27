# GitHub Code Review Bot (`reactpilot review`)

ReactPilot integrates with GitHub Actions to audit pull request diffs automatically.

## Commands

```bash
# Review local unstaged changes (git diff)
reactpilot review

# Simulate GitHub Action review run locally
reactpilot review --github-action

# Save audit report to markdown file
reactpilot review --output ./pr-audit-report.md
```

## Review Categories

- **Performance:** Audits component re-renders, hook calls, and list keys.
- **Accessibility (A11y):** Checks alt text, input labels, focus controls, and tabIndex.
- **Security:** Scans for XSS, eval, local token leaks, and open redirects.
- **Maintainability:** Analyzes cyclomatic complexity, function lengths, and comments.
- **Architecture:** Checks for cyclic coupling and layer boundaries.
- **Bundle Impact:** Highlights heavy dependencies and lazy load opportunities.
