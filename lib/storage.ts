import { User, Role, Agreement, AuthSession, Theme, Game } from './types';
import { normalizeAgreement, getPartyRoleIds } from './agreementHelpers';
import { RoleTemplate, ROLE_TEMPLATES, getRoleTemplateBySlug } from './roleTemplates';
import { getSupabase } from './supabase';

function localRoleTemplates(): (RoleTemplate & { id: string })[] {
  return ROLE_TEMPLATES.map((t, i) => ({ ...t, id: `local-${t.slug}`, sortOrder: i + 1 }));
}

export async function resolveTemplateId(templateId: string): Promise<string> {
  if (templateId.startsWith('local-')) {
    const slug = templateId.replace(/^local-/, '');
    const template = await roleTemplateStorage.findBySlug(slug);
    if (!template?.id || template.id.startsWith('local-')) {
      throw new Error(
        'Role templates are not loaded in the database. Run the Supabase migrations (002_seed_role_templates.sql).'
      );
    }
    return template.id;
  }
  return templateId;
}

function mapTemplateRow(row: any): RoleTemplate {
  return {
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    entityType: row.entity_type,
    archetype: row.archetype,
    isDisruptive: row.is_disruptive,
    backstory: row.backstory,
    expandedBackstory: row.expanded_backstory ?? '',
    values: row.values ?? [],
    goals: row.goals ?? [],
    obligations: row.obligations ?? [],
    capabilities: row.capabilities ?? [],
    intellectualProperty: row.intellectual_property ?? [],
    rivalrousResources: row.rivalrous_resources ?? [],
    systemicConstraints: row.systemic_constraints ?? {},
    sortOrder: row.sort_order ?? 0,
  };
}

class UserStorage {
  async save(user: User): Promise<User> {
    const { data, error } = await getSupabase()
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email || null,
          ethereum_address: user.ethereumAddress?.toLowerCase() || null,
          created_at: user.createdAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email || undefined,
      ethereumAddress: data.ethereum_address || undefined,
      createdAt: data.created_at,
    };
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await getSupabase().from('users').select('*').eq('id', id).single();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email || undefined,
      ethereumAddress: data.ethereum_address || undefined,
      createdAt: data.created_at,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await getSupabase().from('users').select('*').eq('email', email).single();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email || undefined,
      ethereumAddress: data.ethereum_address || undefined,
      createdAt: data.created_at,
    };
  }

  async findByEthereumAddress(address: string): Promise<User | null> {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('ethereum_address', address.toLowerCase())
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) return null;
      throw error;
    }
    if (!data) return null;

    return {
      id: data.id,
      email: data.email || undefined,
      ethereumAddress: data.ethereum_address || undefined,
      createdAt: data.created_at,
    };
  }

  async getAll(): Promise<User[]> {
    const { data, error } = await getSupabase().from('users').select('*');
    if (error) throw error;
    return data.map((row) => ({
      id: row.id,
      email: row.email || undefined,
      ethereumAddress: row.ethereum_address || undefined,
      createdAt: row.created_at,
    }));
  }
}

class RoleTemplateStorage {
  async getAll(): Promise<(RoleTemplate & { id: string })[]> {
    const { data, error } = await getSupabase()
      .from('role_templates')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return localRoleTemplates();
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return localRoleTemplates();
    }

    return data.map((row) => ({ ...mapTemplateRow(row), id: row.id }));
  }

  async findBySlug(slug: string): Promise<(RoleTemplate & { id: string }) | null> {
    const { data, error } = await getSupabase()
      .from('role_templates')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST205') {
        const local = getRoleTemplateBySlug(slug);
        return local ? { ...local, id: `local-${local.slug}` } : null;
      }
      throw error;
    }
    if (!data) {
      const local = getRoleTemplateBySlug(slug);
      return local ? { ...local, id: `local-${local.slug}` } : null;
    }
    return { ...mapTemplateRow(data), id: data.id };
  }

  async findById(id: string): Promise<(RoleTemplate & { id: string }) | null> {
    if (id.startsWith('local-')) {
      const slug = id.replace('local-', '');
      const local = getRoleTemplateBySlug(slug);
      return local ? { ...local, id } : null;
    }

    const { data, error } = await getSupabase().from('role_templates').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return { ...mapTemplateRow(data), id: data.id };
  }
}

