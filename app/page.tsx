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
      <div className="space-y-6">
        <h1 className="font-space-grotesk font-bold text-2xl md:text-3xl leading-snug text-gray-900 dark:text-gray-100">
          <i>Polycentricity</i> is a roleplaying game engine for
          exploring emergent cooperation where players build simple agreements with one another,
          building up a complex network of agreements over the duration of play. Any scenario can be
          applied to a game of polycentricity, and the scenario here was imagined for DWeb Camp
          Berlin 2026, based on the essay{' '}
          <span className="text-primary"><em className="italic"><a href="https://vengist.substack.com/p/toward-a-nomad-web" target="_blank" rel="noopener noreferrer">Toward a Nomad Web</a></em></span>.
        </h1>
      </div>

      <Card className="space-y-5">
        <h2 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          Scenario: Nomad Infrastructure
        </h2>
        <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Nomads live a life exterior to the State, holding territory through movement — a mode
            where settlement is subordinate to trajectory. They live in nomad space. The internet has
            become a platform-State which, like all states, is a mode that restricts all other modes,
            enclosing territories to ban movement. Nomads are not to be read as migratory by nature,
            but have been forced into that pattern by the platform-State&apos;s unceasing vectors of
            enclosure. What sort of collective assemblage can be brought together from disparate
            parts of the DWeb ecosystem toward a coherent and functional decentralized web that
            could compete as a durable alternative to the platform-State?
          </p>
          <p>
            In this game, players assume a role within the dweb ecosystem and cooperate to answer
            this question. There is no set victory condition for individual players; there is only
            the collective goal to build as much infrastructure as possible within the duration of
            the game. The game can be replayed infinitely, to discover different and novel possible
            paths to counter the platform-State. Or even continued beyond its initial duration, to
            continue building on a network of agreements that shows potential.
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap justify-center gap-4">
        {isAuthenticated ? (
          <>
            <Link href="/games">
              <Button size="lg">Join game</Button>
            </Link>
            <Link href="/claim-role">
              <Button size="lg" variant="secondary">
                Browse roles
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button size="lg">Sign in</Button>
            </Link>
            <Link href="/games">
              <Button size="lg" variant="secondary">
                Join game
              </Button>
            </Link>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <div className="space-y-4">
            <h3 className="font-space-grotesk font-semibold text-xl text-gray-900 dark:text-gray-100">
              Sign in with email
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your email and we&apos;ll send a magic link to sign in.
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
