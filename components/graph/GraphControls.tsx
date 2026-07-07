'use client';

import React from 'react';
import { type GraphEdgeStyle } from '@/lib/graphArcEdges';
import { type GraphFilterState } from '@/lib/graphFilters';
import { GraphFilterControls } from './GraphFilterControls';
import { GraphViewSettings } from './GraphViewSettings';
import { GraphHelpLegend } from './GraphHelpLegend';
import { Card } from '@/components/ui/Card';

interface GraphControlsProps {
  graphFilters: GraphFilterState;
  onGraphFiltersChange: (filters: GraphFilterState) => void;
  edgeStyle: GraphEdgeStyle;
  onEdgeStyleChange: (style: GraphEdgeStyle) => void;
  onZoomReset?: () => void;
  onCenterView?: () => void;
}

/** Desktop-only inline panel; mobile uses GraphToolbar modals instead. */
export function GraphControls({
  graphFilters,
  onGraphFiltersChange,
  edgeStyle,
  onEdgeStyleChange,
  onZoomReset,
  onCenterView,
}: GraphControlsProps) {
  return (
    <Card className="p-4 hidden lg:block">
      <div className="grid lg:grid-cols-3 gap-8">
        <GraphFilterControls
          graphFilters={graphFilters}
          onGraphFiltersChange={onGraphFiltersChange}
        />
        <GraphViewSettings
          edgeStyle={edgeStyle}
          onEdgeStyleChange={onEdgeStyleChange}
          onZoomReset={onZoomReset}
          onCenterView={onCenterView}
        />
        <GraphHelpLegend />
      </div>
    </Card>
  );
}
