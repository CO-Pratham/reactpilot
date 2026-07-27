import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["cjs"],
  outExtension: () => ({ js: ".cjs" }),
  dts: true,
  clean: true,
  target: "node18",
  banner: {
    js: "#!/usr/bin/env node",
  },
  noExternal: [
    "@reactpilot/analyzer",
    "@reactpilot/ai-engine",
    "@reactpilot/patcher",
    "@reactpilot/utils",
    "@reactpilot/config",
    "@reactpilot/plugin-system",
    "@reactpilot/github-review",
    "@reactpilot/project-chat",
    "@reactpilot/graph-engine",
    "@reactpilot/migration-engine",
    "ora",
    "chalk",
    "dotenv",
  ],
  sourcemap: false,
  minify: false,
});
