import type { GraphData } from '../types.js';

/**
 * Detect all circular dependency cycles in the graph using DFS.
 * Updates nodes and edges to mark them as circular.
 */
export function detectCircularDependencies(graph: GraphData): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  const adjList = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adjList.set(node.id, node.dependencies);
  }

  function dfs(nodeId: string) {
    visited.add(nodeId);
    stack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (stack.has(neighbor)) {
        // Cycle detected!
        const startIndex = path.indexOf(neighbor);
        if (startIndex !== -1) {
          const cycle = path.slice(startIndex);
          cycles.push(cycle);
        }
      }
    }

    path.pop();
    stack.delete(nodeId);
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  // Mark nodes and edges that are part of any cycle
  const nodesInCycles = new Set(cycles.flat());

  for (const node of graph.nodes) {
    if (nodesInCycles.has(node.id)) {
      node.isCircular = true;
    }
  }

  for (const edge of graph.edges) {
    if (nodesInCycles.has(edge.source) && nodesInCycles.has(edge.target)) {
      // Basic check: is target reachable back to source?
      // Since it's in nodesInCycles, mark as potential circular path
      edge.isCircular = true;
    }
  }

  return cycles;
}
