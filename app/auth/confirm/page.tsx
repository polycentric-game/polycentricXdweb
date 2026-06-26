'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { syncAppUserSafe, toAuthSession } from '@/lib/auth';
import { useAppStore } from '@/lib/store';

/**
 * Client-only fallback when Supabase redirects with tokens in the URL hash
 * (#access_token=…). Hash fragments are never sent to the server.
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const { setSession } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const supabase = getSupabase();
    let timeoutId = 0;

    const fail = (message: string) => {
      window.clearTimeout(timeoutId);
      setError(message);
    };

    const complete = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        fail(sessionError.message);
        return;
      }

      if (!session?.user) {
        fail('No session found. Request a new magic link from /login.');
        return;
      }

      const user = await syncAppUserSafe(session.user);
      setSession(toAuthSession(session), user);
      router.replace('/');
    };

    timeoutId = window.setTimeout(() => {
      fail('Sign-in timed out. Request a new magic link from /login.');
    }, 15_000);

    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      fail(params.get('error_description') ?? params.get('error') ?? 'Sign-in failed');
      return;
    }

    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    if (!hashParams.get('access_token')) {
      fail('Missing sign-in tokens. Request a new magic link from /login.');
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        window.clearTimeout(timeoutId);
        subscription.unsubscribe();
        void complete();
      }
    });

    // createBrowserClient parses the hash on init; re-check session
    void complete();

    return () => {
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router, setSession]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      {error ? (
        <div className="text-center space-y-4 max-w-md">
          <p className="text-danger">{error}</p>
          <a href="/login" className="text-primary hover:underline">
            Back to sign in
          </a>
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">Completing sign in…</p>
      )}
    </div>
  );
}
