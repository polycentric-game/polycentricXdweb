'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithMagicLink,
  verifyMagicLinkFromUrl,
  getAuthSessionAndUser,
} from '@/lib/auth';
import { validateMagicLinkEmail } from '@/lib/validation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface LoginFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export function LoginForm({ onSuccess, compact = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAppStore();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [pastedLink, setPastedLink] = useState('');

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError) {
      setErrors({ general: decodeURIComponent(authError) });
    }
  }, [searchParams]);

  const completeSession = async () => {
    const { session, user } = await getAuthSessionAndUser();
    if (session && user) {
      setSession(session, user);
      onSuccess?.();
      router.replace('/');
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateMagicLinkEmail(email);
    if (validationErrors.length > 0) {
      const map: Record<string, string> = {};
      validationErrors.forEach((err) => {
        map[err.field] = err.message;
      });
      setErrors(map);
      return;
    }

    setIsLoading(true);
    const result = await signInWithMagicLink(email);
    setIsLoading(false);

    if (result.success) {
      setSent(true);
    } else {
      setErrors({ general: result.error ?? 'Failed to send magic link' });
    }
  };

  const handlePasteLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!pastedLink.trim()) {
      setErrors({ pastedLink: 'Paste the sign-in link from your email' });
      return;
    }

    setIsLoading(true);
    const result = await verifyMagicLinkFromUrl(pastedLink);
    setIsLoading(false);

    if (result.success) {
      const ok = await completeSession();
      if (!ok) {
        setErrors({ general: 'Signed in but session could not be loaded. Try refreshing.' });
      }
    } else {
      setErrors({ pastedLink: result.error ?? 'Could not verify that link' });
    }
  };

  if (sent) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Check your email</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We sent a sign-in link to <strong>{email}</strong>. Open the email and click the{' '}
              <strong>Sign in</strong> link to continue.
            </p>
          </div>

          <form onSubmit={handlePasteLink} className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Link didn&apos;t work? Copy the link from the email (right-click the button → Copy
              link) and paste it here:
            </p>
            <Input
              label="Paste sign-in link"
              value={pastedLink}
              onChange={(e) => setPastedLink(e.target.value)}
              error={errors.pastedLink}
              placeholder="https://…supabase.co/auth/v1/verify?…"
            />
            {errors.general && <p className="text-sm text-danger">{errors.general}</p>}
            <Button type="submit" loading={isLoading} variant="secondary" className="w-full">
              Complete sign-in
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className={compact ? 'p-4' : ''}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!compact && (
          <div className="text-center space-y-1">
            <h2 className="font-space-grotesk font-bold text-xl text-gray-900 dark:text-gray-100">
              Sign in
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enter your email and we&apos;ll send you a magic link.
            </p>
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        {errors.general && <p className="text-sm text-danger">{errors.general}</p>}

        <Button type="submit" loading={isLoading} className="w-full">
          Send magic link
        </Button>
      </form>
    </Card>
  );
}
