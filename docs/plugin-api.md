# ReactPilot Plugin API Reference

Extend ReactPilot by writing custom plugins. Plugins can register custom AST rules, generators, AI prompts, and report layouts.

## Creating a Plugin

Create a directory containing a `plugin.json` manifest:

```json
{
  "name": "custom-rule-plugin",
  "version": "1.0.0",
  "description": "Checks for missing keys in custom list components",
  "main": "index.js",
  "reactpilotVersion": ">=1.0.0"
}
```

Implement the entrypoint `index.js`:

```javascript
export default function setup(api, context) {
  // 1. Register custom AST rule
  api.registerRule({
    name: 'custom-list-key',
    description: 'Verify lists use correct key properties',
    severity: 'error',
    visitor: {
      JSXOpeningElement(path, state) {
        // Run custom AST logic here
      }
    }
  });

  // 2. Register AI Prompt
  api.registerPrompt({
    name: 'optimize-keys',
    description: 'Provide suggestions to fix list keys',
    template: 'Optimize this Component keys: {code}'
  });
}
```
