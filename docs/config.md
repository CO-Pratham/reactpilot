# ReactPilot Configuration Reference

ReactPilot is configured via project-level config files. By default, it looks for `reactpilot.config.ts` or `reactpilot.config.js` in your root directory.

## Configuration Schema

```typescript
export default {
  // Plugins to load (from marketplace or local paths)
  plugins: ['react-query', './local-plugins/custom-checks'],

  // GitHub code review configuration
  review: {
    severity: 'medium',            // low | medium | high
    categories: ['all'],           // performance | accessibility | security | maintainability | architecture | bundle
    postComment: true,             // Post review summary comments to PR
    failOnScore: 80,               // Fail checks if overall score falls below 80
  },

  // Architecture Graph Visualizer options
  graph: {
    theme: 'dark',                 // dark | light
    defaultFormat: 'html',         // html | svg | png | json
    filters: ['circular', 'unused'],
    output: './reactpilot-graph.html',
  },

  // AI Chat options
  chat: {
    provider: 'openai',            // openai | ollama
    model: 'gpt-4o-mini',          // LLM model name
    indexStrategy: 'ast',          // ast | text
  },

  // React 19 / Next.js migration configurations
  migration: {
    backup: true,                  // Backup files before modifying
    dryRun: false,                 // Preview plan without saving changes
    formatter: 'prettier',         // Run code formatter post-migration
  }
};
```
