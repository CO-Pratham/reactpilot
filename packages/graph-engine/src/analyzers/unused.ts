import type { GraphData } from '../types.js';

/**
 * Identify unused files/components (dead code) by traversing reachable nodes
 * from entrypoints (pages, routes, and root config files).
 */
export function detectUnusedNodes(graph: GraphData): string[] {
  const allNodes = new Set(graph.nodes.map((n) => n.id));
  const importedNodes = new Set<string>();

  // Collect all nodes that are imported by someone
  for (const edge of graph.edges) {
    importedNodes.add(edge.target);
  }

  // Entrypoints: nodes that act as roots (pages, routes, main files, or non-component standalone files)
  const entrypoints = graph.nodes.filter(
    (node) =>
      node.type === 'page' ||
      node.type === 'route' ||
      node.id.toLowerCase().includes('index') ||
      node.id.toLowerCase().includes('main') ||
      node.id.toLowerCase().includes('app') ||
      (!importedNodes.has(node.id) &&
        node.type !== 'component' &&
        node.type !== 'hook' &&
        node.type !== 'utility')
  );

  const reachable = new Set<string>();
  const queue: string[] = entrypoints.map((e) => e.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;
    reachable.add(current);

    const node = graph.nodes.find((n) => n.id === current);
    if (node) {
      for (const dep of node.dependencies) {
        if (!reachable.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  const unused: string[] = [];
  for (const nodeId of allNodes) {
    if (!reachable.has(nodeId)) {
      unused.push(nodeId);
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (node) {
        node.isUnused = true;
      }
    }
  }

  graph.unusedNodes = unused;
  return unused;
}
