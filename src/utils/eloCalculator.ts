
// ELO Rating System for Sports Matches
export const calculateNewEloRatings = (
  winnerRating: number,
  loserRating: number,
  kFactor: number = 32
): { newWinnerRating: number; newLoserRating: number } => {
  // Calculate expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  // Calculate new ratings
  const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner));
  const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser));

  return {
    newWinnerRating,
    newLoserRating,
  };
};

// Get K-Factor based on player rating (more volatile for new players)
export const getKFactor = (rating: number, matchesPlayed: number): number => {
  if (matchesPlayed < 10) return 40; // New players
  if (rating < 1200) return 32; // Lower rated players
  if (rating < 1600) return 24; // Mid-tier players
  return 16; // High rated players
};

// Initial ELO rating for new players
export const INITIAL_ELO_RATING = 1200;
