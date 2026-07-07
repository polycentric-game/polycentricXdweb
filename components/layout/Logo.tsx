import { cn } from '@/lib/utils';
import {
  AGREEMENT_STATUS_COLORS,
  ARCHETYPE_COLORS,
} from '@/lib/graphControlConstants';

interface LogoProps {
  className?: string;
}

/** Node colors: large nodes use status colors (3); bottom large node uses funder archetype. */
const LOGO_NODES: { cx: number; cy: number; r: number; fill: string }[] = [
  // Large nodes — agreement status colors
  { cx: 140.71, cy: 70, r: 17, fill: AGREEMENT_STATUS_COLORS.proposed },
  { cx: 300.71, cy: 110, r: 17, fill: AGREEMENT_STATUS_COLORS.revised },
  { cx: 270.71, cy: 185, r: 17, fill: AGREEMENT_STATUS_COLORS.approved },
  { cx: 140.71, cy: 360, r: 17, fill: ARCHETYPE_COLORS.funder },
  // Small nodes — archetype colors
  { cx: 140.71, cy: 135, r: 8, fill: ARCHETYPE_COLORS.funder },
  { cx: 140.71, cy: 200, r: 8, fill: ARCHETYPE_COLORS.builder },
  { cx: 140.71, cy: 280, r: 8, fill: ARCHETYPE_COLORS.organizer },
  { cx: 230.71, cy: 55, r: 8, fill: ARCHETYPE_COLORS.storyteller },
  { cx: 180.71, cy: 205, r: 8, fill: ARCHETYPE_COLORS.strategist },
  { cx: 95.71, cy: 320, r: 8, fill: ARCHETYPE_COLORS.builder },
];

export function Logo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 421.43 420"
      className={cn('h-8 w-8 shrink-0 text-gray-900 dark:text-white', className)}
      aria-hidden
    >
      <g stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round">
        <line x1="140.71" y1="70" x2="140.71" y2="360" />
        <line x1="140.71" y1="70" x2="230.71" y2="55" />
        <line x1="230.71" y1="55" x2="300.71" y2="110" />
        <line x1="300.71" y1="110" x2="270.71" y2="185" />
        <line x1="270.71" y1="185" x2="180.71" y2="205" />
        <line x1="180.71" y1="205" x2="140.71" y2="200" />
        <line x1="140.71" y1="70" x2="300.71" y2="110" />
        <line x1="230.71" y1="55" x2="270.71" y2="185" />
        <line x1="140.71" y1="200" x2="300.71" y2="110" />
        <line x1="140.71" y1="360" x2="180.71" y2="205" />
        <line x1="140.71" y1="135" x2="230.71" y2="55" />
        <line x1="140.71" y1="280" x2="95.71" y2="320" />
      </g>
      <g stroke="#fff" strokeWidth={1.5}>
        {LOGO_NODES.map((node) => (
          <circle
            key={`${node.cx}-${node.cy}`}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill={node.fill}
          />
        ))}
      </g>
    </svg>
  );
}