class GameStorage {
  async save(game: Game): Promise<Game> {
    const { data, error } = await getSupabase()
      .from('games')
      .upsert(
        {
          id: game.id,
          title: game.title.trim(),
          created_by: game.createdBy,
          created_at: game.createdAt,
          updated_at: game.updatedAt,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return this.mapRowToGame(data);
  }

  async findById(id: string): Promise<Game | null> {
    const { data, error } = await getSupabase().from('games').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this.mapRowToGame(data);
  }

  async findByTitle(title: string): Promise<Game | null> {
    const { data, error } = await getSupabase()
      .from('games')
      .select('*')
      .eq('title', title.trim())
      .maybeSingle();
    if (error || !data) return null;
    return this.mapRowToGame(data);
  }

  async getAll(): Promise<Game[]> {
    const { data, error } = await getSupabase()
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((row) => this.mapRowToGame(row));
  }

  private mapRowToGame(row: any): Game {
    return {
      id: row.id,
      title: row.title,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

class RoleStorage {
  private async attachTemplate(role: Role): Promise<Role> {
    const template = await roleTemplateStorage.findById(role.templateId);
    return { ...role, template: template ?? undefined };
  }

  async save(role: Role): Promise<Role> {
    const { data, error } = await getSupabase()
      .from('roles')
      .upsert(
        {
          id: role.id,
          user_id: role.userId,
          game_id: role.gameId || null,
          template_id: role.templateId,
          player_name: role.playerName || null,
          created_at: role.createdAt,
          updated_at: role.updatedAt,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return this.attachTemplate(this.mapRowToRole(data));
  }

  async findById(id: string): Promise<Role | null> {
    const { data, error } = await getSupabase().from('roles').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.attachTemplate(this.mapRowToRole(data));
  }

  async findByGameAndUser(gameId: string, userId: string): Promise<Role | null> {
    const { data, error } = await getSupabase()
      .from('roles')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return this.attachTemplate(this.mapRowToRole(data));
  }

  async findByGameAndTemplate(gameId: string, templateId: string): Promise<Role | null> {
    const { data, error } = await getSupabase()
      .from('roles')
      .select('*')
      .eq('game_id', gameId)
      .eq('template_id', templateId)
      .maybeSingle();
    if (error || !data) return null;
    return this.attachTemplate(this.mapRowToRole(data));
  }

  async getByGameId(gameId: string): Promise<Role[]> {
    const { data, error } = await getSupabase().from('roles').select('*').eq('game_id', gameId);
    if (error) throw error;
    return Promise.all(data.map((row) => this.attachTemplate(this.mapRowToRole(row))));
  }

  async findByUserId(userId: string): Promise<Role | null> {
    const { data, error } = await getSupabase().from('roles').select('*').eq('user_id', userId).maybeSingle();
    if (error || !data) return null;
    return this.attachTemplate(this.mapRowToRole(data));
  }

  async getAll(): Promise<Role[]> {
    const { data, error } = await getSupabase().from('roles').select('*');
    if (error) throw error;
    return Promise.all(data.map((row) => this.attachTemplate(this.mapRowToRole(row))));
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabase().from('roles').delete().eq('id', id);
    if (error) throw error;
  }

  private mapRowToRole(row: any): Role {
    return {
      id: row.id,
      userId: row.user_id,
      gameId: row.game_id || undefined,
      templateId: row.template_id,
      playerName: row.player_name || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

class AgreementStorage {
  async save(agreement: Agreement): Promise<Agreement> {
    const normalized = normalizeAgreement(agreement);
    const partyRoleIds = getPartyRoleIds(normalized);

    const { data, error } = await getSupabase()
      .from('agreements')
      .upsert(
        {
          id: normalized.id,
          party_role_ids: partyRoleIds,
          party_a_role_id: partyRoleIds[0],
          party_b_role_id: partyRoleIds[1] ?? partyRoleIds[0],
          status: normalized.status,
          initiated_by: normalized.initiatedBy,
          last_revised_by: normalized.lastRevisedBy,
          current_version: normalized.currentVersion,
          versions: normalized.versions,
          created_at: normalized.createdAt,
          updated_at: normalized.updatedAt,
          party_a_address: normalized.partyAAddress || null,
          party_b_address: normalized.partyBAddress || null,
          canonical_terms_json: normalized.canonicalTermsJson || null,
          terms_hash: normalized.termsHash || null,
          sig_a: normalized.sigA || null,
          sig_b: normalized.sigB || null,
          finalized_at: normalized.finalizedAt || null,
          vc_jwt: normalized.vcJwt || null,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return this.mapRowToAgreement(data);
  }

  async findById(id: string): Promise<Agreement | null> {
    const { data, error } = await getSupabase().from('agreements').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapRowToAgreement(data);
  }

  async getAll(): Promise<Agreement[]> {
    const { data, error } = await getSupabase().from('agreements').select('*');
    if (error) throw error;
    return data.map((row) => this.mapRowToAgreement(row));
  }

  async findByRoleId(roleId: string): Promise<Agreement[]> {
    const { data, error } = await getSupabase()
      .from('agreements')
      .select('*')
      .contains('party_role_ids', [roleId]);

    if (error) {
      const { data: legacyData, error: legacyError } = await getSupabase()
        .from('agreements')
        .select('*')
        .or(`party_a_role_id.eq.${roleId},party_b_role_id.eq.${roleId}`);
      if (legacyError) throw legacyError;
      return legacyData.map((row) => this.mapRowToAgreement(row));
    }

    return data.map((row) => this.mapRowToAgreement(row));
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabase().from('agreements').delete().eq('id', id);
    if (error) throw error;
  }

  private mapRowToAgreement(row: any): Agreement {
    const partyRoleIds: string[] =
      row.party_role_ids?.length > 0
        ? row.party_role_ids
        : row.party_a_role_id && row.party_b_role_id
          ? [row.party_a_role_id, row.party_b_role_id]
          : [];

    const agreement: Agreement = {
      id: row.id,
      partyRoleIds,
      partyARoleId: row.party_a_role_id || undefined,
      partyBRoleId: row.party_b_role_id || undefined,
      status: row.status,
      initiatedBy: row.initiated_by,
      lastRevisedBy: row.last_revised_by,
      currentVersion: row.current_version,
      versions: row.versions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      partyAAddress: row.party_a_address || undefined,
      partyBAddress: row.party_b_address || undefined,
      canonicalTermsJson: row.canonical_terms_json || undefined,
      termsHash: row.terms_hash || undefined,
      sigA: row.sig_a || undefined,
      sigB: row.sig_b || undefined,
      finalizedAt: row.finalized_at || undefined,
      vcJwt: row.vc_jwt || undefined,
    };

    return normalizeAgreement(agreement);
  }
}

class SessionStorage {
  async save(session: AuthSession): Promise<void> {
    const { data: existingSessions } = await getSupabase()
      .from('sessions')
      .select('id, created_at')
      .eq('user_id', session.userId)
      .limit(1);

    const existingSession = existingSessions?.[0] ?? null;
    const sessionId = existingSession?.id || this.generateSessionId();

    const sessionData: Record<string, string | null> = {
      id: sessionId,
      user_id: session.userId,
      role_id: session.roleId || null,
      expires_at: session.expiresAt,
    };

    if (!existingSession) {
      sessionData.created_at = new Date().toISOString();
    }

    const { error } = await getSupabase().from('sessions').upsert(sessionData, { onConflict: 'id' });
    if (error) throw error;

    if (typeof window !== 'undefined') {
      localStorage.setItem('polycentric_session', JSON.stringify(session));
    }
  }

  get(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('polycentric_session');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Migrate legacy founderId sessions
      if (parsed.founderId && !parsed.roleId) {
        parsed.roleId = parsed.founderId;
        delete parsed.founderId;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  async isValid(): Promise<boolean> {
    const session = this.get();
    if (!session) return false;
    if (new Date(session.expiresAt) <= new Date()) {
      await this.clear();
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    const session = this.get();
    if (session) {
      await getSupabase().from('sessions').delete().eq('user_id', session.userId);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('polycentric_session');
    }
  }

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

class ThemeStorage {
  private key = 'polycentric_theme';

  save(theme: Theme) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.key, theme);
  }

  get(): Theme {
    if (typeof window === 'undefined') return 'light';
    try {
      return (localStorage.getItem(this.key) as Theme) || 'light';
    } catch {
      return 'light';
    }
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function generateAgreementId(): Promise<string> {
  return generateId();
}

export const userStorage = new UserStorage();
export const gameStorage = new GameStorage();
export const roleTemplateStorage = new RoleTemplateStorage();
export const roleStorage = new RoleStorage();
export const agreementStorage = new AgreementStorage();
export const sessionStorage = new SessionStorage();
export const themeStorage = new ThemeStorage();

// Legacy alias — remove once all imports are updated
export const founderStorage = roleStorage;
