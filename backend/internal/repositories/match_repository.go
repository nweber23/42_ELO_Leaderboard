package repositories

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/42heilbronn/elo-leaderboard/internal/models"
)

type MatchRepository struct {
	db *sql.DB
}

func NewMatchRepository(db *sql.DB) *MatchRepository {
	return &MatchRepository{db: db}
}

// Create creates a new match
func (r *MatchRepository) Create(tx *sql.Tx, match *models.Match) error {
	query := `
		INSERT INTO matches (
			sport, player1_id, player2_id, player1_score, player2_score,
			winner_id, status, submitted_by, context
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	var scanner interface {
		Scan(dest ...interface{}) error
	}

	if tx != nil {
		scanner = tx.QueryRow(
			query,
			match.Sport,
			match.Player1ID,
			match.Player2ID,
			match.Player1Score,
			match.Player2Score,
			match.WinnerID,
			match.Status,
			match.SubmittedBy,
			match.Context,
		)
	} else {
		scanner = r.db.QueryRow(
			query,
			match.Sport,
			match.Player1ID,
			match.Player2ID,
			match.Player1Score,
			match.Player2Score,
			match.WinnerID,
			match.Status,
			match.SubmittedBy,
			match.Context,
		)
	}

	return scanner.Scan(&match.ID, &match.CreatedAt, &match.UpdatedAt)
}

// GetByID retrieves a match by ID
func (r *MatchRepository) GetByID(id int) (*models.Match, error) {
	match := &models.Match{}
	query := `
		SELECT id, sport, player1_id, player2_id, player1_score, player2_score,
		       winner_id, status, context, player1_elo_before, player1_elo_after, player1_elo_delta,
		       player2_elo_before, player2_elo_after, player2_elo_delta,
		       submitted_by, confirmed_at, denied_at, created_at, updated_at
		FROM matches WHERE id = $1
	`

	err := r.db.QueryRow(query, id).Scan(
		&match.ID,
		&match.Sport,
		&match.Player1ID,
		&match.Player2ID,
		&match.Player1Score,
		&match.Player2Score,
		&match.WinnerID,
		&match.Status,
		&match.Context,
		&match.Player1ELOBefore,
		&match.Player1ELOAfter,
		&match.Player1ELODelta,
		&match.Player2ELOBefore,
		&match.Player2ELOAfter,
		&match.Player2ELODelta,
		&match.SubmittedBy,
		&match.ConfirmedAt,
		&match.DeniedAt,
		&match.CreatedAt,
		&match.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("match not found")
	}

	return match, err
}

// GetPendingMatchBetweenPlayers checks for pending match between two players
func (r *MatchRepository) GetPendingMatchBetweenPlayers(player1ID, player2ID int, sport string) (*models.Match, error) {
	match := &models.Match{}
	query := `
		SELECT id, sport, player1_id, player2_id, player1_score, player2_score,
		       winner_id, status, context, player1_elo_before, player1_elo_after, player1_elo_delta,
		       player2_elo_before, player2_elo_after, player2_elo_delta,
		       submitted_by, confirmed_at, denied_at, created_at, updated_at
		FROM matches
		WHERE sport = $1
		  AND status = $2
		  AND ((player1_id = $3 AND player2_id = $4) OR (player1_id = $4 AND player2_id = $3))
		LIMIT 1
	`

	err := r.db.QueryRow(query, sport, models.StatusPending, player1ID, player2ID).Scan(
		&match.ID,
		&match.Sport,
		&match.Player1ID,
		&match.Player2ID,
		&match.Player1Score,
		&match.Player2Score,
		&match.WinnerID,
		&match.Status,
		&match.Context,
		&match.Player1ELOBefore,
		&match.Player1ELOAfter,
		&match.Player1ELODelta,
		&match.Player2ELOBefore,
		&match.Player2ELOAfter,
		&match.Player2ELODelta,
		&match.SubmittedBy,
		&match.ConfirmedAt,
		&match.DeniedAt,
		&match.CreatedAt,
		&match.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	return match, err
}

// ConfirmMatch confirms a match and updates ELO
func (r *MatchRepository) ConfirmMatch(tx *sql.Tx, matchID int, eloData map[string]int) error {
	now := time.Now()
	query := `
		UPDATE matches SET
			status = $1,
			confirmed_at = $2,
			player1_elo_before = $3,
			player1_elo_after = $4,
			player1_elo_delta = $5,
			player2_elo_before = $6,
			player2_elo_after = $7,
			player2_elo_delta = $8
		WHERE id = $9
	`

	var err error
	if tx != nil {
		_, err = tx.Exec(
			query,
			models.StatusConfirmed,
			now,
			eloData["player1_before"],
			eloData["player1_after"],
			eloData["player1_delta"],
			eloData["player2_before"],
			eloData["player2_after"],
			eloData["player2_delta"],
			matchID,
		)
	} else {
		_, err = r.db.Exec(
			query,
			models.StatusConfirmed,
			now,
			eloData["player1_before"],
			eloData["player1_after"],
			eloData["player1_delta"],
			eloData["player2_before"],
			eloData["player2_after"],
			eloData["player2_delta"],
			matchID,
		)
	}

	return err
}

// DenyMatch denies a match
func (r *MatchRepository) DenyMatch(matchID int) error {
	now := time.Now()
	query := `UPDATE matches SET status = $1, denied_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, models.StatusDenied, now, matchID)
	return err
}

