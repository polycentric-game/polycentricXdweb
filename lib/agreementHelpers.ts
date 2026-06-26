import { Agreement, AgreementStatus, AgreementVersion } from './types';

type LegacyVersion = AgreementVersion & {
  partyACommitment?: string;
  partyBCommitment?: string;
};

type AgreementLike = {
  partyRoleIds?: string[];
  partyARoleId?: string;
  partyBRoleId?: string;
};

export function getPartyRoleIds(agreement: AgreementLike): string[] {
  if (agreement.partyRoleIds && agreement.partyRoleIds.length > 0) {
    return agreement.partyRoleIds;
  }
  if (agreement.partyARoleId && agreement.partyBRoleId) {
    return [agreement.partyARoleId, agreement.partyBRoleId];
  }
  return [];
}

export function buildCommitmentsFromLegacy(
  version: LegacyVersion,
  partyRoleIds: string[]
): Record<string, string> {
  const commitments: Record<string, string> = { ...(version.commitments ?? {}) };

  if (partyRoleIds[0] && version.partyACommitment != null && !commitments[partyRoleIds[0]]) {
    commitments[partyRoleIds[0]] = version.partyACommitment;
  }
  if (partyRoleIds[1] && version.partyBCommitment != null && !commitments[partyRoleIds[1]]) {
    commitments[partyRoleIds[1]] = version.partyBCommitment;
  }

  return commitments;
}

export function normalizeVersion(version: LegacyVersion, partyRoleIds: string[]): AgreementVersion {
  return {
    versionNumber: version.versionNumber,
    commitments: buildCommitmentsFromLegacy(version, partyRoleIds),
    notes: version.notes,
    proposedBy: version.proposedBy,
    proposedAt: version.proposedAt,
    approvedBy: version.approvedBy ?? [],
    signatures: version.signatures,
  };
}

export function normalizeAgreement(agreement: Agreement): Agreement {
  const partyRoleIds = getPartyRoleIds(agreement);
  return {
    ...agreement,
    partyRoleIds,
    versions: agreement.versions.map((v) => normalizeVersion(v, partyRoleIds)),
  };
}

export function isRoleInAgreement(agreement: AgreementLike, roleId: string): boolean {
  return getPartyRoleIds(agreement).includes(roleId);
}

export function samePartySet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, index) => id === sortedB[index]);
}

export function getCommitment(version: AgreementVersion, roleId: string): string {
  return version.commitments[roleId] ?? '';
}

export function partyCount(agreement: AgreementLike): number {
  return getPartyRoleIds(agreement).length;
}

export function allPartiesApproved(version: AgreementVersion, partyRoleIds: string[]): boolean {
  return partyRoleIds.every(
    (id) => version.approvedBy.includes(id) && Boolean(version.signatures?.[id])
  );
}

export interface MultipartyGraphEdge {
  id: string;
  agreementId: string;
  source: string;
  target: string;
  status: AgreementStatus;
}

/** Map an agreement to graph edges (one edge for 2 parties, ring for 3+). */
export function agreementToGraphEdges(agreement: Agreement): MultipartyGraphEdge[] {
  const partyRoleIds = getPartyRoleIds(agreement);
  if (partyRoleIds.length < 2) return [];

  if (partyRoleIds.length === 2) {
    return [
      {
        id: agreement.id,
        agreementId: agreement.id,
        source: partyRoleIds[0],
        target: partyRoleIds[1],
        status: agreement.status,
      },
    ];
  }

  return partyRoleIds.map((source, index) => {
    const target = partyRoleIds[(index + 1) % partyRoleIds.length];
    return {
      id: `${agreement.id}-${source}-${target}`,
      agreementId: agreement.id,
      source,
      target,
      status: agreement.status,
    };
  });
}

export function agreementsToGraphEdges(agreements: Agreement[]): MultipartyGraphEdge[] {
  return agreements.flatMap(agreementToGraphEdges);
}

export function formatPartyList(roleIds: string[], getName: (id: string) => string): string {
  const names = roleIds.map(getName);
  if (names.length <= 2) return names.join(' & ');
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}
