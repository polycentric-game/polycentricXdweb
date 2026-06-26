'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { roleTemplateStorage } from '@/lib/storage';
import { claimRoleInGame } from '@/lib/games';
import { DEMO_GAME, getDemoGameData, isDemoGame } from '@/lib/demoGame';
import { RoleBrowser, RoleTemplateWithId } from '@/components/role/RoleBrowser';
import { ROLE_TEMPLATES } from '@/lib/roleTemplates';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const LOCAL_TEMPLATES: RoleTemplateWithId[] = ROLE_TEMPLATES.map((t, i) => ({
  ...t,
  id: `local-${t.slug}`,
  sortOrder: i + 1,
}));

export default function GameClaimRolePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const {
    session,
    user,
    roles,
    isLoading: appIsLoading,
    enterGame,
    refreshGameData,
    setCurrentGame,
  } = useAppStore();

  const [templates, setTemplates] = useState<RoleTemplateWithId[]>(LOCAL_TEMPLATES);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState<string | null>(null);

  useEffect(() => {
    if (appIsLoading) return;
    if (!session || !user) {
      router.push('/login');
    }
  }, [session, user, appIsLoading, router]);

  useEffect(() => {
    async function loadGame() {
      if (isDemoGame(gameId)) {
        setGameTitle(DEMO_GAME.title);
        await setCurrentGame(DEMO_GAME);
        return;
      }
      const { gameStorage } = await import('@/lib/storage');
      const game = await gameStorage.findById(gameId);
      if (!game) {
        router.push('/games');
        return;
      }
      setGameTitle(game.title);
      await setCurrentGame(game);
      await refreshGameData(gameId);
    }
    loadGame();
  }, [gameId, router, setCurrentGame, refreshGameData]);

  useEffect(() => {
    roleTemplateStorage
      .getAll()
      .then((loaded) => {
        if (loaded.length > 0) setTemplates(loaded);
      })
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, []);

  const isDemo = isDemoGame(gameId);
  const demoRoles = isDemo ? getDemoGameData().roles : [];
  const gameRoles = isDemo ? demoRoles : roles.filter((r) => r.gameId === gameId);
  const myRole = gameRoles.find((r) => r.userId === user?.id);

  const claimedTemplateIds = new Set(
    gameRoles.flatMap((r) => [r.templateId, r.template?.slug].filter(Boolean) as string[])
  );

  const handleClaim = useCallback(
    async (templateId: string, playerName?: string) => {
      if (!user) return;

      setIsClaiming(true);
      setClaimError(null);

      const result = await claimRoleInGame(gameId, user.id, templateId, playerName);
      setIsClaiming(false);

      if (result.success && result.role) {
        const { gameStorage } = await import('@/lib/storage');
        const game = await gameStorage.findById(gameId);
        if (game) {
          await refreshGameData(gameId);
          await enterGame(game, result.role);
          router.push('/game');
        }
      } else {
        setClaimError(result.error ?? 'Failed to claim role');
      }
    },
    [user, gameId, enterGame, refreshGameData, router]
  );

  if (appIsLoading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  if (myRole) {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          {gameTitle ?? 'Game'}
        </h1>
        <Card className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            You already have a role in this game:{' '}
            <strong>{myRole.template?.name ?? 'Your role'}</strong>
          </p>
          <Button onClick={() => router.push('/game')}>Enter game</Button>
        </Card>
      </div>
    );
  }

  if (isDemo) {
    const allClaimed = new Set(demoRoles.map((r) => r.templateId));
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-primary/5 border-primary/20 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>View-only demo.</strong> All {demoRoles.length} roles are pre-filled with mock
            players. Role claiming is disabled in the demo game.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => router.push('/game')}>
              Back to network
            </Button>
            <Link href="/games">
              <Button variant="secondary" size="sm">
                All games
              </Button>
            </Link>
          </div>
        </Card>

        <RoleBrowser
          templates={templates}
          claimedTemplateIds={allClaimed}
          isLoadingTemplates={loadingTemplates && appIsLoading}
          canClaim={false}
          signedIn={Boolean(session && user)}
          hasExistingRole={false}
          onSubmit={handleClaim}
          isClaiming={false}
          claimError={null}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Claiming a role in <strong>{gameTitle ?? '…'}</strong>. Each role can only be taken once
            per game.
          </p>
          <Link href="/games">
            <Button variant="secondary" size="sm">
              Back to games
            </Button>
          </Link>
        </div>
      </Card>

      <RoleBrowser
        templates={templates}
        claimedTemplateIds={claimedTemplateIds}
        isLoadingTemplates={loadingTemplates && appIsLoading}
        canClaim={Boolean(session && user)}
        signedIn={Boolean(session && user)}
        hasExistingRole={false}
        onSubmit={handleClaim}
        isClaiming={isClaiming}
        claimError={claimError}
      />
    </div>
  );
}
