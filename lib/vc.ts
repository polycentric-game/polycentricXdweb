import { Agreement } from './types';
import { getRoleDisplayName } from './types';
import { getIssuerDid, addressToDid } from './issuer';
import { roleStorage } from './storage';
import { userStorage } from './storage';
import { keccak256, stringToHex } from 'viem';
import { getCommitment, getPartyRoleIds } from './agreementHelpers';

export async function buildInfrastructureAgreementVcPayload(agreement: Agreement): Promise<any> {
  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) {
    throw new Error('Invalid agreement version');
  }

  const partyRoleIds = getPartyRoleIds(agreement);
  const roles = await Promise.all(partyRoleIds.map((id) => roleStorage.findById(id)));
  if (roles.some((r) => !r)) {
    throw new Error('Roles not found for agreement');
  }

  const users = await Promise.all(roles.map((role) => userStorage.findById(role!.userId)));
  if (users.some((u) => !u?.ethereumAddress)) {
    throw new Error('Role holder Ethereum addresses not found');
  }

  const finalizedAt = agreement.finalizedAt || new Date().toISOString();
  const termsHash = agreement.termsHash || '0x0000000000000000000000000000000000000000000000000000000000000000';

  const parties = roles.map((role, index) => {
    const user = users[index]!;
    const address = user.ethereumAddress!.toLowerCase();
    return {
      id: addressToDid(address),
      ethAddress: address,
      roleName: getRoleDisplayName(role!),
      commitment: getCommitment(currentVersion, role!.id),
      signature: currentVersion.signatures?.[role!.id] ?? null,
    };
  });

  return {
    iss: getIssuerDid(),
    sub: parties[0]?.id,
    nbf: Math.floor(new Date(finalizedAt).getTime() / 1000),
    vc: {
      '@context': ['https://www.w3.org/ns/credentials/v2'],
      type: ['VerifiableCredential', 'InfrastructureAgreementCredential'],
      credentialSubject: {
        agreementId: agreement.id,
        parties,
        commitments: currentVersion.commitments,
        notes: currentVersion.notes || '',
        agreementHash: termsHash,
        signedAt: finalizedAt,
      },
    },
  };
}

/** @deprecated Use buildInfrastructureAgreementVcPayload */
export const buildEquitySwapVcPayload = buildInfrastructureAgreementVcPayload;

export function computeTermsHash(canonicalTermsJson: string): `0x${string}` {
  const hex = stringToHex(canonicalTermsJson);
  return keccak256(hex);
}

export async function buildCanonicalTermsJson(agreement: Agreement): Promise<string> {
  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) {
    throw new Error('Invalid agreement version');
  }

  const partyRoleIds = getPartyRoleIds(agreement);
  const roles = await Promise.all(partyRoleIds.map((id) => roleStorage.findById(id)));
  if (roles.some((r) => !r)) {
    throw new Error('Roles not found for agreement');
  }

  const users = await Promise.all(roles.map((role) => userStorage.findById(role!.userId)));
  if (users.some((u) => !u?.ethereumAddress)) {
    throw new Error('Role holder Ethereum addresses not found');
  }

  const canonicalTerms = {
    agreementId: agreement.id,
    partyRoleIds,
    commitments: currentVersion.commitments,
    notes: currentVersion.notes || '',
    version: currentVersion.versionNumber,
    createdAt: agreement.createdAt,
  };

  const sortedKeys = Object.keys(canonicalTerms).sort();
  const sortedTerms: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedTerms[key] = (canonicalTerms as Record<string, unknown>)[key];
  }
  return JSON.stringify(sortedTerms);
}
