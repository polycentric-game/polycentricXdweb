'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { signOut } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from './ThemeToggle';
import { MainNav } from './MainNav';
import { GameNav } from './GameNav';
import { GameSwitcher } from './GameSwitcher';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function Header() {
  const router = useRouter();
  const { session, user, currentGame, clearSession, isLoading: appIsLoading } = useAppStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = Boolean(session && user);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    clearSession();
    setShowAccountMenu(false);
    setShowMobileMenu(false);
    router.push('/');
  };

  const closeMobile = () => setShowMobileMenu(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-700 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span className="font-space-grotesk font-bold text-xl text-gray-900 dark:text-gray-100">
            Polycentric
          </span>
        </Link>

        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-4">
              <MainNav />
              {currentGame && <GameSwitcher />}
            </div>
          )}

          {isAuthenticated ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                <span className="hidden md:inline truncate max-w-[160px]">
                  {user?.email ?? 'Account'}
                </span>
                <span className="md:hidden">{user?.email?.split('@')[0] ?? 'Account'}</span>
                <svg
                  className={`w-4 h-4 shrink-0 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowAccountMenu(false)}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            !appIsLoading && (
              <Button onClick={() => setShowLoginModal(true)} size="sm">
                Sign in
              </Button>
            )
          )}

          {isAuthenticated && (
            <button
              type="button"
              className="md:hidden p-2 rounded-lg border border-gray-300 dark:border-gray-600"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>

      {isAuthenticated && currentGame && (
        <div className="hidden md:block">
          <GameNav />
        </div>
      )}

      {isAuthenticated && showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 py-3 space-y-3">
            <MainNav isMobile onLinkClick={closeMobile} />
            {currentGame ? (
              <>
                <GameSwitcher onNavigate={closeMobile} />
                <GameNav isMobile onLinkClick={closeMobile} />
              </>
            ) : null}
          </div>
        </div>
      )}

      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Sign in">
        <LoginForm compact onSuccess={() => setShowLoginModal(false)} />
      </Modal>
    </header>
  );
}
