import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import {
  buildGraph,
  detectCircularDependencies,
  detectUnusedNodes,
  analyzeRouteMappings,
  exportToJson,
  exportToSvg,
  exportToPng,
  exportToHtml,
} from '@reactpilot/graph-engine';
import { saveRun } from '@reactpilot/github-review';
import { loadConfig, isFeatureEnabled } from '@reactpilot/config';
import { withSpinner, printSection, printSuccess, colors } from '@reactpilot/utils/ui';

interface GraphOptions {
  output?: string;
  format?: 'html' | 'svg' | 'png' | 'json';
  open?: boolean;
  theme?: 'dark' | 'light';
}

/**
 * CLI command runner for `reactpilot graph [target]`
 */
export async function runGraph(targetDir: string, options: GraphOptions): Promise<void> {
  if (!isFeatureEnabled('graph')) {
    console.error(colors.error('The "graph" feature is not enabled.\nRun: reactpilot features -> select "Dependency Graph" to enable it.'));
    process.exit(1);
  }

  printSection('ReactPilot Visual Architecture Graph');

  const cwd = path.resolve(targetDir);
  const { config } = await loadConfig(cwd);

  const format = options.format ?? config.graph.defaultFormat ?? 'html';
  const theme = options.theme ?? config.graph.theme ?? 'dark';
  const defaultOutput = `./reactpilot-graph.${format}`;
  const outPath = path.resolve(options.output ?? config.graph.output ?? defaultOutput);

  // 1. Build Graph
  const graph = await withSpinner(
    'Analyzing code imports and building dependency tree...',
    async () => {
      const data = buildGraph(cwd);
      // Run analyzers to find cycles, unused nodes, and format routes
      detectCircularDependencies(data);
      detectUnusedNodes(data);
      analyzeRouteMappings(data);
      return data;
    },
    'Graph compiled successfully'
  );

  // 2. Export Graph
  await withSpinner(
    `Exporting graph to "${outPath}" (${format.toUpperCase()})...`,
    async () => {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      switch (format) {
        case 'json':
          fs.writeFileSync(outPath, exportToJson(graph), 'utf-8');
          break;
        case 'svg':
          fs.writeFileSync(outPath, exportToSvg(graph), 'utf-8');
          break;
        case 'png':
          await exportToPng(graph, outPath);
          break;
        case 'html':
        default:
          fs.writeFileSync(outPath, exportToHtml(graph, theme), 'utf-8');
          break;
      }
    },
    'Export complete'
  );

  // Print results summary
  const circularCount = graph.circularCycles.length;
  const unusedCount = graph.unusedNodes.length;

  console.log(`\nNodes: ${colors.cyan(graph.nodes.length)}`);
  console.log(`Edges: ${colors.cyan(graph.edges.length)}`);
  console.log(`Circular Loops: ${circularCount > 0 ? colors.error(circularCount) : colors.success(0)}`);
  console.log(`Unused Nodes: ${unusedCount > 0 ? colors.warning(unusedCount) : colors.success(0)}`);

  saveRun({
    type: 'graph',
    title: 'Architecture Graph',
    projectPath: cwd,
    issueCount: circularCount + unusedCount,
    summary: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      circularCount,
      unusedCount,
      outputPath: outPath,
      format,
    },
  });
  printSuccess('Graph summary saved. Refresh the Developer Center dashboard to view it.');

  // 3. Open in browser (for html/svg)
  const shouldOpen = options.open ?? config.graph.open ?? false;
  if (shouldOpen && (format === 'html' || format === 'svg')) {
    const cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${cmd} "${outPath}"`);
  }
}
