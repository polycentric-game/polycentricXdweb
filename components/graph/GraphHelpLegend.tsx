'use client';

import React from 'react';
import { ARCHETYPES } from '@/lib/roleTemplates';
import { ARCHETYPE_COLORS, STATUS_OPTIONS } from '@/lib/graphControlConstants';
import { ColorSwatch } from './ColorSwatch';

export function GraphHelpLegend() {
  return (
    <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300">
      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tap &amp; click</h3>
        <ul className="space-y-1.5 text-xs md:text-sm">
          <li>• Tap a node: Focus its connections</li>
          <li>• Tap the same node again: Open role profile</li>
          <li>• Tap an edge: Focus all edges in that agreement</li>
          <li>• Tap the same edge again: Open agreement detail</li>
          <li>• Tap empty space: Clear focus</li>
          <li>• Drag nodes: Reposition (layout re-settles on release)</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Pan &amp; zoom</h3>
        <ul className="space-y-1.5 text-xs md:text-sm">
          <li>• Drag background: Pan view (desktop)</li>
          <li>• Zoom buttons: Top-right of graph (no pinch on mobile)</li>
          <li>• Scroll vertically on the graph area to reach content below</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Edge colors</h3>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2 text-xs md:text-sm">
              <ColorSwatch color={option.color} />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Node colors (archetype)
        </h3>
        <div className="space-y-2">
          {ARCHETYPES.map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2 text-xs md:text-sm">
              <ColorSwatch color={ARCHETYPE_COLORS[value]} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
