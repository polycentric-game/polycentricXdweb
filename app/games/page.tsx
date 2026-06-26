'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { createGame, getPlayerCount } from '@/lib/games';
import { getAuthSessionAndUser } from '@/lib/auth';
import { gameStorage } from '@/lib/storage';
import { DEMO_GAME, getDemoGameData, isDemoGame } from '@/lib/demoGame';
import { validateGameTitle } from '@/lib/validation';
import { setStoredGameId } from '@/lib/gameContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function GamesPage() {
  const router = useRouter();
  const {
    session,
    user,
    games,
    currentGame,
    currentRole,
    isLoading,
    refreshGames,
    setCurrentGame,
    enterGame,
    switchGame,
  } = useAppStore();

  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isLoading) return;
    if (!session || !user) {
      router.push('/login');
    }
  }, [session, user, isLoading, router]);

  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

  useEffect(() => {
    async function loadCounts() {
      const counts: Record<string, number> = {};
      await Promise.all(
        games.map(async (game) => {
          if (isDemoGame(game)) {
            counts[game.id] = getDemoGameData().roles.length;
          } else {
            counts[game.id] = await getPlayerCount(game.id);
          }
        })
      );
      setPlayerCounts(counts);
    }
    if (games.length > 0) loadCounts();
  }, [games]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateGameTitle(title);
    if (validationErrors.length > 0) {
      const map: Record<string, string> = {};
      validationErrors.forEach((err) => {
        map[err.field] = err.message;
      });
      setErrors(map);
      return;
    }

    if (!user) return;

    setCreating(true);
    await getAuthSessionAndUser();
    const result = await createGame(title, user.id);
    setCreating(false);

    if (result.success && result.game) {
      await refreshGames();
      setStoredGameId(result.game.id);
      router.push(`/games/${result.game.id}/claim-role`);
    } else {
      setErrors({ title: result.error ?? 'Failed to create game' });
    }
  };

  const handleJoin = async (gameId: string) => {
    if (isDemoGame(gameId)) {
      await switchGame(DEMO_GAME);
      router.push('/game');
      return;
    }

    const game = await gameStorage.findById(gameId);
    if (!game) return;

    await setCurrentGame(game);
    setStoredGameId(game.id);

    if (user) {
      const { roleStorage } = await import('@/lib/storage');
      const existingRole = await roleStorage.findByGameAndUser(gameId, user.id);
      if (existingRole) {
        await enterGame(game, existingRole);
        router.push('/game');
        return;
      }
    }

    router.push(`/games/${gameId}/claim-role`);
  };

  const handleViewDemo = async () => {
    await switchGame(DEMO_GAME);
    router.push('/game');
  };

  const realGames = games.filter((g) => !isDemoGame(g));
  const demoAgreementCount = getDemoGameData().agreements.length;

  if (isLoading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
          Games
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Create a new game or join an existing one, then claim a role from the deck.
        </p>
      </div>

      {currentGame && currentRole && (
        <Card className="bg-primary/5 border-primary/20 space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You&apos;re in <strong>{currentGame.title}</strong> as{' '}
            <strong>{currentRole.template?.name ?? 'your role'}</strong>.
          </p>
          <Link href="/game">
            <Button size="sm">Enter game</Button>
          </Link>
        </Card>
      )}

      <Card className="space-y-4 border-primary/30 bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              {DEMO_GAME.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              View-only mock game with all 31 roles and {demoAgreementCount} multilateral agreements
              (2–6 parties). Explore the network graph — no claiming or negotiating.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {getDemoGameData().roles.length} roles · {demoAgreementCount} agreements
            </p>
          </div>
          <Button onClick={handleViewDemo}>View demo</Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Create a game</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Game title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            placeholder="e.g. Nomad Sprint March 2026"
            maxLength={120}
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Titles must be unique across all games.
          </p>
          <Button type="submit" loading={creating}>
            Create game
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Join a game</h2>
        {realGames.length === 0 ? (
          <Card className="p-8 text-center text-gray-600 dark:text-gray-300">
            No live games yet. Create the first one above, or explore the demo network.
          </Card>
        ) : (
          <div className="space-y-3">
            {realGames.map((game) => (
              <Card key={game.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{game.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {playerCounts[game.id] ?? '…'} player
                    {(playerCounts[game.id] ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => handleJoin(game.id)}>
                  Join
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
