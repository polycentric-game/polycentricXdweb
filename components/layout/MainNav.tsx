'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface MainNavProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

/** Top-level nav when the user is signed in but not in an active game. */
export function MainNav({ isMobile = false, onLinkClick }: MainNavProps) {
  const pathname = usePathname();
  const { session, user, currentGame } = useAppStore();

  if (!session || !user || currentGame) {
    return null;
  }

  const linkClassName = cn(
    'text-sm font-medium transition-colors hover:text-primary',
    pathname === '/games' || pathname.startsWith('/games/')
      ? 'text-primary'
      : 'text-gray-600 dark:text-gray-300',
    isMobile && 'block py-1'
  );

  return (
    <Link href="/games" onClick={onLinkClick} className={linkClassName}>
      Games
    </Link>
  );
}
