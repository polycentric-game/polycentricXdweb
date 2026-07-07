'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { gameStorage } from '@/lib/storage';
import { DEMO_GAME, isDemoGame } from '@/lib/demoGame';
import { GameNetworkView } from '@/components/game/GameNetworkView';

function GameNetworkPageContent() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  const { isLoading, currentGame, games, switchGame } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    async function ensureGame() {
      if (currentGame?.id === gameId) {
        setReady(true);
        return;
      }

      const fromList = games.find((g) => g.id === gameId);
      if (fromList) {
        await switchGame(fromList);
        setReady(true);
        return;
      }

      if (isDemoGame(gameId)) {
        await switchGame(DEMO_GAME);
        setReady(true);
        return;
      }

      const game = await gameStorage.findById(gameId);
      if (!game) {
        router.replace('/games');
        return;
      }

      await switchGame(game);
      setReady(true);
    }

    void ensureGame();
  }, [isLoading, gameId, currentGame, games, switchGame, router]);

  if (isLoading || !ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Loading game...</div>
      </div>
    );
  }

  return <GameNetworkView />;
}

export default function GameNetworkPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <GameNetworkPageContent />
    </Suspense>
  );
}
