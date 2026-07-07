'use client';

import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Eye, HelpCircle } from 'lucide-react';
import { type GraphEdgeStyle } from '@/lib/graphArcEdges';
import { countActiveFilterDeviations, type GraphFilterState } from '@/lib/graphFilters';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { GraphFilterControls } from './GraphFilterControls';
import { GraphViewSettings } from './GraphViewSettings';
import { GraphHelpLegend } from './GraphHelpLegend';
import { cn } from '@/lib/utils';

const GRAPH_HELP_SEEN_KEY = 'polycentric_graph_help_seen';

type GraphModal = 'filters' | 'view' | 'help' | null;

interface GraphToolbarProps {
  graphFilters: GraphFilterState;
  onGraphFiltersChange: (filters: GraphFilterState) => void;
  edgeStyle: GraphEdgeStyle;
  onEdgeStyleChange: (style: GraphEdgeStyle) => void;
  onZoomReset?: () => void;
  onCenterView?: () => void;
}

const toolbarButtonClass =
  'h-11 w-11 md:h-9 md:w-9 p-0 shadow-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-600 pointer-events-auto';

export function GraphToolbar({
  graphFilters,
  onGraphFiltersChange,
  edgeStyle,
  onEdgeStyleChange,
  onZoomReset,
  onCenterView,
}: GraphToolbarProps) {
  const [activeModal, setActiveModal] = useState<GraphModal>(null);
  const filterBadgeCount = countActiveFilterDeviations(graphFilters);

  useEffect(() => {
    try {
      if (localStorage.getItem(GRAPH_HELP_SEEN_KEY) !== '1') {
        setActiveModal('help');
        localStorage.setItem(GRAPH_HELP_SEEN_KEY, '1');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <div
        className={cn(
          'absolute z-10 flex gap-1.5 pointer-events-none',
          'bottom-3 left-1/2 -translate-x-1/2',
          'md:bottom-auto md:top-3 md:left-3 md:translate-x-0'
        )}
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setActiveModal('filters')}
          aria-label="Graph filters"
          className={cn(toolbarButtonClass, 'relative')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filterBadgeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-black">
              {filterBadgeCount}
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setActiveModal('view')}
          aria-label="View settings"
          className={toolbarButtonClass}
        >
          <Eye className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setActiveModal('help')}
          aria-label="Help and legend"
          className={toolbarButtonClass}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      <Modal isOpen={activeModal === 'filters'} onClose={closeModal} title="Graph filters" size="md">
        <GraphFilterControls
          graphFilters={graphFilters}
          onGraphFiltersChange={onGraphFiltersChange}
        />
      </Modal>

      <Modal isOpen={activeModal === 'view'} onClose={closeModal} title="View settings" size="md">
        <GraphViewSettings
          edgeStyle={edgeStyle}
          onEdgeStyleChange={onEdgeStyleChange}
          onZoomReset={onZoomReset}
          onCenterView={onCenterView}
        />
      </Modal>

      <Modal isOpen={activeModal === 'help'} onClose={closeModal} title="Help & legend" size="md">
        <GraphHelpLegend />
      </Modal>
    </>
  );
}
