'use client';

import React from 'react';
import Link from 'next/link';
import { Role, getRoleDisplayName } from '@/lib/types';
import { getArchetypeLabel } from '@/lib/roleTemplates';
import { ARCHETYPE_COLORS } from '@/lib/graphControlConstants';
import { ColorSwatch } from '@/components/graph/ColorSwatch';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface GamePlayerRosterProps {
  gameTitle: string;
  roles: Role[];
  currentUserId: string;
  myRole: Role;
  onEnterGame: () => void;
  entering?: boolean;
}

export function GamePlayerRoster({
  gameTitle,
  roles,
  currentUserId,
  myRole,
  onEnterGame,
  entering = false,
}: GamePlayerRosterProps) {
  const sortedRoles = [...roles].sort((a, b) => {
    const nameA = a.template?.name ?? '';
    const nameB = b.template?.name ?? '';
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          {gameTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          You&apos;re playing as{' '}
          <strong>{myRole.template?.name ?? getRoleDisplayName(myRole)}</strong>
          {myRole.playerName ? ` (${myRole.playerName})` : ''}.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            Players in this game
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {roles.length} role{roles.length === 1 ? '' : 's'} claimed
          </span>
        </div>

        {sortedRoles.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">No roles claimed yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedRoles.map((role) => {
              const archetype = role.template?.archetype;
              const isYou = role.userId === currentUserId;
              return (
                <li key={role.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  {archetype && (
                    <ColorSwatch
                      color={ARCHETYPE_COLORS[archetype]}
                      className="mt-1.5 w-3.5 h-3.5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {role.template?.name ?? 'Unknown role'}
                      </span>
                      {isYou && <Badge variant="secondary">You</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {getRoleDisplayName(role)}
                      {archetype && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {' '}
                          · {getArchetypeLabel(archetype)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/founder/${role.id}`}
                    className="text-sm text-primary hover:underline shrink-0"
                  >
                    Profile
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onEnterGame} loading={entering}>
          Enter game
        </Button>
        <Link href="/games">
          <Button variant="secondary">All games</Button>
        </Link>
      </div>
    </div>
  );
}
