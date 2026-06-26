'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { isDemoGame } from '@/lib/demoGame';
import { ChevronDown, Plus } from 'lucide-react';

interface GameSwitcherProps {
  onNavigate?: () => void;
}

export function GameSwitcher({ onNavigate }: GameSwitcherProps) {
  const router = useRouter();
  const { games, currentGame, switchGame, refreshGames } = useAppStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;
    await switchGame(game);
    setOpen(false);
    onNavigate?.();
    router.push('/game');
  };

  return (
    <div className="flex items-center gap-2" ref={containerRef}>
      <span
        id="game-switcher-label"
        className="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0"
      >
        Games:
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm max-w-[220px]"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby="game-switcher-label"
        >
          <span className="truncate font-medium text-gray-900 dark:text-gray-100">
            {currentGame?.title ?? 'Select game'}
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute left-0 mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50 py-1">
          {games.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No games yet</p>
          ) : (
            <ul role="listbox">
              {games.map((game) => (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(game.id)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                      currentGame?.id === game.id
                        ? 'text-primary font-medium bg-primary/5'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {game.title}
                    {isDemoGame(game) && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(demo)</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
            <Link
              href="/games"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
              Browse & create games
            </Link>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
