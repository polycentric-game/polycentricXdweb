'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { roleTemplateStorage } from '@/lib/storage';
import { claimRoleInGame } from '@/lib/games';
import { gameNetworkPath } from '@/lib/gameRoutes';
import { DEMO_GAME, getDemoGameData, isDemoGame } from '@/lib/demoGame';
import { RoleBrowser, RoleTemplateWithId } from '@/components/role/RoleBrowser';
import { GamePlayerRoster } from '@/components/role/GamePlayerRoster';
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
    switchGame,
  } = useAppStore();

  const [templates, setTemplates] = useState<RoleTemplateWithId[]>(LOCAL_TEMPLATES);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState<string | null>(null);
  const [enteringGame, setEnteringGame] = useState(false);

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
        await switchGame(DEMO_GAME);
        return;
      }
      const { gameStorage } = await import('@/lib/storage');
      const game = await gameStorage.findById(gameId);
      if (!game) {
        router.push('/games');
        return;
      }
      setGameTitle(game.title);
      await switchGame(game);
    }
    loadGame();
  }, [gameId, router, switchGame]);

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
          await switchGame(game);
          router.replace(gameNetworkPath(gameId));
        }
      } else {
        setClaimError(result.error ?? 'Failed to claim role');
      }
    },
    [user, gameId, switchGame, router]
  );

  const handleEnterGame = useCallback(async () => {
    setEnteringGame(true);
    try {
      const { gameStorage } = await import('@/lib/storage');
      const game =
        useAppStore.getState().currentGame ?? (await gameStorage.findById(gameId));
      if (!game) return;
      await switchGame(game);
      router.replace(gameNetworkPath(gameId));
    } finally {
      setEnteringGame(false);
    }
  }, [gameId, switchGame, router]);

  if (appIsLoading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  if (myRole) {
    return (
      <GamePlayerRoster
        gameTitle={gameTitle ?? 'Game'}
        roles={gameRoles}
        currentUserId={user.id}
        myRole={myRole}
        onEnterGame={handleEnterGame}
        entering={enteringGame}
      />
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
            <Button size="sm" onClick={() => router.replace(gameNetworkPath(gameId))}>
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
