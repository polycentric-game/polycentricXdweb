import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Returns the current auth session from HttpOnly / server-readable cookies.
 * Used as a fallback when the browser Supabase client cannot read the session yet.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ session: null, user: null });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? undefined,
      createdAt: user.created_at ?? new Date().toISOString(),
    },
    session: {
      userId: user.id,
      expiresAt: session?.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : new Date(Date.now() + 3600_000).toISOString(),
    },
  });
}
