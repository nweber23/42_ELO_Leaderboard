package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/42heilbronn/elo-leaderboard/internal/cache"
	"github.com/42heilbronn/elo-leaderboard/internal/models"
	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
)

// Cache TTL for leaderboard data
const leaderboardCacheTTL = 5 * time.Minute

type MatchService struct {
	db             *sql.DB
	matchRepo      *repositories.MatchRepository
	userRepo       *repositories.UserRepository
	userSportsRepo *repositories.UserSportsRepository
	sportService   *SportService
	eloService     *ELOService
	cache          *cache.Cache
}

func NewMatchService(
	db *sql.DB,
	matchRepo *repositories.MatchRepository,
	userRepo *repositories.UserRepository,
	userSportsRepo *repositories.UserSportsRepository,
	sportService *SportService,
	eloService *ELOService,
) *MatchService {
	return &MatchService{
		db:             db,
		matchRepo:      matchRepo,
		userRepo:       userRepo,
		userSportsRepo: userSportsRepo,
		sportService:   sportService,
		eloService:     eloService,
		cache:          cache.NewCache(leaderboardCacheTTL, 1*time.Minute),
	}
}

// SubmitMatch creates a new pending match
func (s *MatchService) SubmitMatch(req *models.SubmitMatchRequest, submitterID int) (*models.Match, error) {
	// Validate sport exists and is active
	sport, err := s.sportService.GetSport(req.Sport)
	if err != nil {
		return nil, fmt.Errorf("invalid sport")
	}

	// Validate scores are within the sport's allowed range
	if req.PlayerScore < sport.MinScore || req.PlayerScore > sport.MaxScore {
		return nil, fmt.Errorf("player score must be between %d and %d", sport.MinScore, sport.MaxScore)
	}
	if req.OpponentScore < sport.MinScore || req.OpponentScore > sport.MaxScore {
		return nil, fmt.Errorf("opponent score must be between %d and %d", sport.MinScore, sport.MaxScore)
	}

	// Validate: cannot play against yourself
	if req.OpponentID == submitterID {
		return nil, fmt.Errorf("cannot submit a match against yourself")
	}

	// Validate: scores cannot be equal (must have a winner)
	if req.PlayerScore == req.OpponentScore {
		return nil, fmt.Errorf("match cannot end in a tie")
	}

	// Check opponent exists
	opponent, err := s.userRepo.GetByID(req.OpponentID)
	if err != nil {
		return nil, fmt.Errorf("opponent not found")
	}

	// Check for existing pending match
	existingMatch, err := s.matchRepo.GetPendingMatchBetweenPlayers(submitterID, req.OpponentID, req.Sport)
	if err != nil {
		return nil, err
	}
	if existingMatch != nil {
		return nil, fmt.Errorf("a pending match already exists between these players for this sport")
	}

	// Determine winner
	var winnerID int
	if req.PlayerScore > req.OpponentScore {
		winnerID = submitterID
	} else {
		winnerID = req.OpponentID
	}

	// Create match
	match := &models.Match{
		Sport:        req.Sport,
		Player1ID:    submitterID,
		Player2ID:    req.OpponentID,
		Player1Score: req.PlayerScore,
		Player2Score: req.OpponentScore,
		WinnerID:     winnerID,
		Status:       models.StatusPending,
		SubmittedBy:  submitterID,
		Context:      req.Context,
	}

	if err := s.matchRepo.Create(nil, match); err != nil {
		return nil, err
	}

	_ = opponent // Suppress unused warning

	return match, nil
}

// ConfirmMatch confirms a pending match and updates ELO ratings
func (s *MatchService) ConfirmMatch(matchID, userID int) error {
	// Get the match
	match, err := s.matchRepo.GetByID(matchID)
	if err != nil {
		return err
	}

	// Validate status
	if match.Status != models.StatusPending {
		return fmt.Errorf("match is not pending")
	}

	// Validate: only the opponent can confirm (not the submitter)
	if match.SubmittedBy == userID {
		return fmt.Errorf("you cannot confirm your own match")
	}

	// Validate: user must be one of the players
	if match.Player1ID != userID && match.Player2ID != userID {
		return fmt.Errorf("you are not part of this match")
	}

	// Get current ELO ratings from user_sports table (generic for any sport)
	player1ELO, err := s.userSportsRepo.GetUserELO(match.Player1ID, match.Sport)
	if err != nil {
		return fmt.Errorf("failed to get player1 ELO: %w", err)
	}

	player2ELO, err := s.userSportsRepo.GetUserELO(match.Player2ID, match.Sport)
	if err != nil {
		return fmt.Errorf("failed to get player2 ELO: %w", err)
	}

	// Calculate new ELO ratings
	player1Won := match.WinnerID == match.Player1ID
	player1NewELO, player2NewELO, player1Delta, player2Delta := s.eloService.CalculateELO(
		player1ELO,
		player2ELO,
		player1Won,
	)

	// Start transaction with SERIALIZABLE isolation level to prevent race conditions
	// This ensures that concurrent ELO updates don't interfere with each other
	ctx := context.Background()
	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelSerializable,
	})
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Re-fetch ELO values within transaction to ensure consistency
	// This is necessary because the ELO might have changed between our initial read and now
	player1CurrentELO, err := s.userSportsRepo.GetUserELOForUpdate(tx, match.Player1ID, match.Sport)
	if err != nil {
		return fmt.Errorf("failed to lock player1: %w", err)
	}
	player2CurrentELO, err := s.userSportsRepo.GetUserELOForUpdate(tx, match.Player2ID, match.Sport)
	if err != nil {
		return fmt.Errorf("failed to lock player2: %w", err)
	}

	// If ELO changed between reads, recalculate
	if player1CurrentELO != player1ELO || player2CurrentELO != player2ELO {
		player1ELO = player1CurrentELO
		player2ELO = player2CurrentELO
		player1NewELO, player2NewELO, player1Delta, player2Delta = s.eloService.CalculateELO(
			player1ELO,
			player2ELO,
			player1Won,
		)
	}

	// Update match with ELO data
	eloData := map[string]int{
		"player1_before": player1ELO,
		"player1_after":  player1NewELO,
		"player1_delta":  player1Delta,
		"player2_before": player2ELO,
		"player2_after":  player2NewELO,
		"player2_delta":  player2Delta,
	}

	if err := s.matchRepo.ConfirmMatch(tx, matchID, eloData); err != nil {
		return err
	}

	// Update user ELO ratings in user_sports table
	if err := s.userSportsRepo.UpdateUserELO(tx, match.Player1ID, match.Sport, player1NewELO); err != nil {
		return err
	}

	if err := s.userSportsRepo.UpdateUserELO(tx, match.Player2ID, match.Sport, player2NewELO); err != nil {
		return err
	}

	// Update match statistics
	if err := s.userSportsRepo.IncrementMatchStats(tx, match.Player1ID, match.Sport, player1Won); err != nil {
		return fmt.Errorf("failed to update player1 stats: %w", err)
	}

	if err := s.userSportsRepo.IncrementMatchStats(tx, match.Player2ID, match.Sport, !player1Won); err != nil {
		return fmt.Errorf("failed to update player2 stats: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return err
	}

	// Invalidate leaderboard cache since ELO changed
	s.InvalidateLeaderboardCache(match.Sport)

	return nil
}

