package repositories

import (
	"database/sql"
	"fmt"
	"time"
)

// UserSportData represents a user's statistics for a specific sport
type UserSportData struct {
	UserID        int       `json:"user_id"`
	SportID       string    `json:"sport_id"`
	CurrentELO    int       `json:"current_elo"`
	HighestELO    int       `json:"highest_elo"`
	MatchesPlayed int       `json:"matches_played"`
	Wins          int       `json:"wins"`
	Losses        int       `json:"losses"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// UserSportsRepository handles database operations for user sports data
type UserSportsRepository struct {
	db *sql.DB
}

// NewUserSportsRepository creates a new UserSportsRepository instance
func NewUserSportsRepository(db *sql.DB) *UserSportsRepository {
	return &UserSportsRepository{db: db}
}

// GetUserELO retrieves a user's current ELO for a specific sport
// Returns the default ELO (1000) if no record exists
func (r *UserSportsRepository) GetUserELO(userID int, sportID string) (int, error) {
	var currentELO int
	query := `SELECT current_elo FROM user_sports WHERE user_id = $1 AND sport_id = $2`

	err := r.db.QueryRow(query, userID, sportID).Scan(&currentELO)
	if err == sql.ErrNoRows {
		return 1000, nil // Default ELO for new users
	}
	if err != nil {
		return 0, fmt.Errorf("failed to get user ELO: %w", err)
	}

	return currentELO, nil
}

// GetUserELOForUpdate retrieves a user's current ELO with a row lock for update
// This should be used within a transaction to prevent race conditions
func (r *UserSportsRepository) GetUserELOForUpdate(tx *sql.Tx, userID int, sportID string) (int, error) {
	var currentELO int
	query := `SELECT current_elo FROM user_sports WHERE user_id = $1 AND sport_id = $2 FOR UPDATE`

	err := tx.QueryRow(query, userID, sportID).Scan(&currentELO)
	if err == sql.ErrNoRows {
		return 1000, nil // Default ELO for new users
	}
	if err != nil {
		return 0, fmt.Errorf("failed to get user ELO for update: %w", err)
	}

	return currentELO, nil
}

// UpdateUserELO updates a user's ELO for a specific sport
// Creates the record if it doesn't exist (upsert)
func (r *UserSportsRepository) UpdateUserELO(tx *sql.Tx, userID int, sportID string, newELO int) error {
	query := `
		INSERT INTO user_sports (user_id, sport_id, current_elo, highest_elo)
		VALUES ($1, $2, $3, $3)
		ON CONFLICT (user_id, sport_id) DO UPDATE SET
			current_elo = $3,
			highest_elo = GREATEST(user_sports.highest_elo, $3),
			updated_at = CURRENT_TIMESTAMP
	`

	var result sql.Result
	var err error

	if tx != nil {
		result, err = tx.Exec(query, userID, sportID, newELO)
	} else {
		result, err = r.db.Exec(query, userID, sportID, newELO)
	}

	if err != nil {
		return fmt.Errorf("failed to update user ELO: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("no rows updated")
	}

	return nil
}

// IncrementMatchStats updates a user's match statistics after a game
func (r *UserSportsRepository) IncrementMatchStats(tx *sql.Tx, userID int, sportID string, won bool) error {
	var query string
	if won {
		query = `
			INSERT INTO user_sports (user_id, sport_id, matches_played, wins, losses)
			VALUES ($1, $2, 1, 1, 0)
			ON CONFLICT (user_id, sport_id) DO UPDATE SET
				matches_played = user_sports.matches_played + 1,
				wins = user_sports.wins + 1,
				updated_at = CURRENT_TIMESTAMP
		`
	} else {
		query = `
			INSERT INTO user_sports (user_id, sport_id, matches_played, wins, losses)
			VALUES ($1, $2, 1, 0, 1)
			ON CONFLICT (user_id, sport_id) DO UPDATE SET
				matches_played = user_sports.matches_played + 1,
				losses = user_sports.losses + 1,
				updated_at = CURRENT_TIMESTAMP
		`
	}

	var err error
	if tx != nil {
		_, err = tx.Exec(query, userID, sportID)
	} else {
		_, err = r.db.Exec(query, userID, sportID)
	}

	if err != nil {
		return fmt.Errorf("failed to increment match stats: %w", err)
	}

	return nil
}

// DecrementMatchStats reverses match statistics (used when reverting a match)
func (r *UserSportsRepository) DecrementMatchStats(tx *sql.Tx, userID int, sportID string, wasWin bool) error {
	var query string
	if wasWin {
		query = `
			UPDATE user_sports SET
				matches_played = GREATEST(0, matches_played - 1),
				wins = GREATEST(0, wins - 1),
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = $1 AND sport_id = $2
		`
	} else {
		query = `
			UPDATE user_sports SET
				matches_played = GREATEST(0, matches_played - 1),
				losses = GREATEST(0, losses - 1),
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = $1 AND sport_id = $2
		`
	}

	var err error
	if tx != nil {
		_, err = tx.Exec(query, userID, sportID)
	} else {
		_, err = r.db.Exec(query, userID, sportID)
	}

	if err != nil {
		return fmt.Errorf("failed to decrement match stats: %w", err)
	}

	return nil
}

// GetUserSportStats retrieves comprehensive stats for a user in a specific sport
func (r *UserSportsRepository) GetUserSportStats(userID int, sportID string) (*UserSportData, error) {
	data := &UserSportData{}
	query := `
		SELECT user_id, sport_id, current_elo, highest_elo, matches_played,
		       wins, losses, created_at, updated_at
		FROM user_sports
		WHERE user_id = $1 AND sport_id = $2
	`

	err := r.db.QueryRow(query, userID, sportID).Scan(
		&data.UserID,
		&data.SportID,
		&data.CurrentELO,
		&data.HighestELO,
		&data.MatchesPlayed,
		&data.Wins,
		&data.Losses,
		&data.CreatedAt,
		&data.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		// Return default stats for users who haven't played yet
		return &UserSportData{
			UserID:        userID,
			SportID:       sportID,
			CurrentELO:    1000,
			HighestELO:    1000,
			MatchesPlayed: 0,
			Wins:          0,
			Losses:        0,
		}, nil
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user sport stats: %w", err)
	}

	return data, nil
}

// GetAllUserSports retrieves all sport data for a user
func (r *UserSportsRepository) GetAllUserSports(userID int) (map[string]*UserSportData, error) {
	query := `
		SELECT user_id, sport_id, current_elo, highest_elo, matches_played,
		       wins, losses, created_at, updated_at
		FROM user_sports
		WHERE user_id = $1
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user sports: %w", err)
	}
	defer rows.Close()

	sports := make(map[string]*UserSportData)
	for rows.Next() {
		data := &UserSportData{}
		if err := rows.Scan(
			&data.UserID,
			&data.SportID,
			&data.CurrentELO,
			&data.HighestELO,
			&data.MatchesPlayed,
			&data.Wins,
			&data.Losses,
			&data.CreatedAt,
			&data.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan user sport data: %w", err)
		}
		sports[data.SportID] = data
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user sports: %w", err)
	}

	return sports, nil
}

// EnsureUserSportExists creates a user_sports record if it doesn't exist
// This is useful when a new user is created or when initializing stats
func (r *UserSportsRepository) EnsureUserSportExists(tx *sql.Tx, userID int, sportID string, defaultELO int) error {
	query := `
		INSERT INTO user_sports (user_id, sport_id, current_elo, highest_elo)
		VALUES ($1, $2, $3, $3)
		ON CONFLICT (user_id, sport_id) DO NOTHING
	`

	var err error
	if tx != nil {
		_, err = tx.Exec(query, userID, sportID, defaultELO)
	} else {
		_, err = r.db.Exec(query, userID, sportID, defaultELO)
	}

	if err != nil {
		return fmt.Errorf("failed to ensure user sport exists: %w", err)
	}

	return nil
}
