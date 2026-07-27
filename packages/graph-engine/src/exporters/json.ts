import type { GraphData } from '../types.js';

export function exportToJson(graph: GraphData): string {
  return JSON.stringify(graph, null, 2);
}
