# Architecture Graph (`reactpilot graph`)

Visualize code import structures, file dependencies, routes, cycles, and unused files.

## Commands

```bash
# Generate interactive HTML graph and open automatically
reactpilot graph --open

# Export graph as JSON data representation
reactpilot graph --format json --output ./tree-data.json

# Export graph as a static SVG vector graphic
reactpilot graph --format svg --output ./dependency-map.svg

# Filter visualizer to show only circular and unused nodes
reactpilot graph --filter circular,unused
```

## Features

- **Interactive HTML Viewer:** Includes zoom/pan capabilities, real-time node type filtering, name searches, and detail sidebars.
- **Cycle Detection:** Identifies circular import paths that lead to initialization failures.
- **Dead Code Detection:** Highlights files and components that are unreachable from routes or entrypoints.
