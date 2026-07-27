export type GraphNodeType =
  | 'component'
  | 'hook'
  | 'context'
  | 'page'
  | 'route'
  | 'utility';

export interface GraphNode {
  id: string;      // file path relative to project root or component name
  label: string;
  type: GraphNodeType;
  isUnused: boolean;
  isCircular: boolean;
  dependencies: string[]; // Node IDs that this node imports
  size: number;   // size of the file in bytes (or line count)
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'import' | 'context' | 'route';
  isCircular: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  circularCycles: string[][]; // Lists of node IDs in circular loops
  unusedNodes: string[];     // Node IDs of unused components/files
}

export interface GraphOptions {
  theme?: 'dark' | 'light';
  filters?: ('component' | 'hook' | 'context' | 'route' | 'unused' | 'circular')[];
  output?: string;
  open?: boolean;
}
