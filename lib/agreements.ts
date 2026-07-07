import { Agreement, AgreementVersion, AgreementStatus, Role } from './types';
import { agreementStorage, roleStorage, generateAgreementId } from './storage';
import { validateAgreementTerms } from './validation';
import {
  allPartiesApproved,
  getPartyRoleIds,
  isRoleInAgreement,
  normalizeAgreement,
} from './agreementHelpers';

export async function createAgreement(
  partyRoleIds: string[],
  commitments: Record<string, string>,
  notes: string,
  initiatedBy: string,
  signature: string
): Promise<{ success: boolean; agreement?: Agreement; error?: string }> {
  const uniqueParties = Array.from(new Set(partyRoleIds));

  if (uniqueParties.length < 2) {
    return { success: false, error: 'An agreement requires at least two parties' };
  }

  if (!uniqueParties.includes(initiatedBy)) {
    return { success: false, error: 'Proposer must be a party to the agreement' };
  }

  const validationErrors = validateAgreementTerms(uniqueParties, commitments, notes);
  if (validationErrors.length > 0) {
    return { success: false, error: validationErrors[0].message };
  }

  if (!signature) {
    return { success: false, error: 'Signature is required to create agreement' };
  }

  const signatures: { [roleId: string]: string } = { [initiatedBy]: signature };

  const initialVersion: AgreementVersion = {
    versionNumber: 0,
    commitments,
    notes,
    proposedBy: initiatedBy,
    proposedAt: new Date().toISOString(),
    approvedBy: [initiatedBy],
    signatures,
  };

  const agreementId = await generateAgreementId();
  const agreement: Agreement = {
    id: agreementId,
    partyRoleIds: uniqueParties,
    status: 'proposed',
    initiatedBy,
    lastRevisedBy: initiatedBy,
    currentVersion: 0,
    versions: [initialVersion],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await agreementStorage.save(agreement);
  return { success: true, agreement: normalizeAgreement(saved) };
}

export async function proposeRevision(
  agreementId: string,
  commitments: Record<string, string>,
  notes: string,
  proposedBy: string,
  signature: string
): Promise<{ success: boolean; agreement?: Agreement; error?: string }> {
  const agreement = await agreementStorage.findById(agreementId);
  if (!agreement) {
    return { success: false, error: 'Agreement not found' };
  }
  const normalized = normalizeAgreement(agreement);

  const partyRoleIds = getPartyRoleIds(normalized);

  const validationErrors = validateAgreementTerms(partyRoleIds, commitments, notes);
  if (validationErrors.length > 0) {
    return { success: false, error: validationErrors[0].message };
  }

  if (!isRoleInAgreement(normalized, proposedBy)) {
    return { success: false, error: 'You are not authorized to revise this agreement' };
  }

  if (normalized.status === 'approved') {
    return { success: false, error: 'Cannot revise approved agreements' };
  }

  if (!signature) {
    return { success: false, error: 'Signature is required to propose revision' };
  }

  const signatures: { [roleId: string]: string } = { [proposedBy]: signature };

  const newVersion: AgreementVersion = {
    versionNumber: normalized.versions.length,
    commitments,
    notes,
    proposedBy,
    proposedAt: new Date().toISOString(),
    approvedBy: [proposedBy],
    signatures,
  };

  const updatedAgreement: Agreement = {
    ...normalized,
    status: 'revised',
    lastRevisedBy: proposedBy,
    currentVersion: normalized.versions.length,
    versions: [...normalized.versions, newVersion],
    updatedAt: new Date().toISOString(),
  };

  const saved = await agreementStorage.save(updatedAgreement);
  return { success: true, agreement: normalizeAgreement(saved) };
}

export async function approveAgreement(
  agreementId: string,
  roleId: string,
  signature: string
): Promise<{ success: boolean; agreement?: Agreement; error?: string }> {
  const agreement = await agreementStorage.findById(agreementId);
  if (!agreement) {
    return { success: false, error: 'Agreement not found' };
  }
  const normalized = normalizeAgreement(agreement);

  if (!isRoleInAgreement(normalized, roleId)) {
    return { success: false, error: 'You are not authorized to approve this agreement' };
  }

  if (normalized.status === 'approved') {
    return { success: false, error: 'Agreement is already fully approved' };
  }

  const currentVersion = normalized.versions[normalized.currentVersion];
  if (!currentVersion) {
    return { success: false, error: 'Invalid agreement version' };
  }

  if (currentVersion.approvedBy.includes(roleId)) {
    return { success: false, error: 'You have already approved this version' };
  }

  if (!signature) {
    return { success: false, error: 'Signature is required to approve agreement' };
  }

  const signatures = { ...(currentVersion.signatures || {}), [roleId]: signature };
  const updatedApprovedBy = [...currentVersion.approvedBy, roleId];

  const updatedVersion: AgreementVersion = {
    ...currentVersion,
    approvedBy: updatedApprovedBy,
    signatures,
  };

  const updatedVersions = [...normalized.versions];
  updatedVersions[normalized.currentVersion] = updatedVersion;

  const partyRoleIds = getPartyRoleIds(normalized);
  const everyoneApproved = allPartiesApproved(updatedVersion, partyRoleIds);

  const newStatus: AgreementStatus = everyoneApproved ? 'approved' : normalized.status;

  const updatedAgreement: Agreement = {
    ...normalized,
    status: newStatus,
    versions: updatedVersions,
    updatedAt: new Date().toISOString(),
  };

  const saved = await agreementStorage.save(updatedAgreement);
  return { success: true, agreement: normalizeAgreement(saved) };
}

export function getStatusColor(status: AgreementStatus): string {
  switch (status) {
    case 'proposed':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    case 'revised':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    case 'approved':
      return 'text-primary bg-primary/10';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  }
}

export function getAgreementLabel(agreement: Agreement): string {
  return `${agreement.id}-${agreement.currentVersion}`;
}

export function canApproveAgreement(agreement: Agreement, roleId: string): boolean {
  if (agreement.status === 'approved') return false;
  if (!isRoleInAgreement(agreement, roleId)) return false;

  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) return false;

  return !currentVersion.approvedBy.includes(roleId);
}

export function canReviseAgreement(agreement: Agreement, roleId: string): boolean {
  if (agreement.status === 'approved') return false;
  return isRoleInAgreement(agreement, roleId);
}

export async function getOtherRoles(
  agreement: Agreement,
  currentRoleId: string
): Promise<Role[]> {
  const others = getPartyRoleIds(agreement).filter((id) => id !== currentRoleId);
  const roles = await Promise.all(others.map((id) => roleStorage.findById(id)));
  return roles.filter((r): r is Role => r !== null);
}

/** @deprecated Use getOtherRoles */
export async function getOtherRole(agreement: Agreement, currentRoleId: string): Promise<Role | null> {
  const others = await getOtherRoles(agreement, currentRoleId);
  return others[0] ?? null;
}
