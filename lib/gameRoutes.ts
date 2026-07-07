/** Canonical URL for a game's network graph view. */
export function gameNetworkPath(gameId: string): string {
  return `/games/${gameId}/network`;
}
