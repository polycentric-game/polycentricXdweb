'use client';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { AgreementForm } from '@/components/agreement/AgreementForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { isDemoGame } from '@/lib/demoGame';
import { gameNetworkPath } from '@/lib/gameRoutes';
import { getRoleDisplayName } from '@/lib/types';

function ProposeAgreementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withRoleId = searchParams.get('with') ?? '';

  const { session, user, currentGame, currentRole, roles, isLoading } = useAppStore();

  useEffect(() => {
    if (isLoading) return;
    if (!session || !user) {
      router.push('/login');
    }
  }, [session, user, isLoading, router]);

  if (isLoading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          No active game
        </h1>
        <Card className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Join a game and claim a role before proposing an agreement.
          </p>
          <Link href="/games">
            <Button>Browse games</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isDemoGame(currentGame)) {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          Demo game
        </h1>
        <Card className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            The demo game is view-only. Join a live game and claim a role to propose agreements.
          </p>
          <Link href="/games">
            <Button>Browse games</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!currentRole) {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          {currentGame.title}
        </h1>
        <Card className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Claim a role in this game before proposing an agreement.
          </p>
          <Link href={`/games/${currentGame.id}/claim-role`}>
            <Button>Claim a role</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const otherRoles = roles.filter((r) => r.id !== currentRole.id);
  const preselectedRole = withRoleId ? roles.find((r) => r.id === withRoleId) : null;

  if (otherRoles.length === 0) {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          Propose agreement
        </h1>
        <Card className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            At least one other player needs to claim a role in {currentGame.title} before you can
            propose an agreement.
          </p>
          <Link href={gameNetworkPath(currentGame.id)}>
            <Button variant="secondary">Back to network</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={gameNetworkPath(currentGame.id)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary mb-2 inline-block"
        >
          ← Back to network
        </Link>
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          Propose agreement
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {currentGame.title} · playing as{' '}
          <strong>{getRoleDisplayName(currentRole)}</strong>
          {preselectedRole && (
            <>
              {' '}
              · with <strong>{getRoleDisplayName(preselectedRole)}</strong>
            </>
          )}
        </p>
      </div>

      <AgreementForm
        defaultCounterpartyRoleIds={withRoleId ? [withRoleId] : []}
        onSubmit={(agreement) => router.push(`/agreement/${agreement.id}`)}
        onCancel={() => router.push(gameNetworkPath(currentGame.id))}
      />
    </div>
  );
}

export default function ProposeAgreementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600 dark:text-gray-300">Loading...</div>
        </div>
      }
    >
      <ProposeAgreementContent />
    </Suspense>
  );
}
