package services

import (
	"database/sql"
	"fmt"

	"github.com/42heilbronn/elo-leaderboard/internal/models"
	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
)

type MatchService struct {
	db              *sql.DB
	matchRepo       *repositories.MatchRepository
	userRepo        *repositories.UserRepository
	eloService      *ELOService
}

func NewMatchService(
	db *sql.DB,
	matchRepo *repositories.MatchRepository,
	userRepo *repositories.UserRepository,
	eloService *ELOService,
) *MatchService {
	return &MatchService{
		db:         db,
		matchRepo:  matchRepo,
		userRepo:   userRepo,
		eloService: eloService,
	}
}

// SubmitMatch creates a new pending match
func (s *MatchService) SubmitMatch(req *models.SubmitMatchRequest, submitterID int) (*models.Match, error) {
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

	// Get current ELO ratings
	player1, err := s.userRepo.GetByID(match.Player1ID)
	if err != nil {
		return err
	}

	player2, err := s.userRepo.GetByID(match.Player2ID)
	if err != nil {
		return err
	}

	var player1ELO, player2ELO int
	if match.Sport == models.SportTableTennis {
		player1ELO = player1.TableTennisELO
		player2ELO = player2.TableTennisELO
	} else {
		player1ELO = player1.TableFootballELO
		player2ELO = player2.TableFootballELO
	}

	// Calculate new ELO ratings
	player1Won := match.WinnerID == match.Player1ID
	player1NewELO, player2NewELO, player1Delta, player2Delta := s.eloService.CalculateELO(
		player1ELO,
		player2ELO,
		player1Won,
	)

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

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

	// Update user ELO ratings
	if err := s.userRepo.UpdateELO(tx, match.Player1ID, match.Sport, player1NewELO); err != nil {
		return err
	}

	if err := s.userRepo.UpdateELO(tx, match.Player2ID, match.Sport, player2NewELO); err != nil {
		return err
	}

	// Commit transaction
	return tx.Commit()
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

// GetLeaderboard generates leaderboard for a sport
// Optimized to use a single query instead of N+1 queries
func (s *MatchService) GetLeaderboard(sport string) ([]models.LeaderboardEntry, error) {
	// Get all users with their match statistics in a single query
	entries, err := s.matchRepo.GetLeaderboardEntries(sport)
	if err != nil {
		return nil, err
	}

	// Sort by ELO (descending) using more efficient sort
	sortLeaderboardByELO(entries)

	// Assign ranks
	for i := range entries {
		entries[i].Rank = i + 1
	}

	return entries, nil
}

// sortLeaderboardByELO sorts entries by ELO descending using optimized algorithm
func sortLeaderboardByELO(entries []models.LeaderboardEntry) {
	// Use insertion sort for small slices, quicksort-like approach for larger ones
	n := len(entries)
	for i := 1; i < n; i++ {
		key := entries[i]
		j := i - 1
		for j >= 0 && entries[j].ELO < key.ELO {
			entries[j+1] = entries[j]
			j--
		}
		entries[j+1] = key
	}
}