// DenyMatch denies a pending match
func (s *MatchService) DenyMatch(matchID, userID int) error {
	// Get the match
	match, err := s.matchRepo.GetByID(matchID)
	if err != nil {
		return err
	}

	// Validate status
	if match.Status != models.StatusPending {
		return fmt.Errorf("match is not pending")
	}

	// Validate: only the opponent can deny (not the submitter)
	if match.SubmittedBy == userID {
		return fmt.Errorf("you cannot deny your own match")
	}

	// Validate: user must be one of the players
	if match.Player1ID != userID && match.Player2ID != userID {
		return fmt.Errorf("you are not part of this match")
	}

	return s.matchRepo.DenyMatch(matchID)
}

// CancelMatch cancels a pending match (only the submitter can cancel)
func (s *MatchService) CancelMatch(matchID, userID int) error {
	// Get the match
	match, err := s.matchRepo.GetByID(matchID)
	if err != nil {
		return err
	}

	// Validate status
	if match.Status != models.StatusPending {
		return fmt.Errorf("match is not pending")
	}

	// Validate: only the submitter can cancel
	if match.SubmittedBy != userID {
		return fmt.Errorf("only the submitter can cancel this match")
	}

	return s.matchRepo.CancelMatch(matchID)
}

// GetLeaderboard generates paginated leaderboard for a sport
// Optimized with caching - regenerates every 5 minutes
// Returns entries, total count, and error
func (s *MatchService) GetLeaderboard(sport string, limit int, offset int) ([]models.LeaderboardEntry, int, error) {
	cacheKey := fmt.Sprintf("leaderboard:%s:%d:%d", sport, limit, offset)

	// Try to get from cache first
	if cached, found := s.cache.Get(cacheKey); found {
		if data, ok := cached.(struct {
			entries []models.LeaderboardEntry
			total   int
		}); ok {
			return data.entries, data.total, nil
		}
	}

	// Fetch total count
	total, err := s.matchRepo.GetLeaderboardTotalCount(sport)
	if err != nil {
		return nil, 0, err
	}

	// Cache miss - fetch paginated entries from database
	entries, err := s.matchRepo.GetLeaderboardEntries(sport, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// Assign ranks relative to offset (for paginated display)
	for i := range entries {
		entries[i].Rank = offset + i + 1
	}

	// Store in cache
	s.cache.Set(cacheKey, struct {
		entries []models.LeaderboardEntry
		total   int
	}{entries, total})

	return entries, total, nil
}

// GetUserLeaderboardRank returns the user's rank, ELO, and total player count for a sport
func (s *MatchService) GetUserLeaderboardRank(userID int, sport string) (int, int, int, error) {
	cacheKey := fmt.Sprintf("user_rank:%s:%d", sport, userID)

	// Try to get from cache first
	if cached, found := s.cache.Get(cacheKey); found {
		if data, ok := cached.(struct {
			rank  int
			elo   int
			total int
		}); ok {
			return data.rank, data.elo, data.total, nil
		}
	}

	rank, elo, err := s.matchRepo.GetUserRank(userID, sport)
	if err != nil {
		return 0, 0, 0, err
	}

	total, err := s.matchRepo.GetLeaderboardTotalCount(sport)
	if err != nil {
		return 0, 0, 0, err
	}

	s.cache.Set(cacheKey, struct {
		rank  int
		elo   int
		total int
	}{rank, elo, total})

	return rank, elo, total, nil
}

// InvalidateLeaderboardCache clears all leaderboard caches for a sport
// Should be called after match confirmations that affect ELO
func (s *MatchService) InvalidateLeaderboardCache(sport string) {
	s.cache.DeleteByPrefix(fmt.Sprintf("leaderboard:%s:", sport))
	s.cache.DeleteByPrefix(fmt.Sprintf("user_rank:%s:", sport))
}

// InvalidateAllLeaderboardCaches clears all leaderboard caches for all sports
// Should be called when user data changes (creation, deletion, etc.)
func (s *MatchService) InvalidateAllLeaderboardCaches() {
	s.cache.DeleteByPrefix("leaderboard:")
	s.cache.DeleteByPrefix("user_rank:")
}

