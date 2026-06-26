/**
 * Wallet auth hook — DISABLED for this version.
 * Use Supabase magic link via components/auth/AuthProvider.tsx instead.
 */

/*
export function useWalletAuth() { ... }
*/

export function useWalletAuth() {
  return {
    walletConnected: false,
    isAuthenticated: false,
    isAuthenticating: false,
    authError: null,
    canClaim: false,
  };
}
