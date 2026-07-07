'use client';

import React from 'react';
import { GRAPH_EDGE_STYLE_OPTIONS, type GraphEdgeStyle } from '@/lib/graphArcEdges';
import { Button } from '@/components/ui/Button';
import { Maximize2, RotateCcw } from 'lucide-react';

interface GraphViewSettingsProps {
  edgeStyle: GraphEdgeStyle;
  onEdgeStyleChange: (style: GraphEdgeStyle) => void;
  onZoomReset?: () => void;
  onCenterView?: () => void;
}

export function GraphViewSettings({
  edgeStyle,
  onEdgeStyleChange,
  onZoomReset,
  onCenterView,
}: GraphViewSettingsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
          Edge style
        </h3>
        <div className="flex flex-wrap gap-2">
          {GRAPH_EDGE_STYLE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={edgeStyle === option.value ? 'primary' : 'secondary'}
              size="sm"
              className="min-h-[44px] md:min-h-0"
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

      <div>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Layout</h3>
        <div className="flex flex-wrap gap-2">
          {onZoomReset && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onZoomReset}
              className="flex items-center space-x-1 min-h-[44px] md:min-h-0"
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
              className="flex items-center space-x-1 min-h-[44px] md:min-h-0"
            >
              <Maximize2 className="h-4 w-4" />
              <span>Center view</span>
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Reset re-runs the force simulation from the circle seed. Center fits all nodes in view.
          Use the zoom buttons at the top-right of the graph to zoom in and out.
        </p>
      </div>
    </div>
  );
}
