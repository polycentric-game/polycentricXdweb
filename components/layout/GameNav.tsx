'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { gameNetworkPath } from '@/lib/gameRoutes';

function isNetworkActive(pathname: string, gameId: string): boolean {
  return (
    pathname === gameNetworkPath(gameId) ||
    pathname === '/game' ||
    pathname.startsWith('/game/') ||
    pathname.startsWith('/founder/')
  );
}

function isRolesActive(pathname: string, gameId: string): boolean {
  return pathname === `/games/${gameId}/claim-role`;
}

function isAgreementsActive(pathname: string): boolean {
  return pathname === '/agreements' || pathname.startsWith('/agreement/');
}

interface GameNavProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function GameNav({ isMobile = false, onLinkClick }: GameNavProps) {
  const pathname = usePathname();
  const { currentGame } = useAppStore();

  if (!currentGame) return null;

  const items = [
    {
      href: gameNetworkPath(currentGame.id),
      label: 'Network',
      active: isNetworkActive(pathname, currentGame.id),
    },
    {
      href: `/games/${currentGame.id}/claim-role`,
      label: 'Roles',
      active: isRolesActive(pathname, currentGame.id),
    },
    {
      href: '/agreements',
      label: 'Agreements',
      active: isAgreementsActive(pathname),
    },
  ];

  const linkClass = (active: boolean) =>
    cn(
      'text-sm font-medium transition-colors',
      active
        ? 'text-primary'
        : 'text-gray-600 dark:text-gray-300 hover:text-primary',
      isMobile ? 'block py-1' : 'px-1 py-2 border-b-2',
      !isMobile && (active ? 'border-primary' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600')
    );

  if (isMobile) {
    return (
      <nav className="flex flex-col space-y-2 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {currentGame.title}
        </p>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={linkClass(item.active)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 h-11 overflow-x-auto">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0 hidden sm:inline">
            {currentGame.title}
          </span>
          <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
          <nav className="flex items-center gap-6">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
