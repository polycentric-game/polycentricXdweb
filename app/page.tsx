'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/layout/Logo';

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
          <em className="italic underline">
            <a href="https://vengist.substack.com/p/toward-a-nomad-web" target="_blank" rel="noopener noreferrer">
              Toward a Nomad Web
            </a>
          </em>{' '}
          by Ven Gist.
        </h1>
      </div>

      <Card className="space-y-8">
        <div className="space-y-5">
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
        </div>

        <div className="space-y-6 pt-2 border-t border-gray-200 dark:border-gray-700">
          <h2 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
            How to play
          </h2>
          <ol className="space-y-5">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center text-sm">
                1
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sign in</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Enter your email for a magic link. No wallet required — your account is separate
                  from any game or role.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center text-sm">
                2
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Join a game</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Create a session or join one from the games lobby. You can browse the 31-role deck
                  before committing to a game.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center text-sm">
                3
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Claim a role &amp; negotiate
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Choose a role from the deck, then propose and revise multi-party agreements with
                  other players. Watch the network grow on the graph as deals are made.
                </p>
              </div>
            </li>
          </ol>
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

      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="w-full min-h-[14rem] sm:min-h-[16rem] md:min-h-0 md:w-2/5 lg:w-[38%] shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 p-8 md:p-10">
            <Logo className="h-auto w-full max-w-[280px] text-gray-900 dark:text-white" />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 md:p-8 flex-1 min-w-0">
            <h2 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
              About Polycentricity
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                Polycentricity is an open roleplaying game engine for exploring how simple agreements
                between players compose into complex, emergent cooperation. Any scenario can be loaded
                onto the engine — this site hosts one instantiation, built for DWeb Camp Berlin 2026.
              </p>
              <p>
                For the full project — other scenarios, design notes, and ways to run your own game — visit{' '}
                <a
                  href="https://polycentric.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline"
                >
                  polycentric.space
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div
            className="w-full min-h-[14rem] sm:min-h-[16rem] md:min-h-0 md:w-2/5 lg:w-[38%] shrink-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/nomad-web-desert-bw.png')" }}
            role="img"
            aria-label="Toward a Nomad Web essay"
          />
          <div className="flex flex-col justify-center gap-4 p-6 md:p-8 flex-1 min-w-0">
            <div className="space-y-1">
              <h2 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
                <a
                  href="https://vengist.substack.com/p/toward-a-nomad-web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Toward a Nomad Web
                </a>
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">
                A Brief History of the Internet&apos;s Enclosure and the Conditions of Its Release
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              The history of the internet is a long oscillation between nomad space and settled space—the
              open, ownerless protocols of the early web progressively enclosed by the platform-State that
              captured each function of networked life and dominating the flows of relation. The essay
              traces the genesis and anatomy of the vectors of enclosure and argues for a nomad web,
              engineered so that exit is always cheaper than capture, and settlement is subordinate to
              the freedom of movement.
            </p>
            <a
              href="https://vengist.substack.com/p/toward-a-nomad-web"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-primary font-medium hover:underline"
            >
              Read the essay →
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
