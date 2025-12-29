/**
 * ELO calculation utilities for client-side predictions
 * Matches the backend K-factor of 32
 */

const K_FACTOR = 32;

/**
 * Calculate expected score for a player
 * Formula: E = 1 / (1 + 10^((opponentELO - playerELO) / 400))
 */
export function expectedScore(playerELO: number, opponentELO: number): number {
  return 1.0 / (1.0 + Math.pow(10, (opponentELO - playerELO) / 400.0));
}

/**
 * Calculate ELO change for a match
 * Returns: { playerDelta, opponentDelta, playerNewELO, opponentNewELO }
 */
export function calculateELOChange(
  playerELO: number,
  opponentELO: number,
  playerWins: boolean
): {
  playerDelta: number;
  opponentDelta: number;
  playerNewELO: number;
  opponentNewELO: number;
} {
  const expectedPlayer = expectedScore(playerELO, opponentELO);
  const expectedOpponent = expectedScore(opponentELO, playerELO);

  const actualPlayer = playerWins ? 1.0 : 0.0;
  const actualOpponent = playerWins ? 0.0 : 1.0;

  const playerDelta = Math.round(K_FACTOR * (actualPlayer - expectedPlayer));
  const opponentDelta = Math.round(K_FACTOR * (actualOpponent - expectedOpponent));

  return {
    playerDelta,
    opponentDelta,
    playerNewELO: playerELO + playerDelta,
    opponentNewELO: opponentELO + opponentDelta,
  };
}

/**
 * Format ELO delta with sign for display
 */
export function formatEloDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

/**
 * Get color class for ELO delta
 */
export function getEloDeltaColor(delta: number): string {
  if (delta > 0) return 'success';
  if (delta < 0) return 'danger';
  return 'neutral';
}
