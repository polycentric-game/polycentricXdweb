'use client';

import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { getAuthSessionAndUser, syncAppUserSafe, toAuthSession } from '@/lib/auth';
import { useAppStore } from '@/lib/store';

/**
 * Syncs Supabase Auth session into the app store.
 * Users are authenticated but not attached to a role or game yet.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, clearSession } = useAppStore();

  useEffect(() => {
    const supabase = getSupabase();

    const applySession = async () => {
      const { session, user } = await getAuthSessionAndUser();
      if (session && user) {
        await setSession(session, user);
      }
    };

    void applySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, supabaseSession) => {
      if (event === 'SIGNED_OUT') {
        clearSession();
        return;
      }

      if (
        supabaseSession?.user &&
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')
      ) {
        // Defer Supabase calls to avoid auth callback deadlocks
        setTimeout(() => {
          void (async () => {
            const user = await syncAppUserSafe(supabaseSession.user);
            await setSession(toAuthSession(supabaseSession), user);
          })();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, clearSession]);

  return <>{children}</>;
}
