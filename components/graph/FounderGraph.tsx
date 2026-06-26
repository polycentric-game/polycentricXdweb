'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { Role, Agreement, GraphNode, GraphEdge, getGraphNodeHandle, getArchetypeForRole } from '@/lib/types';
import { getPartyRoleIds, isRoleInAgreement } from '@/lib/agreementHelpers';
import { assignParallelLinkMeta, layoutForLink, type ArcLayoutLink } from '@/lib/graphArcEdges';

interface FounderGraphProps {
  role: Role;
  roles: Role[];
  agreements: Agreement[];
  className?: string;
}

const ARCHETYPE_FILL: Record<string, string> = {
  funder: '#10B981',
  builder: '#3B82F6',
  organizer: '#EAB308',
  storyteller: '#A855F7',
  strategist: '#EF4444',
};

function founderGraphEdges(role: Role, agreements: Agreement[]): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const agreement of agreements) {
    if (!isRoleInAgreement(agreement, role.id)) continue;

    const others = getPartyRoleIds(agreement).filter((id) => id !== role.id);
    for (const otherId of others) {
      edges.push({
        id: `${agreement.id}-${role.id}-${otherId}`,
        agreementId: agreement.id,
        source: role.id,
        target: otherId,
        status: agreement.status,
      });
    }
  }

  return edges;
}

export function FounderGraph({ role, roles, agreements, className = '' }: FounderGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const container = svgRef.current.parentElement;
        setDimensions({
          width: container.clientWidth,
          height: Math.max(300, container.clientHeight),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    const roleAgreements = agreements.filter((a) => isRoleInAgreement(a, role.id));

    const connectedRoleIds = new Set<string>();
    roleAgreements.forEach((agreement) => {
      getPartyRoleIds(agreement)
        .filter((id) => id !== role.id)
        .forEach((id) => connectedRoleIds.add(id));
    });

    const connectedRoles = roles.filter((r) => connectedRoleIds.has(r.id));

    const centerArchetype = getArchetypeForRole(role) ?? 'builder';

    const nodes: GraphNode[] = [
      {
        id: role.id,
        roleName: role.template?.name ?? 'Unknown',
        archetype: centerArchetype,
        playerName: role.playerName,
        x: width / 2,
        y: height / 2,
      },
      ...connectedRoles.map((r, index) => {
        const angle = (index / connectedRoles.length) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.3;
        return {
          id: r.id,
          roleName: r.template?.name ?? 'Unknown',
          archetype: getArchetypeForRole(r) ?? 'builder',
          playerName: r.playerName,
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
        };
      }),
    ];

    const edges = assignParallelLinkMeta(founderGraphEdges(role, roleAgreements));

    const updateEdgeLayout = () => {
      link.attr('d', (d) => layoutForLink(d, 'symmetric-arc').path);
    };

    if (nodes.length === 1) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('font-size', '14px')
        .text('No agreements yet');
      return;
    }

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    const g = svg.append('g');

    const link = g
      .append('g')
      .selectAll('path')
      .data(edges)
      .enter()
      .append('path')
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
      .attr('stroke-opacity', 0.7)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        router.push(`/agreement/${d.agreementId ?? d.id}`);
      });

    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => (d.id === role.id ? 20 : 15))
      .attr('fill', (d) => {
        if (d.id === role.id) return '#39FF14';
        return ARCHETYPE_FILL[d.archetype] ?? '#6B7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', (d) => (d.id === role.id ? 3 : 2))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (d.id !== role.id) {
          router.push(`/founder/${d.id}`);
        }
      });

    const label = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', (d) => (d.id === role.id ? '11px' : '9px'))
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .text((d) => {
        const r = roles.find((item) => item.id === d.id) ?? (d.id === role.id ? role : null);
        return r ? getGraphNodeHandle(r) : d.playerName?.split(/\s+/)[0] ?? d.roleName.split(/\s+/)[0];
      });

    simulation.on('tick', () => {
      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
      label.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
      updateEdgeLayout();
    });

    setTimeout(() => simulation.stop(), 2000);

    return () => {
      simulation.stop();
    };
  }, [role, roles, agreements, dimensions, router]);

  return (
    <div
      className={`w-full h-full min-h-[300px] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}
    >
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
    </div>
  );
}
