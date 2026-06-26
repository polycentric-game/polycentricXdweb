import { Game, Role } from './types';
import { gameStorage, roleStorage, agreementStorage, generateId, resolveTemplateId } from './storage';
import { isDemoGame } from './demoGame';

function formatDbError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message: string }).message);
    if (message.includes('row-level security') || message.includes('403')) {
      return 'Database permission denied. Run migration 004_rls_policies.sql in Supabase.';
    }
    return message;
  }
  return 'Something went wrong';
}

export async function createGame(
  title: string,
  userId: string
): Promise<{ success: boolean; game?: Game; error?: string }> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { success: false, error: 'Game title is required' };
  }

  try {
    const existing = await gameStorage.findByTitle(trimmed);
    if (existing) {
      return { success: false, error: 'A game with this title already exists' };
    }

    const now = new Date().toISOString();
    const game = await gameStorage.save({
      id: generateId(),
      title: trimmed,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, game };
  } catch (err) {
    return { success: false, error: formatDbError(err) };
  }
}

export async function claimRoleInGame(
  gameId: string,
  userId: string,
  templateId: string,
  playerName?: string
): Promise<{ success: boolean; role?: Role; error?: string }> {
  if (isDemoGame(gameId)) {
    return { success: false, error: 'The demo game is view-only. Create or join a live game to claim a role.' };
  }

  const game = await gameStorage.findById(gameId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  const existingUserRole = await roleStorage.findByGameAndUser(gameId, userId);
  if (existingUserRole) {
    return { success: false, error: 'You already have a role in this game' };
  }

  let resolvedTemplateId: string;
  try {
    resolvedTemplateId = await resolveTemplateId(templateId);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid role template',
    };
  }

  const existingTemplateRole = await roleStorage.findByGameAndTemplate(gameId, resolvedTemplateId);
  if (existingTemplateRole) {
    return { success: false, error: 'This role has already been claimed in this game' };
  }

  const now = new Date().toISOString();
  try {
    const role = await roleStorage.save({
      id: generateId(),
      userId,
      gameId,
      templateId: resolvedTemplateId,
      playerName: playerName?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, role };
  } catch (err) {
    return { success: false, error: formatDbError(err) };
  }
}

export async function loadGameData(gameId: string): Promise<{
  roles: Role[];
  agreements: Awaited<ReturnType<typeof agreementStorage.getAll>>;
}> {
  const roles = await roleStorage.getByGameId(gameId);
  const roleIds = new Set(roles.map((r) => r.id));
  const allAgreements = await agreementStorage.getAll();
  const agreements = allAgreements.filter((a) =>
    a.partyRoleIds.every((id) => roleIds.has(id))
  );
  return { roles, agreements };
}

export async function getPlayerCount(gameId: string): Promise<number> {
  const roles = await roleStorage.getByGameId(gameId);
  return roles.length;
}