// GetLeaderboardEntries retrieves all users with their match statistics in a single optimized query
// This eliminates the N+1 query problem by using aggregation
func (r *MatchRepository) GetLeaderboardEntries(sport string) ([]models.LeaderboardEntry, error) {
	// Single query that gets all users and their match statistics
	query := `
		WITH user_stats AS (
			SELECT
				u.id,
				u.intra_id,
				u.login,
				u.display_name,
				u.avatar_url,
				u.campus,
				u.table_tennis_elo,
				u.table_football_elo,
				u.created_at,
				u.updated_at,
				COALESCE(COUNT(m.id), 0) as matches_played,
				COALESCE(SUM(CASE WHEN m.winner_id = u.id THEN 1 ELSE 0 END), 0) as wins
			FROM users u
			LEFT JOIN matches m ON (m.player1_id = u.id OR m.player2_id = u.id)
				AND m.sport = $1
				AND m.status = $2
			WHERE u.intra_id != -1
			GROUP BY u.id, u.intra_id, u.login, u.display_name, u.avatar_url, u.campus,
				u.table_tennis_elo, u.table_football_elo, u.created_at, u.updated_at
		)
		SELECT
			id, intra_id, login, display_name, avatar_url, campus,
			table_tennis_elo, table_football_elo, created_at, updated_at,
			matches_played, wins
		FROM user_stats
	`

	rows, err := r.db.Query(query, sport, models.StatusConfirmed)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []models.LeaderboardEntry
	for rows.Next() {
		var user models.User
		var matchesPlayed, wins int

		if err := rows.Scan(
			&user.ID,
			&user.IntraID,
			&user.Login,
			&user.DisplayName,
			&user.AvatarURL,
			&user.Campus,
			&user.TableTennisELO,
			&user.TableFootballELO,
			&user.CreatedAt,
			&user.UpdatedAt,
			&matchesPlayed,
			&wins,
		); err != nil {
			return nil, err
		}

		losses := matchesPlayed - wins
		winRate := 0.0
		if matchesPlayed > 0 {
			winRate = float64(wins) / float64(matchesPlayed) * 100
		}

		var elo int
		if sport == models.SportTableTennis {
			elo = user.TableTennisELO
		} else {
			elo = user.TableFootballELO
		}

		entries = append(entries, models.LeaderboardEntry{
			User:          user,
			ELO:           elo,
			MatchesPlayed: matchesPlayed,
			Wins:          wins,
			Losses:        losses,
			WinRate:       winRate,
		})
	}

	return entries, rows.Err()
}

