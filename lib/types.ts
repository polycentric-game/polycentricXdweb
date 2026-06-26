import type { Archetype, RoleTemplate } from './roleTemplates';

// User (authentication)
export interface User {
  id: string;
  email?: string;
  ethereumAddress?: string;
  createdAt: string;
}

// Auth session
export interface AuthSession {
  userId: string;
  roleId?: string;
  gameId?: string;
  expiresAt: string;
}

// Multiplayer game session
export interface Game {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Client-side demo games are view-only and not stored in Supabase. */
  isDemo?: boolean;
}

// Player role instance (references a preset template within a game)
export interface Role {
  id: string;
  userId: string;
  gameId?: string;
  templateId: string;
  playerName?: string;
  createdAt: string;
  updatedAt: string;
  template?: RoleTemplate;
}

// Agreement version — narrative-only (Approach A), supports N parties
export interface AgreementVersion {
  versionNumber: number;
  /** roleId → what that role offers */
  commitments: Record<string, string>;
  notes: string;
  proposedBy: string; // roleId
  proposedAt: string;
  approvedBy: string[];
  signatures?: { [roleId: string]: string };
  /** @deprecated legacy bilateral format — migrated to commitments on read */
  partyACommitment?: string;
  partyBCommitment?: string;
}

export type AgreementStatus = 'proposed' | 'revised' | 'approved' | 'completed';

export interface Agreement {
  id: string;
  /** All participating role IDs (2 to N) */
  partyRoleIds: string[];
  status: AgreementStatus;
  initiatedBy: string;
  lastRevisedBy: string;
  currentVersion: number;
  versions: AgreementVersion[];
  createdAt: string;
  updatedAt: string;
  /** @deprecated first party — kept for DB compat */
  partyARoleId?: string;
  /** @deprecated second party — kept for DB compat */
  partyBRoleId?: string;
  partyAAddress?: string;
  partyBAddress?: string;
  canonicalTermsJson?: string;
  termsHash?: string;
  sigA?: string;
  sigB?: string;
  finalizedAt?: string;
  vcJwt?: string;
}

// Graph visualization
export interface GraphNode {
  id: string;
  roleName: string;
  archetype: string;
  playerName?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  agreementId?: string;
  source: string | GraphNode;
  target: string | GraphNode;
  status: AgreementStatus;
}

// Signet export format
export interface SignetExport {
  agreementId: string;
  exportedAt: string;
  parties: Array<{
    roleId: string;
    roleName: string;
    playerName?: string;
    commitment: string;
  }>;
  terms: {
    commitments: Record<string, string>;
    agreementNotes: string;
  };
  signatures: Array<{
    roleId: string;
    name: string;
    signedAt: string;
  }>;
  legalText: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type Theme = 'light' | 'dark';

export type { Archetype, RoleTemplate };

// Display helpers
export function getRoleDisplayName(role: Role): string {
  if (role.playerName?.trim()) return role.playerName;
  return role.template?.name ?? 'Unknown role';
}

/** Short handle for graph node interior labels. */
export function getGraphNodeHandle(role: Role): string {
  const handle = getRoleDisplayName(role);
  const token = handle.split(/\s+/)[0] ?? handle;
  return token.length > 10 ? `${token.slice(0, 9)}…` : token;
}

export function getRoleSubtitle(role: Role): string {
  const template = role.template;
  if (!template) return '';
  return template.subtitle ?? template.entityType;
}

export function getArchetypeForRole(role: Role): Archetype | undefined {
  return role.template?.archetype;
}
