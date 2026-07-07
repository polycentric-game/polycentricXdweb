import type { GraphEdge, GraphNode } from './types';

export type GraphEdgeStyle = 'straight' | 'arc-fan';

export const DEFAULT_GRAPH_EDGE_STYLE: GraphEdgeStyle = 'arc-fan';

export const GRAPH_EDGE_STYLE_OPTIONS: {
  value: GraphEdgeStyle;
  label: string;
  description: string;
}[] = [
  {
    value: 'arc-fan',
    label: 'Arc fan',
    description: 'Each parallel edge bows progressively sharper on alternating sides',
  },
  {
    value: 'straight',
    label: 'Straight',
    description: 'Direct lines between nodes (parallel edges overlap)',
  },
];

const GRAPH_EDGE_STYLE_STORAGE_KEY = 'graph-edge-style';

export function loadGraphEdgeStyle(): GraphEdgeStyle {
  if (typeof window === 'undefined') return DEFAULT_GRAPH_EDGE_STYLE;
  const stored = localStorage.getItem(GRAPH_EDGE_STYLE_STORAGE_KEY);
  if (stored === 'symmetric-arc') {
    return DEFAULT_GRAPH_EDGE_STYLE;
  }
  if (stored && GRAPH_EDGE_STYLE_OPTIONS.some((o) => o.value === stored)) {
    return stored as GraphEdgeStyle;
  }
  return DEFAULT_GRAPH_EDGE_STYLE;
}

export function saveGraphEdgeStyle(style: GraphEdgeStyle): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GRAPH_EDGE_STYLE_STORAGE_KEY, style);
  }
}

export function graphNodeId(node: string | GraphNode): string {
  return typeof node === 'string' ? node : node.id;
}

export function pairKeyForLink(sourceId: string, targetId: string): string {
  return sourceId < targetId ? `${sourceId}-${targetId}` : `${targetId}-${sourceId}`;
}

export type ArcLayoutLink = GraphEdge & {
  linknum: number;
  linkTotal: number;
  pairKey: string;
  isSelfLoop: boolean;
};

/** Group parallel edges and assign linknum / linkTotal per normalized node pair. */
export function assignParallelLinkMeta(edges: GraphEdge[]): ArcLayoutLink[] {
  const groups = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
    const sourceId = graphNodeId(edge.source);
    const targetId = graphNodeId(edge.target);
    const key = sourceId === targetId ? `self:${sourceId}` : pairKeyForLink(sourceId, targetId);
    const list = groups.get(key) ?? [];
    list.push(edge);
    groups.set(key, list);
  }

  const counters = new Map<string, number>();

  return edges.map((edge) => {
    const sourceId = graphNodeId(edge.source);
    const targetId = graphNodeId(edge.target);
    const isSelfLoop = sourceId === targetId;
    const key = isSelfLoop ? `self:${sourceId}` : pairKeyForLink(sourceId, targetId);
    const linkTotal = groups.get(key)!.length;
    const linknum = counters.get(key) ?? 0;
    counters.set(key, linknum + 1);

    return { ...edge, linknum, linkTotal, pairKey: key, isSelfLoop };
  });
}

const MIN_ARC_RADIUS = 24;

export interface EdgeGeometry {
  path: string;
  midX: number;
  midY: number;
}

/** Sample the geometric midpoint of a rendered SVG path (for label placement). */
export function midPointOnPath(pathEl: SVGPathElement): { x: number; y: number } {
  const length = pathEl.getTotalLength();
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return pathEl.getPointAtLength(length / 2);
}

const BASE_CURVATURE = 1.5;
const CURVATURE_STEP = 0.75;

function nearStraightRadius(linkTotal: number, distance: number): number {
  return Math.max(MIN_ARC_RADIUS, Math.max(distance, MIN_ARC_RADIUS) * 4);
}

function drForArcFan(linknum: number, linkTotal: number, distance: number): number {
  if (linkTotal <= 1) return nearStraightRadius(linkTotal, distance);
  const curvature = BASE_CURVATURE + linknum * CURVATURE_STEP;
  return Math.max(MIN_ARC_RADIUS, distance / curvature, distance / 2 + 2);
}

function computeSelfLoopGeometry(source: GraphNode, linknum: number): EdgeGeometry {
  const sx = source.x!;
  const sy = source.y!;
  const loopRadius = 22 + linknum * 10;
  const sweep = linknum % 2;
  const startX = sx + 4;
  const startY = sy - 8;
  const endX = sx - 3;
  const endY = sy - 10;
  const path = `M${startX},${startY} A${loopRadius},${loopRadius} 0 1,${sweep} ${endX},${endY}`;

  return {
    path,
    midX: sx + loopRadius * 0.55,
    midY: sy - loopRadius - 10,
  };
}

function computeStraightGeometry(source: GraphNode, target: GraphNode): EdgeGeometry {
  const sx = source.x!;
  const sy = source.y!;
  const tx = target.x!;
  const ty = target.y!;

  return {
    path: `M${sx},${sy} L${tx},${ty}`,
    midX: (sx + tx) / 2,
    midY: (sy + ty) / 2,
  };
}

function computeArcGeometry(
  source: GraphNode,
  target: GraphNode,
  linknum: number,
  linkTotal: number
): EdgeGeometry {
  const sx = source.x!;
  const sy = source.y!;
  const tx = target.x!;
  const ty = target.y!;
  const distance = Math.hypot(tx - sx, ty - sy) || 1;
  const sweep: 0 | 1 = linknum % 2 === 0 ? 0 : 1;
  const dr = drForArcFan(linknum, linkTotal, distance);
  const path = `M${sx},${sy} A${dr},${dr} 0 0,${sweep} ${tx},${ty}`;

  return {
    path,
    midX: (sx + tx) / 2,
    midY: (sy + ty) / 2,
  };
}

export function layoutForLink(link: ArcLayoutLink, style: GraphEdgeStyle): EdgeGeometry {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;

  if (link.isSelfLoop) {
    return computeSelfLoopGeometry(source, link.linknum);
  }

  if (style === 'straight') {
    return computeStraightGeometry(source, target);
  }

  return computeArcGeometry(source, target, link.linknum, link.linkTotal);
}

/** @deprecated Use layoutForLink(link, 'arc-fan') */
export function arcLayoutForLink(link: ArcLayoutLink): EdgeGeometry {
  return layoutForLink(link, 'arc-fan');
}
