import type { EmailOtpType } from '@supabase/supabase-js';

export interface ParsedMagicLink {
  token_hash: string;
  type: EmailOtpType;
}

function normalizeOtpType(type: string): EmailOtpType | null {
  if (type === 'magiclink') return 'email';
  const allowed: EmailOtpType[] = [
    'email',
    'signup',
    'invite',
    'recovery',
    'email_change',
  ];
  return allowed.includes(type as EmailOtpType) ? (type as EmailOtpType) : null;
}

/** Parse a pasted Supabase magic-link or verify URL into verifyOtp params. */
export function parseMagicLinkUrl(raw: string): ParsedMagicLink | null {
  const input = raw.trim();
  if (!input) return null;

  try {
    const url = new URL(input);

    const tokenHash =
      url.searchParams.get('token_hash') ?? url.searchParams.get('token');
    const typeParam = url.searchParams.get('type');

    if (tokenHash && typeParam) {
      const type = normalizeOtpType(typeParam);
      if (type) return { token_hash: tokenHash, type };
    }

    // Hash fragment fallback (#access_token=… handled elsewhere)
    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const hashToken = hashParams.get('token_hash') ?? hashParams.get('token');
      const hashType = hashParams.get('type');
      if (hashToken && hashType) {
        const type = normalizeOtpType(hashType);
        if (type) return { token_hash: hashToken, type };
      }
    }
  } catch {
    return null;
  }

  return null;
}
