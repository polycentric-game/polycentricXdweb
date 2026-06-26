'use client';

import React from 'react';
import { AgreementStatus } from '@/lib/types';
import { GRAPH_EDGE_STYLE_OPTIONS, type GraphEdgeStyle } from '@/lib/graphArcEdges';
import {
  ALL_AGREEMENT_STATUSES,
  type GraphFilterState,
} from '@/lib/graphFilters';
import { ARCHETYPES } from '@/lib/roleTemplates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Maximize2, RotateCcw } from 'lucide-react';

interface GraphControlsProps {
  graphFilters: GraphFilterState;
  onGraphFiltersChange: (filters: GraphFilterState) => void;
  edgeStyle: GraphEdgeStyle;
  onEdgeStyleChange: (style: GraphEdgeStyle) => void;
  onZoomReset?: () => void;
  onCenterView?: () => void;
}

const statusOptions: { value: AgreementStatus; label: string; color: string }[] = [
  { value: 'proposed', label: 'Proposed', color: 'bg-blue-500' },
  { value: 'revised', label: 'Revised', color: 'bg-yellow-500' },
  { value: 'approved', label: 'Approved', color: 'bg-primary' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
];

const ARCHETYPE_COLORS: Record<string, string> = {
  funder: 'bg-emerald-500',
  builder: 'bg-blue-500',
  organizer: 'bg-yellow-500',
  storyteller: 'bg-purple-500',
  strategist: 'bg-red-500',
};

const PARTY_SIZE_OPTIONS = [2, 3, 4, 5, 6] as const;
const PAIR_WEIGHT_OPTIONS = [1, 2, 3, 4] as const;

export function GraphControls({
  graphFilters,
  onGraphFiltersChange,
  edgeStyle,
  onEdgeStyleChange,
  onZoomReset,
  onCenterView,
}: GraphControlsProps) {
  const toggleStatus = (status: AgreementStatus) => {
    const enabled = new Set(graphFilters.enabledStatuses);
    if (enabled.has(status)) {
      if (enabled.size <= 1) return;
      enabled.delete(status);
    } else {
      enabled.add(status);
    }
    onGraphFiltersChange({
      ...graphFilters,
      enabledStatuses: ALL_AGREEMENT_STATUSES.filter((s) => enabled.has(s)),
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
            Agreement status
          </h3>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const active = graphFilters.enabledStatuses.includes(option.value);
              return (
                <Button
                  key={option.value}
                  variant={active ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => toggleStatus(option.value)}
                  className="flex items-center space-x-2"
                >
                  <div className={`w-3 h-3 rounded-full ${option.color}`} />
                  <span>{option.label}</span>
                </Button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Toggle which agreement types appear as edges. Layout updates when filters change.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
            Min party size
          </h3>
          <div className="flex flex-wrap gap-2">
            {PARTY_SIZE_OPTIONS.map((size) => (
              <Button
                key={size}
                variant={graphFilters.minPartySize === size ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onGraphFiltersChange({ ...graphFilters, minPartySize: size })}
              >
                ≥ {size}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Hide edges from smaller multilateral agreements (weight = party count).
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
            Min parallel edges
          </h3>
          <div className="flex flex-wrap gap-2">
            {PAIR_WEIGHT_OPTIONS.map((weight) => (
              <Button
                key={weight}
                variant={graphFilters.minPairWeight === weight ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onGraphFiltersChange({ ...graphFilters, minPairWeight: weight })}
              >
                ≥ {weight}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Show only node pairs with at least this many agreements between them.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
            Edge Style
          </h3>
          <div className="flex flex-wrap gap-2">
            {GRAPH_EDGE_STYLE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={edgeStyle === option.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onEdgeStyleChange(option.value)}
                title={option.description}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {GRAPH_EDGE_STYLE_OPTIONS.find((o) => o.value === edgeStyle)?.description}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">View Controls</h3>
          <div className="flex flex-wrap gap-2">
            {onZoomReset && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onZoomReset}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset layout</span>
              </Button>
            )}
            {onCenterView && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCenterView}
                className="flex items-center space-x-1"
              >
                <Maximize2 className="h-4 w-4" />
                <span>Center</span>
              </Button>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
            <div>
              <strong>Mouse controls:</strong>
            </div>
            <div>• Drag background: Pan view</div>
            <div>• Zoom in/out: Buttons at top-right of graph (no pinch on mobile)</div>
            <div>• Tap a node: Focus its connections</div>
            <div>• Tap the same node again: Open role profile</div>
            <div>• Tap an edge: Focus all edges in that agreement</div>
            <div>• Tap the same edge again: Open agreement detail</div>
            <div>• Tap empty space: Clear focus</div>
            <div>• Drag nodes: Reposition (layout re-settles on release)</div>
            <div>• Reset layout: Re-run force simulation from circle seed</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>
            <strong>Node Colors (Archetype):</strong>
          </div>
          {ARCHETYPES.map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${ARCHETYPE_COLORS[value] ?? 'bg-gray-500'}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
