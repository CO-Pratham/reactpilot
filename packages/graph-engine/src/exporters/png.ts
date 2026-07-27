import { exportToSvg } from './svg.js';

/**
 * Generate a PNG buffer or file.
 * If canvas is not installed, prints a warning and writes the SVG file as a fallback.
 */
export async function exportToPng(
  graph: any,
  outputPath: string
): Promise<void> {
  const fs = await import('node:fs');
  const path = await import('node:path');

  try {
    // Check if node-canvas can be loaded
    const canvasModule: any = await import(String('canvas'));
    const { createCanvas } = canvasModule;
    const svgText = exportToSvg(graph);

    // Standard width/height matching SVG exporter
    const width = 1200;
    const height = 800;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Simple background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // Basic canvas mock drawing of the nodes/edges (simplifying SVG representation)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const nodePositions = new Map<string, { x: number; y: number }>();

    graph.nodes.forEach((node: any, i: number) => {
      const angle = (i / graph.nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions.set(node.id, { x, y });
    });

    // Draw Edges
    for (const edge of graph.edges) {
      const from = nodePositions.get(edge.source);
      const to = nodePositions.get(edge.target);
      if (from && to) {
        ctx.strokeStyle = edge.isCircular ? '#EF4444' : '#475569';
        ctx.lineWidth = edge.isCircular ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    // Draw Nodes
    for (const node of graph.nodes) {
      const pos = nodePositions.get(node.id)!;
      const color = node.isCircular
        ? '#EF4444'
        : node.isUnused
        ? '#64748B'
        : node.type === 'page'
        ? '#10B981'
        : node.type === 'hook'
        ? '#F59E0B'
        : '#3B82F6';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Text label
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, pos.x, pos.y - 12);
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
  } catch {
    // Fallback: write SVG and warn
    const svgPath = outputPath.replace(/\.png$/, '.svg');
    const svgText = exportToSvg(graph);
    fs.writeFileSync(svgPath, svgText, 'utf-8');
    console.warn(
      `⚠ Native 'canvas' package is missing. Wrote static SVG file to "${svgPath}" instead.\n` +
      `To generate PNG, run: npm install canvas`
    );
  }
}
