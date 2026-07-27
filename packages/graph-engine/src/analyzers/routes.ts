import type { GraphData } from '../types.js';

/**
 * Scan graph data and link pages directly to virtual route mappings,
 * ensuring clear routes/URLs are modeled.
 */
export function analyzeRouteMappings(graph: GraphData): void {
  for (const node of graph.nodes) {
    if (node.type === 'page') {
      // Create a virtual route tag/edge for Next.js and React Router pages
      const routeLabel = node.id
        .replace(/\\/g, '/')
        .replace(/(pages|app)\//, '/')
        .replace(/\/page\.[jt]sx?$/, '')
        .replace(/\/index\.[jt]sx?$/, '');

      node.label = `${node.label} (${routeLabel === '' ? '/' : routeLabel})`;
    }
  }
}
