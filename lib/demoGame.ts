import { Agreement, AgreementStatus, Game, Role } from './types';
import { ROLE_TEMPLATES } from './roleTemplates';

/** Fixed id — never persisted to Supabase. */
export const DEMO_GAME_ID = 'demo-visualization-game';

export const DEMO_GAME: Game = {
  id: DEMO_GAME_ID,
  title: 'Demo: Full Network (31 roles)',
  createdBy: 'demo-system',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  isDemo: true,
};

const AGREEMENT_COUNT = 100;
const STATUSES: AgreementStatus[] = ['proposed', 'revised', 'approved'];

/** 31 diverse first names for demo player handles (one per role template). */
const DEMO_PLAYER_NAMES = [
  'Amara',
  'Priya',
  'Wei',
  'Fatima',
  'Lucía',
  'Olumide',
  'Sofia',
  'Kenji',
  'Anya',
  'Thabo',
  'Mei',
  'Diego',
  'Asha',
  'Lars',
  'Yuki',
  'Chioma',
  'Mateo',
  'Ingrid',
  'Raj',
  'Elena',
  'Kwame',
  'Hana',
  'Pavel',
  'Isabella',
  'Jabari',
  'Lin',
  'Nadia',
  'Omar',
  'Suki',
  'Valentina',
  'Zara',
] as const;

/** Deterministic PRNG for reproducible mock agreements. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickPartySize(rng: () => number): number {
  const r = rng();
  if (r < 0.28) return 2;
  if (r < 0.52) return 3;
  if (r < 0.74) return 4;
  if (r < 0.9) return 5;
  return 6;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function commitmentText(role: Role): string {
  const template = role.template;
  const capability = template?.capabilities?.[0] ?? 'coordination support';
  const goal = template?.goals?.[0];
  if (goal) {
    return `${template?.name ?? 'Role'} commits to: ${goal.charAt(0).toLowerCase()}${goal.slice(1)}`;
  }
  return `${template?.name ?? 'Role'} offers ${capability.toLowerCase()}.`;
}

function buildDemoRoles(): Role[] {
  const baseTime = new Date('2026-01-15T12:00:00.000Z').getTime();

  return ROLE_TEMPLATES.map((template, index) => {
    const createdAt = new Date(baseTime - index * 3600_000).toISOString();
    return {
      id: `demo-role-${template.slug}`,
      userId: `demo-user-${template.slug}`,
      gameId: DEMO_GAME_ID,
      templateId: `local-${template.slug}`,
      playerName: DEMO_PLAYER_NAMES[index] ?? `Player ${index + 1}`,
      createdAt,
      updatedAt: createdAt,
      template,
    };
  });
}

function buildDemoAgreements(roles: Role[]): Agreement[] {
  const rng = mulberry32(42);
  const agreements: Agreement[] = [];
  const roleIds = roles.map((r) => r.id);
  const roleById = new Map(roles.map((r) => [r.id, r]));

  for (let i = 0; i < AGREEMENT_COUNT; i++) {
    const partySize = pickPartySize(rng);
    const partyRoleIds = shuffle(roleIds, rng).slice(0, partySize);
    const status = STATUSES[i % STATUSES.length];
    const initiatedBy = partyRoleIds[0];
    const daysAgo = Math.floor(rng() * 90) + 1;
    const proposedAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
    const updatedAt = new Date(Date.now() - Math.floor(rng() * daysAgo) * 86_400_000).toISOString();

    const commitments: Record<string, string> = {};
    for (const roleId of partyRoleIds) {
      const role = roleById.get(roleId)!;
      commitments[roleId] = commitmentText(role);
    }

    const approvedBy =
      status === 'proposed'
        ? [initiatedBy]
        : status === 'revised'
          ? partyRoleIds.slice(0, Math.max(1, Math.floor(partyRoleIds.length / 2)))
          : partyRoleIds;

    const notes = `Multilateral agreement (${partySize} parties) for shared DWeb nomad infrastructure coordination.`;

    agreements.push({
      id: `demo-a-${String(i + 1).padStart(3, '0')}`,
      partyRoleIds,
      status,
      initiatedBy,
      lastRevisedBy: initiatedBy,
      currentVersion: status === 'revised' ? 1 : 0,
      versions: [
        {
          versionNumber: 0,
          commitments,
          notes,
          proposedBy: initiatedBy,
          proposedAt,
          approvedBy: status === 'revised' ? [initiatedBy] : approvedBy,
        },
        ...(status === 'revised'
          ? [
              {
                versionNumber: 1,
                commitments,
                notes: `${notes} (revised terms)`,
                proposedBy: partyRoleIds[1] ?? initiatedBy,
                proposedAt: updatedAt,
                approvedBy: [partyRoleIds[1] ?? initiatedBy],
              },
            ]
          : []),
      ],
      createdAt: proposedAt,
      updatedAt,
    });
  }

  return agreements;
}

let cachedData: { roles: Role[]; agreements: Agreement[] } | null = null;
const DEMO_DATA_CACHE_VERSION = 2;

export function isDemoGame(gameOrId: Game | string | null | undefined): boolean {
  if (!gameOrId) return false;
  const id = typeof gameOrId === 'string' ? gameOrId : gameOrId.id;
  return id === DEMO_GAME_ID || (typeof gameOrId === 'object' && gameOrId.isDemo === true);
}

let cachedDataVersion = 0;

export function getDemoGameData(): { game: Game; roles: Role[]; agreements: Agreement[] } {
  if (!cachedData || cachedDataVersion !== DEMO_DATA_CACHE_VERSION) {
    const roles = buildDemoRoles();
    cachedData = { roles, agreements: buildDemoAgreements(roles) };
    cachedDataVersion = DEMO_DATA_CACHE_VERSION;
  }
  return { game: DEMO_GAME, roles: cachedData.roles, agreements: cachedData.agreements };
}

export function mergeGamesWithDemo(games: Game[]): Game[] {
  const withoutDemo = games.filter((g) => !isDemoGame(g));
  return [DEMO_GAME, ...withoutDemo];
}

export function findDemoRole(roles: Role[], roleId: string): Role | undefined {
  return roles.find((r) => r.id === roleId);
}

export function findDemoAgreement(agreements: Agreement[], agreementId: string): Agreement | undefined {
  return agreements.find((a) => a.id === agreementId);
}
