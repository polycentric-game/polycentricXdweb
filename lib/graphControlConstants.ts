import { AgreementStatus } from './types';
import type { Archetype } from './roleTemplates';

/** Edge stroke colors — must match GameGraph / FounderGraph SVG strokes. */
export const AGREEMENT_STATUS_COLORS: Record<AgreementStatus, string> = {
  proposed: '#3B82F6',
  revised: '#EAB308',
  approved: '#39FF14',
  completed: '#10B981',
};

/** Node fill colors — must match GameGraph / FounderGraph SVG fills. */
export const ARCHETYPE_COLORS: Record<Archetype, string> = {
  funder: '#10B981',
  builder: '#3B82F6',
  organizer: '#EAB308',
  storyteller: '#A855F7',
  strategist: '#EF4444',
};

export const DEFAULT_ARCHETYPE_COLOR = '#6B7280';

export function agreementStatusColor(status: AgreementStatus | string): string {
  return (
    AGREEMENT_STATUS_COLORS[status as AgreementStatus] ?? DEFAULT_ARCHETYPE_COLOR
  );
}

export function archetypeColor(archetype: string): string {
  return ARCHETYPE_COLORS[archetype as Archetype] ?? DEFAULT_ARCHETYPE_COLOR;
}

export const STATUS_OPTIONS: {
  value: AgreementStatus;
  label: string;
  color: string;
}[] = [
  { value: 'proposed', label: 'Proposed', color: AGREEMENT_STATUS_COLORS.proposed },
  { value: 'revised', label: 'Revised', color: AGREEMENT_STATUS_COLORS.revised },
  { value: 'approved', label: 'Approved', color: AGREEMENT_STATUS_COLORS.approved },
  { value: 'completed', label: 'Completed', color: AGREEMENT_STATUS_COLORS.completed },
];

export const PARTY_SIZE_OPTIONS = [2, 3, 4, 5, 6] as const;
export const PAIR_WEIGHT_OPTIONS = [1, 2, 3, 4] as const;
