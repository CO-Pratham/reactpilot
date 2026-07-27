import type { GraphData } from '../types.js';

/**
 * Generate a static, well-spaced SVG layout string representing the graph.
 */
export function exportToSvg(graph: GraphData): string {
  const width = 1200;
  const height = 800;

  // Lay out nodes in a circle for simple dependency visualizer
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  const nodePositions = new Map<string, { x: number; y: number }>();

  graph.nodes.forEach((node, i) => {
    const angle = (i / graph.nodes.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodePositions.set(node.id, { x, y });
  });

  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: #0F172A;">`);

  // Style tags
  lines.push(`  <style>
    .node { font-family: system-ui, sans-serif; font-size: 10px; cursor: pointer; }
    .edge { stroke: #475569; stroke-width: 1; fill: none; opacity: 0.5; }
    .edge-circular { stroke: #EF4444; stroke-width: 1.5; opacity: 0.8; }
    .node-text { fill: #E2E8F0; text-anchor: middle; font-size: 8px; }
  </style>`);

  // Draw Edges
  for (const edge of graph.edges) {
    const from = nodePositions.get(edge.source);
    const to = nodePositions.get(edge.target);
    if (from && to) {
      const cls = edge.isCircular ? 'edge-circular' : 'edge';
      lines.push(`  <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="${cls}" />`);
    }
  }

  // Draw Nodes
  for (const node of graph.nodes) {
    const pos = nodePositions.get(node.id)!;
    const color = node.isCircular
      ? '#EF4444' // Red for circular
      : node.isUnused
      ? '#64748B' // Gray for unused
      : node.type === 'page'
      ? '#10B981' // Green for pages
      : node.type === 'hook'
      ? '#F59E0B' // Amber for hooks
      : '#3B82F6'; // Blue for components/utilities

    lines.push(`  <g class="node">`);
    lines.push(`    <circle cx="${pos.x}" cy="${pos.y}" r="8" fill="${color}" stroke="#1E293B" stroke-width="1.5" />`);
    lines.push(`    <text x="${pos.x}" y="${pos.y - 12}" class="node-text">${node.label}</text>`);
    lines.push(`  </g>`);
  }

  lines.push('</svg>');
  return lines.join('\n');
}
