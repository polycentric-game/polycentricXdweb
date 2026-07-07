'use client';

import React from 'react';
import { AgreementStatus } from '@/lib/types';
import { ALL_AGREEMENT_STATUSES, type GraphFilterState } from '@/lib/graphFilters';
import {
  PARTY_SIZE_OPTIONS,
  PAIR_WEIGHT_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/graphControlConstants';
import { ColorSwatch } from './ColorSwatch';
import { Button } from '@/components/ui/Button';

interface GraphFilterControlsProps {
  graphFilters: GraphFilterState;
  onGraphFiltersChange: (filters: GraphFilterState) => void;
}

export function GraphFilterControls({
  graphFilters,
  onGraphFiltersChange,
}: GraphFilterControlsProps) {
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
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
          Agreement status
        </h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = graphFilters.enabledStatuses.includes(option.value);
            return (
              <Button
                key={option.value}
                variant={active ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => toggleStatus(option.value)}
                className="flex items-center space-x-2 min-h-[44px] md:min-h-0"
              >
                <ColorSwatch color={option.color} />
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
              className="min-h-[44px] md:min-h-0 min-w-[44px]"
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
              className="min-h-[44px] md:min-h-0 min-w-[44px]"
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
    </div>
  );
}
