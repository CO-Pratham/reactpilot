import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildGraph,
  detectCircularDependencies,
  detectUnusedNodes,
  exportToHtml,
} from '@reactpilot/graph-engine';
import { resolveProjectRoot } from '@reactpilot/project-chat';

export async function GET() {
  try {
    const projectRoot = resolveProjectRoot(process.cwd());
    const graph = buildGraph(projectRoot);
    detectCircularDependencies(graph);
    detectUnusedNodes(graph);

    const html = exportToHtml(graph, 'dark');
    const outputPath = path.join(projectRoot, 'reactpilot-graph.html');
    fs.writeFileSync(outputPath, html, 'utf-8');

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
