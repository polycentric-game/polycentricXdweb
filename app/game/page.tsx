'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getStoredGameId } from '@/lib/gameContext';
import { gameNetworkPath } from '@/lib/gameRoutes';

function GameRedirectContent() {
  const router = useRouter();
  const { isLoading, currentGame } = useAppStore();

  useEffect(() => {
    if (isLoading) return;

    const gameId = currentGame?.id ?? getStoredGameId();
    if (gameId) {
      router.replace(gameNetworkPath(gameId));
    } else {
      router.replace('/games');
    }
  }, [isLoading, currentGame, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-600 dark:text-gray-300">Loading network...</div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <GameRedirectContent />
    </Suspense>
  );
}
