'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { signOut } from '@/lib/auth';
import { gameNetworkPath } from '@/lib/gameRoutes';
import { getRoleDisplayName } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ProfilePage() {
  const router = useRouter();
  const { session, user, currentGame, currentRole, isLoading, clearSession, leaveGame } =
    useAppStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <p className="text-gray-600 dark:text-gray-300">Sign in to view your profile.</p>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    clearSession();
    router.push('/');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
        Your account
      </h1>

      <Card className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Email</p>
          <p className="text-gray-900 dark:text-gray-100">{user.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Account ID</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-mono break-all">{user.id}</p>
        </div>
      </Card>

      <Card className="space-y-3 bg-gray-50 dark:bg-gray-800/50">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Games & roles</h2>
        {currentGame && currentRole ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Active game: <strong>{currentGame.title}</strong>
              <br />
              Role: <strong>{getRoleDisplayName(currentRole)}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={gameNetworkPath(currentGame.id)}>
                <Button size="sm">Enter game</Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  leaveGame();
                  router.push('/games');
                }}
              >
                Leave game
              </Button>
            </div>
          </>
        ) : currentGame ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Joined <strong>{currentGame.title}</strong> — claim a role to enter the game.
            </p>
            <Link href={`/games/${currentGame.id}/claim-role`}>
              <Button size="sm">Claim a role</Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You&apos;re not in a game yet. Create one or join an existing session.
            </p>
            <Link href="/games">
              <Button variant="secondary" size="sm">
                Go to games
              </Button>
            </Link>
          </>
        )}
      </Card>

      <Button variant="secondary" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
