'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { GameGraph, GameGraphRef } from '@/components/graph/GameGraph';
import { GraphControls } from '@/components/graph/GraphControls';
import { GraphToolbar } from '@/components/graph/GraphToolbar';
import {
  loadGraphEdgeStyle,
  saveGraphEdgeStyle,
  DEFAULT_GRAPH_EDGE_STYLE,
  type GraphEdgeStyle,
} from '@/lib/graphArcEdges';
import { DEFAULT_GRAPH_FILTERS, type GraphFilterState } from '@/lib/graphFilters';
import { isDemoGame } from '@/lib/demoGame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function GameNetworkView() {
  const router = useRouter();
  const {
    session,
    user,
    currentGame,
    currentRole,
    roles,
    agreements,
    isLoading,
    leaveGame,
    setCurrentRole,
  } = useAppStore();
  const [graphFilters, setGraphFilters] = useState<GraphFilterState>(DEFAULT_GRAPH_FILTERS);
  const [edgeStyle, setEdgeStyle] = useState<GraphEdgeStyle>(DEFAULT_GRAPH_EDGE_STYLE);
  const graphRef = useRef<GameGraphRef>(null);

  useEffect(() => {
    setEdgeStyle(loadGraphEdgeStyle());
  }, []);

  const handleEdgeStyleChange = (style: GraphEdgeStyle) => {
    setEdgeStyle(style);
    saveGraphEdgeStyle(style);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!session || !user) {
      router.push('/login');
    }
  }, [session, user, isLoading, router]);

  useEffect(() => {
    if (isLoading || !currentGame || currentRole || !user || isDemoGame(currentGame)) return;
    const mine = roles.find((r) => r.userId === user.id && r.gameId === currentGame.id);
    if (mine) {
      void setCurrentRole(mine);
    }
  }, [isLoading, currentGame, currentRole, roles, user, setCurrentRole]);

  const myRoleInGame =
    currentRole ??
    (user && currentGame && !isDemoGame(currentGame)
      ? roles.find((r) => r.userId === user.id && r.gameId === currentGame.id) ?? null
      : null);

  if (isLoading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          No active game
        </h1>
        <Card className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Create or join a game, claim a role, then return here to explore the network.
          </p>
          <Link href="/games">
            <Button>Browse games</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!myRoleInGame && !isDemoGame(currentGame)) {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          {currentGame.title}
        </h1>
        <Card className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            You&apos;ve joined this game but haven&apos;t claimed a role yet.
          </p>
          <Link href={`/games/${currentGame.id}/claim-role`}>
            <Button>Claim a role</Button>
          </Link>
          <Link href="/games">
            <Button variant="secondary">Back to games</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isDemo = isDemoGame(currentGame);

  return (
    <div className="space-y-6">
      {isDemo && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>View-only demo.</strong> This game uses mock data for visualization testing.
            You can explore the network and agreement details, but cannot claim roles or negotiate.
          </p>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
            {currentGame.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isDemo ? (
              <>
                Spectator mode · {roles.length} roles · {agreements.length} agreements
              </>
            ) : (
              <>
                Playing as{' '}
                <strong>
                  {myRoleInGame!.template?.name ?? myRoleInGame!.playerName ?? 'your role'}
                </strong>
                {' · '}
                {roles.length} player{roles.length === 1 ? '' : 's'} in game
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {!isDemo && (
            <Link href="/game/propose">
              <Button size="sm">Propose agreement</Button>
            </Link>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              leaveGame();
              router.push('/games');
            }}
          >
            {isDemo ? 'Exit demo' : 'Leave game'}
          </Button>
        </div>
      </div>

      <div className="relative pb-16 md:pb-0">
        <GameGraph
          ref={graphRef}
          roles={roles}
          agreements={agreements}
          edgeStyle={edgeStyle}
          graphFilters={graphFilters}
          currentRoleId={myRoleInGame?.id}
          onNodeClick={(id) => router.push(`/founder/${id}`)}
          onEdgeClick={(id) => router.push(`/agreement/${id}`)}
        />
        <GraphToolbar
          graphFilters={graphFilters}
          onGraphFiltersChange={setGraphFilters}
          edgeStyle={edgeStyle}
          onEdgeStyleChange={handleEdgeStyleChange}
          onZoomReset={() => graphRef.current?.resetZoom()}
          onCenterView={() => graphRef.current?.centerView()}
        />
      </div>

      <GraphControls
        graphFilters={graphFilters}
        onGraphFiltersChange={setGraphFilters}
        edgeStyle={edgeStyle}
        onEdgeStyleChange={handleEdgeStyleChange}
        onZoomReset={() => graphRef.current?.resetZoom()}
        onCenterView={() => graphRef.current?.centerView()}
      />
    </div>
  );
}
