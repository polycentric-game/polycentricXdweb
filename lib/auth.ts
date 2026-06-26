import type { Session, User as SupabaseUser, EmailOtpType } from '@supabase/supabase-js';
import { User, AuthSession } from './types';
import { userStorage } from './storage';
import { getSupabase } from './supabase/client';
import { parseMagicLinkUrl } from './magicLinkUrl';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export function toAuthSession(supabaseSession: Session): AuthSession {
  return {
    userId: supabaseSession.user.id,
    expiresAt: new Date(supabaseSession.expires_at! * 1000).toISOString(),
  };
}

function userFromSupabase(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? undefined,
    createdAt: supabaseUser.created_at ?? new Date().toISOString(),
  };
}

/** Upsert app user row from Supabase Auth user (id matches auth.users.id) */
export async function syncAppUser(supabaseUser: SupabaseUser): Promise<User> {
  const user = userFromSupabase(supabaseUser);
  return userStorage.save(user);
}

/** Sync profile when possible; never block auth on DB errors */
export async function syncAppUserSafe(supabaseUser: SupabaseUser): Promise<User> {
  try {
    return await syncAppUser(supabaseUser);
  } catch (err) {
    console.warn('Failed to sync app user row:', err);
    return userFromSupabase(supabaseUser);
  }
}

export async function signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

  const { error } = await getSupabase().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function verifyMagicLinkFromUrl(
  url: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = parseMagicLinkUrl(url);
  if (!parsed) {
    return {
      success: false,
      error: 'Could not read that link. Copy the full URL from the Sign in button in your email.',
    };
  }

  const { data, error } = await getSupabase().auth.verifyOtp({
    token_hash: parsed.token_hash,
    type: parsed.type as EmailOtpType,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.session?.user) {
    return { success: false, error: 'Link verified but no session was returned.' };
  }

  await syncAppUserSafe(data.session.user);
  return { success: true };
}

export async function verifyEmailOtpCode(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await getSupabase().auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.session?.user) {
    return { success: false, error: 'Invalid or expired code.' };
  }

  await syncAppUserSafe(data.session.user);
  return { success: true };
}

async function fetchServerSession(): Promise<{
  session: AuthSession | null;
  user: User | null;
}> {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (!res.ok) return { session: null, user: null };

    const data = (await res.json()) as {
      session: AuthSession | null;
      user: User | null;
    };

    if (!data.session || !data.user) {
      return { session: null, user: null };
    }

    const syncedUser = await syncAppUserSafe({
      id: data.user.id,
      email: data.user.email ?? null,
      created_at: data.user.createdAt,
    } as SupabaseUser);

    return { session: data.session, user: syncedUser };
  } catch (err) {
    console.warn('Server session fetch failed:', err);
    return { session: null, user: null };
  }
}

export async function getAuthSessionAndUser(): Promise<{
  session: AuthSession | null;
  user: User | null;
}> {
  const supabase = getSupabase();

  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (!userError && authUser) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const authSession: AuthSession = session
      ? toAuthSession(session)
      : {
          userId: authUser.id,
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        };

    const user = await syncAppUserSafe(authUser);
    return { session: authSession, user };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!sessionError && session?.user) {
    const user = await syncAppUserSafe(session.user);
    return { session: toAuthSession(session), user };
  }

  return fetchServerSession();
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function isAuthenticated(): Promise<boolean> {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  return Boolean(session);
}

// ── Legacy wallet auth (disabled for this version) ──────────────────────────
/*
export async function signInWithWallet(address: string): Promise<AuthResult> { ... }
*/

/** @deprecated Session comes from Supabase Auth — use store session instead */
export function getCurrentSession(): AuthSession | null {
  return null;
}

/** @deprecated Use getAuthSessionAndUser */
export async function getCurrentUser(): Promise<User | null> {
  const { user } = await getAuthSessionAndUser();
  return user;
}

/** Reserved for future in-game role selection */
export async function setCurrentRole(_roleId: string): Promise<void> {
  // Role assignment will happen within a game session in a future version
}

/** @deprecated */
export const setCurrentFounder = setCurrentRole;
