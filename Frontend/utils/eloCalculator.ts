
// ELO Rating System for Sports Matches
export const calculateNewEloRatings = (
  winnerRating: number,
  loserRating: number,
  winnerMatchesPlayed: number = 0,
  loserMatchesPlayed: number = 0
): { newWinnerRating: number; newLoserRating: number } => {
  // Calculate expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  // Get K-factors for both players considering their opponent
  const winnerKFactor = getKFactor(winnerRating, loserRating, winnerMatchesPlayed);
  const loserKFactor = getKFactor(loserRating, winnerRating, loserMatchesPlayed);

  // Calculate new ratings
  const newWinnerRating = Math.round(winnerRating + winnerKFactor * (1 - expectedWinner));
  const newLoserRating = Math.round(loserRating + loserKFactor * (0 - expectedLoser));

  return {
    newWinnerRating,
    newLoserRating,
  };
};

// Get K-Factor based on player rating (more volatile for new players)
// Enhanced K-Factor calculation considering opponent's rating
export const getKFactor = (
  playerRating: number,
  opponentRating: number,
  matchesPlayed: number
): number => {
  const ratingDifference = Math.abs(playerRating - opponentRating);

  let baseKFactor: number;

  // Base K-factor based on player experience and rating
  if (matchesPlayed < 10) baseKFactor = 40; // New players
  else if (playerRating < 1200) baseKFactor = 32; // Lower rated players
  else if (playerRating < 1600) baseKFactor = 24; // Mid-tier players
  else if (playerRating < 2000) baseKFactor = 16; // Upper mid-tier players
  else if (playerRating < 2400) baseKFactor = 12; // High mid-tier players
  else baseKFactor = 8; // High rated players

  // Adjust K-factor based on rating difference
  if (ratingDifference > 400) {
    // Large rating difference - more volatile changes
    baseKFactor = Math.round(baseKFactor * 1.2);
  } else if (ratingDifference < 100) {
    // Small rating difference - less volatile changes
    baseKFactor = Math.round(baseKFactor * 0.8);
  }

  return Math.max(8, Math.min(50, baseKFactor)); // Clamp between 8 and 50
};

// Initial ELO rating for new players
export const INITIAL_ELO_RATING = 1000;
