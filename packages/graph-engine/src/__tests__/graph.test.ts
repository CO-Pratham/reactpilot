import { describe, it, expect } from 'vitest';
import { detectCircularDependencies, detectUnusedNodes } from '../index.js';
import type { GraphData } from '../types.js';

describe('Graph Engine Analyzers', () => {
  it('should detect circular dependency loops correctly', () => {
    // Setup a circular cycle: A -> B -> C -> A
    const mockGraph: GraphData = {
      nodes: [
        { id: 'A', label: 'A', type: 'component', isUnused: false, isCircular: false, dependencies: ['B'], size: 100 },
        { id: 'B', label: 'B', type: 'component', isUnused: false, isCircular: false, dependencies: ['C'], size: 100 },
        { id: 'C', label: 'C', type: 'component', isUnused: false, isCircular: false, dependencies: ['A'], size: 100 },
      ],
      edges: [
        { source: 'A', target: 'B', type: 'import', isCircular: false },
        { source: 'B', target: 'C', type: 'import', isCircular: false },
        { source: 'C', target: 'A', type: 'import', isCircular: false },
      ],
      circularCycles: [],
      unusedNodes: [],
    };

    const cycles = detectCircularDependencies(mockGraph);
    expect(cycles.length).toBeGreaterThan(0);
    expect(mockGraph.nodes.every((n) => n.isCircular)).toBe(true);
  });

  it('should find unused components correctly', () => {
    // Root points to A. B has no imports pointing to it.
    const mockGraph: GraphData = {
      nodes: [
        { id: 'A', label: 'A', type: 'page', isUnused: false, isCircular: false, dependencies: [], size: 100 },
        { id: 'B', label: 'B', type: 'component', isUnused: false, isCircular: false, dependencies: [], size: 100 },
      ],
      edges: [],
      circularCycles: [],
      unusedNodes: [],
    };

    const unused = detectUnusedNodes(mockGraph);
    expect(unused).toContain('B');
    expect(mockGraph.nodes.find((n) => n.id === 'B')?.isUnused).toBe(true);
  });
});
