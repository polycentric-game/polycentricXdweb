'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  const { session, user } = useAppStore();
  const isAuthenticated = Boolean(session && user);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-6">
        <h1 className="font-space-grotesk font-bold text-4xl md:text-6xl text-gray-900 dark:text-gray-100">
          Welcome to{' '}
          <span className="text-primary">Polycentric</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          The DWeb Nomad Infrastructure negotiation game. Sign in, explore the role deck, and
          prepare for collaborative infrastructure building.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/claim-role">
            <Button size="lg" variant="secondary">
              Browse Roles
            </Button>
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/profile">
                <Button size="lg" variant="secondary">
                  Your account
                </Button>
              </Link>
              <Link href="/games">
                <Button size="lg">Games</Button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button size="lg">Sign in</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <div className="space-y-4">
            <h3 className="font-space-grotesk font-semibold text-xl text-gray-900 dark:text-gray-100">
              Sign in with email
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              No wallet required. Enter your email and we&apos;ll send a magic link to sign in.
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <h3 className="font-space-grotesk font-semibold text-xl text-gray-900 dark:text-gray-100">
              Browse the deck
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Explore all 31 roles from the DWeb Nomad Infrastructure deck before joining a game.
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <h3 className="font-space-grotesk font-semibold text-xl text-gray-900 dark:text-gray-100">
              Join a game
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create or join a game session, claim a role from the deck, and negotiate agreements
              with other players.
            </p>
          </div>
        </Card>
      </div>

      <div className="space-y-8">
        <h2 className="font-space-grotesk font-bold text-3xl text-center text-gray-900 dark:text-gray-100">
          How It Works
        </h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center">
              1
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Sign in with magic link
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter your email to receive a sign-in link. Your account is separate from any game
                or role.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center">
              2
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Join or create a game
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create a game with a unique title or join an existing one from the games lobby.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center">
              3
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Claim a role & negotiate
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Within your game, choose a role from the deck and forge multi-party agreements through
                narrative commitments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
