const CURRENT_GAME_KEY = 'polycentric_current_game_id';

export function getStoredGameId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_GAME_KEY);
}

export function setStoredGameId(gameId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_GAME_KEY, gameId);
}

export function clearStoredGameId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_GAME_KEY);
}
