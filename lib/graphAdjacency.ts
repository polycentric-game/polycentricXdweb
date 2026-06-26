import type { ArcLayoutLink } from './graphArcEdges';
import { graphNodeId } from './graphArcEdges';

export interface GraphAdjacency {
  neighbors: Map<string, Set<string>>;
  /** node id → incident graph-edge ids */
  incidentEdges: Map<string, Set<string>>;
}

export function buildGraphAdjacency(edges: ArcLayoutLink[]): GraphAdjacency {
  const neighbors = new Map<string, Set<string>>();
  const incidentEdges = new Map<string, Set<string>>();

  const addNeighbor = (a: string, b: string) => {
    if (!neighbors.has(a)) neighbors.set(a, new Set());
    neighbors.get(a)!.add(b);
  };

  const addIncident = (nodeId: string, edgeId: string) => {
    if (!incidentEdges.has(nodeId)) incidentEdges.set(nodeId, new Set());
    incidentEdges.get(nodeId)!.add(edgeId);
  };

  for (const edge of edges) {
    const sourceId = graphNodeId(edge.source);
    const targetId = graphNodeId(edge.target);
    if (sourceId === targetId) {
      addIncident(sourceId, edge.id);
      continue;
    }
    addNeighbor(sourceId, targetId);
    addNeighbor(targetId, sourceId);
    addIncident(sourceId, edge.id);
    addIncident(targetId, edge.id);
  }

  return { neighbors, incidentEdges };
}

export function connectedNodeIds(edges: ArcLayoutLink[]): Set<string> {
  const ids = new Set<string>();
  for (const edge of edges) {
    ids.add(graphNodeId(edge.source));
    ids.add(graphNodeId(edge.target));
  }
  return ids;
}
