/**
 * Ethereum / wallet configuration — DISABLED for this version.
 *
 * Auth uses Supabase magic link instead. Re-enable when on-chain signing returns.
 *
 * @see lib/auth.ts
 * @see components/auth/LoginForm.tsx
 */

/*
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Polycentricity',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});
*/

export {};
