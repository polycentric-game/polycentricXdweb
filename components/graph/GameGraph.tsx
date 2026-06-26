'use client';

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Role, Agreement, GraphNode, getGraphNodeHandle, getArchetypeForRole } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import {
  layoutForLink,
  type ArcLayoutLink,
  type GraphEdgeStyle,
} from '@/lib/graphArcEdges';
import { buildGraphAdjacency, connectedNodeIds } from '@/lib/graphAdjacency';
import {
  buildFilteredGraphEdges,
  type GraphFilterState,
  DEFAULT_GRAPH_FILTERS,
} from '@/lib/graphFilters';

interface GameGraphProps {
  roles: Role[];
  agreements: Agreement[];
  edgeStyle?: GraphEdgeStyle;
  graphFilters?: GraphFilterState;
  currentRoleId?: string;
  onNodeClick?: (roleId: string) => void;
  onEdgeClick?: (agreementId: string) => void;
}

export interface GameGraphRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  centerView: () => void;
}

const ARCHETYPE_FILL: Record<string, string> = {
  funder: '#10B981',
  builder: '#3B82F6',
  organizer: '#EAB308',
  storyteller: '#A855F7',
  strategist: '#EF4444',
};

const NODE_RADIUS = 25;
const NODE_RADIUS_FOCUSED = 30;
const OPACITY_TRANSITION = 'opacity 150ms ease';
const REST_EDGE_OPACITY = 0.42;
const REST_LABEL_OPACITY = 0.88;
const HIGHLIGHT_EDGE_OPACITY = 0.92;
const DIM_OPACITY = 0.12;
const ISOLATED_NODE_OPACITY = 0.55;

/** Scale forces with graph size so dense games spread enough to read edges. */
function computeLayoutParams(
  nodeCount: number,
  edgeCount: number,
  width: number,
  height: number
) {
  const minDim = Math.min(width, height);
  const sqrtN = Math.sqrt(nodeCount);
  const sqrtE = Math.sqrt(Math.max(edgeCount, 1));

  return {
    linkDistance: Math.min(300, 140 + nodeCount * 4.5 + sqrtE * 14),
    linkStrength: 0.32,
    chargeStrength: Math.min(-1400, -450 - nodeCount * 24),
    chargeDistanceMax: minDim * 1.35,
    collideRadius: Math.max(54, 40 + sqrtN * 2.8),
    seedRadiusFactor: Math.min(0.48, 0.36 + nodeCount * 0.0035),
    alphaDecay: 0.014,
  };
}

function roleToNode(role: Role): Pick<GraphNode, 'roleName' | 'archetype' | 'playerName'> {
  const archetype = getArchetypeForRole(role) ?? 'builder';
  return {
    roleName: role.template?.name ?? 'Unknown',
    archetype,
    playerName: role.playerName,
  };
}

function circleSeedPosition(
  index: number,
  total: number,
  width: number,
  height: number,
  seedRadiusFactor: number
): { x: number; y: number } {
  const angle = (index / total) * 2 * Math.PI;
  const radius = Math.min(width, height) * seedRadiusFactor;
  return {
    x: width / 2 + Math.cos(angle) * radius,
    y: height / 2 + Math.sin(angle) * radius,
  };
}

