# ReactPilot Web Dashboard

The web dashboard provides a local developer interface to review previous runs, chat sessions, interactive dependency graphs, and search the plugin marketplace.

## Commands

To start the local developer dashboard:

```bash
# Start Next.js development server
npm run dev --filter=@reactpilot/web
```

Open your browser at `http://localhost:3000` to access the console.

## Features

- **Dashboard overview:** Displays recent run stats, quality scores, warnings, and active plugins.
- **Audit reports:** Drills down into specific file issues, lines, and resolution suggestions.
- **Replay panel:** Browses and re-reads previous AI chat sessions.
- **Visualizer embed:** Inspects interactive graphs directly inside your browser.
