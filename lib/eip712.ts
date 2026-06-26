import { recoverTypedDataAddress } from 'viem';
import { Agreement } from './types';
import { roleStorage } from './storage';
import { userStorage } from './storage';
import { getPartyRoleIds } from './agreementHelpers';

export const EIP712_DOMAIN = {
  name: 'InfrastructureAgreementApp',
  version: '1',
  chainId: 1,
  verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const;

export const EIP712_TYPES = {
  InfrastructureAgreement: [
    { name: 'agreementId', type: 'string' },
    { name: 'partyA', type: 'address' },
    { name: 'partyB', type: 'address' },
    { name: 'termsHash', type: 'bytes32' },
  ],
} as const;

export async function buildEip712Message(agreement: Agreement): Promise<{
  agreementId: string;
  partyA: `0x${string}`;
  partyB: `0x${string}`;
  termsHash: `0x${string}`;
}> {
  const partyRoleIds = getPartyRoleIds(agreement);
  const roleA = await roleStorage.findById(partyRoleIds[0]);
  const roleB = await roleStorage.findById(partyRoleIds[1] ?? partyRoleIds[0]);

  if (!roleA || !roleB) {
    throw new Error('Roles not found for agreement');
  }

  const userA = await userStorage.findById(roleA.userId);
  const userB = await userStorage.findById(roleB.userId);

  if (!userA?.ethereumAddress || !userB?.ethereumAddress) {
    throw new Error('Role holder Ethereum addresses not found');
  }

  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) {
    throw new Error('Invalid agreement version');
  }

  let termsHash = agreement.termsHash;
  if (!termsHash) {
    const { buildCanonicalTermsJson, computeTermsHash } = await import('./vc');
    const canonicalTerms = await buildCanonicalTermsJson(agreement);
    termsHash = computeTermsHash(canonicalTerms);
  }

  return {
    agreementId: agreement.id,
    partyA: userA.ethereumAddress.toLowerCase() as `0x${string}`,
    partyB: userB.ethereumAddress.toLowerCase() as `0x${string}`,
    termsHash: termsHash as `0x${string}`,
  };
}

export async function verifyAgreementSignature(
  agreement: Agreement,
  signerAddress: string,
  signature: `0x${string}`
): Promise<boolean> {
  try {
    const message = await buildEip712Message(agreement);

    const normalizedSigner = signerAddress.toLowerCase();
    const normalizedPartyA = message.partyA.toLowerCase();
    const normalizedPartyB = message.partyB.toLowerCase();

    if (normalizedSigner !== normalizedPartyA && normalizedSigner !== normalizedPartyB) {
      return false;
    }

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP712_DOMAIN,
      types: EIP712_TYPES,
      primaryType: 'InfrastructureAgreement',
      message,
      signature,
    });

    return recoveredAddress.toLowerCase() === normalizedSigner;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