export const GameGraph = forwardRef<GameGraphRef, GameGraphProps>(
  (
    {
      roles,
      agreements,
      edgeStyle = 'symmetric-arc',
      graphFilters = DEFAULT_GRAPH_FILTERS,
      currentRoleId,
      onNodeClick,
      onEdgeClick,
    },
    ref
  ) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, ArcLayoutLink> | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    const router = useRouter();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
      const updateDimensions = () => {
        if (svgRef.current?.parentElement) {
          const container = svgRef.current.parentElement;
          setDimensions({
            width: container.clientWidth,
            height: Math.max(600, container.clientHeight),
          });
        }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const restartLayoutFromSeed = useCallback(() => {
      const simulation = simulationRef.current;
      if (!simulation) return;

      simulation.nodes().forEach((node) => {
        const seed = initialPositionsRef.current.get(node.id);
        if (seed) {
          node.x = seed.x;
          node.y = seed.y;
        }
        node.fx = null;
        node.fy = null;
      });

      simulation.alpha(0.85).restart();
    }, []);

    const zoomBy = useCallback((factor: number) => {
      if (svgRef.current && zoomRef.current) {
        const svg = d3.select(svgRef.current);
        svg.transition().duration(250).call(zoomRef.current.scaleBy, factor);
      }
    }, []);

    const zoomIn = useCallback(() => zoomBy(1.3), [zoomBy]);
    const zoomOut = useCallback(() => zoomBy(1 / 1.3), [zoomBy]);

    const resetZoom = useCallback(() => {
      if (svgRef.current && zoomRef.current) {
        const svg = d3.select(svgRef.current);
        svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
        restartLayoutFromSeed();
      }
    }, [restartLayoutFromSeed]);

    const centerView = useCallback(() => {
      if (svgRef.current && simulationRef.current && zoomRef.current) {
        const svg = d3.select(svgRef.current);
        const { width, height } = dimensions;
        const nodes = simulationRef.current.nodes();
        if (nodes.length === 0) return;

        const xExtent = d3.extent(nodes, (d) => d.x!) as [number, number];
        const yExtent = d3.extent(nodes, (d) => d.y!) as [number, number];
        const dx = xExtent[1] - xExtent[0];
        const dy = yExtent[1] - yExtent[0];
        const x = (xExtent[0] + xExtent[1]) / 2;
        const y = (yExtent[0] + yExtent[1]) / 2;
        const scale = Math.min(width / dx, height / dy) * 0.82;
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg
          .transition()
          .duration(750)
          .call(
            zoomRef.current.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
          );
      }
    }, [dimensions]);

    useImperativeHandle(ref, () => ({ zoomIn, zoomOut, resetZoom, centerView }), [
      zoomIn,
      zoomOut,
      resetZoom,
      centerView,
    ]);

    useEffect(() => {
      if (!svgRef.current || roles.length === 0) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const { width, height } = dimensions;

      const edges: ArcLayoutLink[] = buildFilteredGraphEdges(agreements, graphFilters);
      const layoutParams = computeLayoutParams(roles.length, edges.length, width, height);

      const nodes: GraphNode[] = roles.map((role, index) => {
        const seed = circleSeedPosition(
          index,
          roles.length,
          width,
          height,
          layoutParams.seedRadiusFactor
        );
        initialPositionsRef.current.set(role.id, seed);
        return {
          id: role.id,
          ...roleToNode(role),
          x: seed.x,
          y: seed.y,
        };
      });

      const adjacency = buildGraphAdjacency(edges);
      const nodesWithEdges = connectedNodeIds(edges);

      const applyRestOpacity = () => {
        node.style('opacity', (d) => (nodesWithEdges.has(d.id) ? 1 : ISOLATED_NODE_OPACITY));
        link.style('opacity', REST_EDGE_OPACITY);
        label.style('opacity', (d) =>
          nodesWithEdges.has(d.id) ? REST_LABEL_OPACITY : ISOLATED_NODE_OPACITY
        );
        subtitleLabel.style('opacity', (d) =>
          nodesWithEdges.has(d.id) ? REST_LABEL_OPACITY * 0.85 : ISOLATED_NODE_OPACITY
        );
      };

      const applyFocus = (nodeId: string | null) => {
        if (!nodeId) {
          applyRestOpacity();
          return;
        }

        const activeNodes = new Set<string>([nodeId]);
        adjacency.neighbors.get(nodeId)?.forEach((n) => activeNodes.add(n));
        const activeEdges = new Set(adjacency.incidentEdges.get(nodeId) ?? []);

        node.style('opacity', (d) => (activeNodes.has(d.id) ? 1 : DIM_OPACITY));
        link.style('opacity', (d) => (activeEdges.has(d.id) ? HIGHLIGHT_EDGE_OPACITY : DIM_OPACITY));
        label.style('opacity', (d) => (activeNodes.has(d.id) ? 1 : DIM_OPACITY));
        subtitleLabel.style('opacity', (d) => (activeNodes.has(d.id) ? REST_LABEL_OPACITY : DIM_OPACITY));
      };

      const updateEdgeLayout = () => {
        link.attr('d', (d) => layoutForLink(d, edgeStyle).path);
      };

      const linkForce = d3
        .forceLink<GraphNode, ArcLayoutLink>(edges)
        .id((d) => d.id)
        .distance(layoutParams.linkDistance)
        .strength(layoutParams.linkStrength);

      const simulation = d3
        .forceSimulation(nodes)
        .force('link', linkForce)
        .force(
          'charge',
          d3
            .forceManyBody()
            .strength(layoutParams.chargeStrength)
            .distanceMax(layoutParams.chargeDistanceMax)
        )
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(layoutParams.collideRadius))
        .alphaDecay(layoutParams.alphaDecay)
        .alphaMin(0.001)
        .alpha(1);

      simulationRef.current = simulation;

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .filter((event) => event.type !== 'wheel')
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      zoomRef.current = zoom;
      svg.call(zoom);

      const g = svg.append('g');

      g.append('rect')
        .attr('class', 'graph-background')
        .attr('x', -width * 4)
        .attr('y', -height * 4)
        .attr('width', width * 8)
        .attr('height', height * 8)
        .attr('fill', 'transparent')
        .style('cursor', 'default')
        .on('click', () => setFocus(null));

      let focusedNodeId: string | null = null;

      const setFocus = (nodeId: string | null) => {
        focusedNodeId = nodeId;
        applyFocus(nodeId);
        node.attr('r', (d) => (d.id === focusedNodeId ? NODE_RADIUS_FOCUSED : NODE_RADIUS));
        node.attr('stroke-width', (d) => {
          if (d.id === focusedNodeId) return 3;
          if (d.id === currentRoleId) return 3;
          return 2;
        });
      };

      const handleDocumentPointer = (event: Event) => {
        if (!focusedNodeId || !svgRef.current) return;
        const target = event.target as Node | null;
        if (target && svgRef.current.contains(target)) return;
        setFocus(null);
      };

      document.addEventListener('click', handleDocumentPointer, true);
      document.addEventListener('touchend', handleDocumentPointer, true);

      const link = g
        .append('g')
        .attr('class', 'graph-links')
        .selectAll<SVGPathElement, ArcLayoutLink>('path')
        .data(edges, (d) => d.id)
        .join('path')
        .attr('class', 'graph-edge')
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('stroke', (d) => {
          switch (d.status) {
            case 'proposed':
              return '#3B82F6';
            case 'revised':
              return '#EAB308';
            case 'approved':
              return '#39FF14';
            case 'completed':
              return '#10B981';
            default:
              return '#6B7280';
          }
        })
        .style('cursor', 'pointer')
        .style('transition', OPACITY_TRANSITION)
        .on('click', (event, d) => {
          event.stopPropagation();
          const agreementId = d.agreementId ?? d.id;
          if (onEdgeClick) onEdgeClick(agreementId);
          else router.push(`/agreement/${agreementId}`);
        });

      const node = g
        .append('g')
        .attr('class', 'graph-nodes')
        .selectAll<SVGCircleElement, GraphNode>('circle')
        .data(nodes, (d) => d.id)
        .join('circle')
        .attr('class', 'graph-node')
        .attr('r', NODE_RADIUS)
        .attr('fill', (d) => ARCHETYPE_FILL[d.archetype] ?? '#6B7280')
        .attr('stroke', (d) => (d.id === currentRoleId ? '#39FF14' : '#fff'))
        .attr('stroke-width', (d) => (d.id === currentRoleId ? 3 : 2))
        .style('cursor', 'pointer')
        .style('transition', `${OPACITY_TRANSITION}, r 150ms ease`)
        .on('click', (event, d) => {
          event.stopPropagation();
          if (focusedNodeId === d.id) {
            if (onNodeClick) onNodeClick(d.id);
            else router.push(`/founder/${d.id}`);
            return;
          }
          setFocus(d.id);
        })
        .call(
          d3
            .drag<SVGCircleElement, GraphNode>()
            .on('start', (event, d) => {
              if (!event.active) simulation.alphaTarget(0.25).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on('drag', (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
              updateEdgeLayout();
            })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );

      const label = g
        .append('g')
        .attr('class', 'graph-labels')
        .selectAll<SVGTextElement, GraphNode>('text')
        .data(nodes, (d) => d.id)
        .join('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .style('pointer-events', 'none')
        .style('transition', OPACITY_TRANSITION)
        .text((d) => {
          const role = roles.find((r) => r.id === d.id);
          return role ? getGraphNodeHandle(role) : d.playerName?.split(/\s+/)[0] ?? d.roleName.split(/\s+/)[0];
        });

      const subtitleLabel = g
        .append('g')
        .selectAll<SVGTextElement, GraphNode>('text')
        .data(nodes, (d) => d.id)
        .join('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 45)
        .attr('fill', 'currentColor')
        .attr('font-size', '10px')
        .style('pointer-events', 'none')
        .style('transition', OPACITY_TRANSITION)
        .text((d) => d.roleName.split(' ').slice(0, 2).join(' '));

      simulation.on('tick', () => {
        node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
        label.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
        subtitleLabel.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
        updateEdgeLayout();
      });

      applyRestOpacity();
      linkForce.links(edges);
      simulation.alpha(0.85).restart();

      return () => {
        document.removeEventListener('click', handleDocumentPointer, true);
        document.removeEventListener('touchend', handleDocumentPointer, true);
        simulation.stop();
        simulationRef.current = null;
      };
    }, [
      roles,
      agreements,
      edgeStyle,
      graphFilters,
      currentRoleId,
      dimensions,
      router,
      onNodeClick,
      onEdgeClick,
    ]);

    if (roles.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No roles yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">Claim a role to get started</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full min-h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden graph-container">
        <div className="absolute top-3 right-3 z-10 flex gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={zoomIn}
            aria-label="Zoom in"
            className="h-9 w-9 p-0 shadow-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-600"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={zoomOut}
            aria-label="Zoom out"
            className="h-9 w-9 p-0 shadow-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-600"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
      </div>
    );
  }
);

GameGraph.displayName = 'GameGraph';
