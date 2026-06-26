import { Agreement, AgreementStatus } from './types';
import { getPartyRoleIds } from './agreementHelpers';
import { agreementsToGraphEdges } from './agreementHelpers';
import { assignParallelLinkMeta, type ArcLayoutLink } from './graphArcEdges';

export const ALL_AGREEMENT_STATUSES: AgreementStatus[] = [
  'proposed',
  'revised',
  'approved',
  'completed',
];

export interface GraphFilterState {
  enabledStatuses: AgreementStatus[];
  /** Minimum agreement party count (edge weight proxy). */
  minPartySize: number;
  /** Minimum parallel agreements between the same node pair. */
  minPairWeight: number;
}

export const DEFAULT_GRAPH_FILTERS: GraphFilterState = {
  enabledStatuses: [...ALL_AGREEMENT_STATUSES],
  minPartySize: 2,
  minPairWeight: 1,
};

export function filterAgreementsForGraph(
  agreements: Agreement[],
  filters: GraphFilterState
): Agreement[] {
  const statusSet = new Set(filters.enabledStatuses);
  return agreements.filter((a) => {
    if (!statusSet.has(a.status)) return false;
    return getPartyRoleIds(a).length >= filters.minPartySize;
  });
}

export function buildFilteredGraphEdges(
  agreements: Agreement[],
  filters: GraphFilterState
): ArcLayoutLink[] {
  const filtered = filterAgreementsForGraph(agreements, filters);
  const edges = assignParallelLinkMeta(
    agreementsToGraphEdges(filtered).map((edge) => ({
      id: edge.id,
      agreementId: edge.agreementId,
      source: edge.source,
      target: edge.target,
      status: edge.status,
    }))
  );

  if (filters.minPairWeight <= 1) return edges;
  return edges.filter((e) => e.linkTotal >= filters.minPairWeight);
}