// CancelMatch cancels a pending match (by submitter)
func (r *MatchRepository) CancelMatch(matchID int) error {
	query := `UPDATE matches SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, models.StatusCancelled, time.Now(), matchID)
	return err
}

// GetMatches retrieves matches with filters
func (r *MatchRepository) GetMatches(userID *int, sport *string, status *string, limit int, offset int) ([]models.Match, error) {
	query := `
		SELECT id, sport, player1_id, player2_id, player1_score, player2_score,
		       winner_id, status, context, player1_elo_before, player1_elo_after, player1_elo_delta,
		       player2_elo_before, player2_elo_after, player2_elo_delta,
		       submitted_by, confirmed_at, denied_at, created_at, updated_at
		FROM matches
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if userID != nil {
		query += fmt.Sprintf(" AND (player1_id = $%d OR player2_id = $%d)", argCount, argCount)
		args = append(args, *userID)
		argCount++
	}

	if sport != nil {
		query += fmt.Sprintf(" AND sport = $%d", argCount)
		args = append(args, *sport)
		argCount++
	}

	if status != nil {
		query += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, *status)
		argCount++
	}

	query += " ORDER BY created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []models.Match
	for rows.Next() {
		var match models.Match
		if err := rows.Scan(
			&match.ID,
			&match.Sport,
			&match.Player1ID,
			&match.Player2ID,
			&match.Player1Score,
			&match.Player2Score,
			&match.WinnerID,
			&match.Status,
			&match.Context,
			&match.Player1ELOBefore,
			&match.Player1ELOAfter,
			&match.Player1ELODelta,
			&match.Player2ELOBefore,
			&match.Player2ELOAfter,
			&match.Player2ELODelta,
			&match.SubmittedBy,
			&match.ConfirmedAt,
			&match.DeniedAt,
			&match.CreatedAt,
			&match.UpdatedAt,
		); err != nil {
			return nil, err
		}
		matches = append(matches, match)
	}

	return matches, rows.Err()
}

// GetUserMatches retrieves all matches for a user with filters
func (r *MatchRepository) GetUserMatches(userID int, sport *string, opponentID *int, won *bool) ([]models.Match, error) {
	query := `
		SELECT id, sport, player1_id, player2_id, player1_score, player2_score,
		       winner_id, status, context, player1_elo_before, player1_elo_after, player1_elo_delta,
		       player2_elo_before, player2_elo_after, player2_elo_delta,
		       submitted_by, confirmed_at, denied_at, created_at, updated_at
		FROM matches
		WHERE (player1_id = $1 OR player2_id = $1)
		  AND status = $2
	`

	args := []interface{}{userID, models.StatusConfirmed}
	argCount := 3

	if sport != nil {
		query += fmt.Sprintf(" AND sport = $%d", argCount)
		args = append(args, *sport)
		argCount++
	}

	if opponentID != nil {
		query += fmt.Sprintf(" AND (player1_id = $%d OR player2_id = $%d)", argCount, argCount)
		args = append(args, *opponentID)
		argCount++
	}

	if won != nil {
		if *won {
			query += fmt.Sprintf(" AND winner_id = $%d", argCount)
		} else {
			query += fmt.Sprintf(" AND winner_id != $%d", argCount)
		}
		args = append(args, userID)
		argCount++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []models.Match
	for rows.Next() {
		var match models.Match
		if err := rows.Scan(
			&match.ID,
			&match.Sport,
			&match.Player1ID,
			&match.Player2ID,
			&match.Player1Score,
			&match.Player2Score,
			&match.WinnerID,
			&match.Status,
			&match.Context,
			&match.Player1ELOBefore,
			&match.Player1ELOAfter,
			&match.Player1ELODelta,
			&match.Player2ELOBefore,
			&match.Player2ELOAfter,
			&match.Player2ELODelta,
			&match.SubmittedBy,
			&match.ConfirmedAt,
			&match.DeniedAt,
			&match.CreatedAt,
			&match.UpdatedAt,
		); err != nil {
			return nil, err
		}
		matches = append(matches, match)
	}

	return matches, rows.Err()
}
