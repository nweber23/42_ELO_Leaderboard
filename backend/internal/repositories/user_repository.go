package repositories

import (
	"database/sql"
	"fmt"

	"github.com/42heilbronn/elo-leaderboard/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateOrUpdate creates a new user or updates if exists
func (r *UserRepository) CreateOrUpdate(user *models.User) error {
	query := `
		INSERT INTO users (id, login, display_name, avatar_url, campus)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (id) DO UPDATE SET
			login = EXCLUDED.login,
			display_name = EXCLUDED.display_name,
			avatar_url = EXCLUDED.avatar_url,
			campus = EXCLUDED.campus,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, table_tennis_elo, table_football_elo, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		user.IntraID,
		user.Login,
		user.DisplayName,
		user.AvatarURL,
		user.Campus,
	).Scan(
		&user.ID,
		&user.TableTennisELO,
		&user.TableFootballELO,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id int) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, id, login, display_name, avatar_url, campus,
		       table_tennis_elo, table_football_elo, is_admin, is_banned,
		       ban_reason, banned_at, banned_by, created_at, updated_at
		FROM users WHERE id = $1
	`

	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.IntraID,
		&user.Login,
		&user.DisplayName,
		&user.AvatarURL,
		&user.Campus,
		&user.TableTennisELO,
		&user.TableFootballELO,
		&user.IsAdmin,
		&user.IsBanned,
		&user.BanReason,
		&user.BannedAt,
		&user.BannedBy,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}

	return user, err
}

// GetByIntraID retrieves a user by Intra ID
func (r *UserRepository) GetByIntraID(intraID int) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, id, login, display_name, avatar_url, campus,
		       table_tennis_elo, table_football_elo, is_admin, is_banned,
		       ban_reason, banned_at, banned_by, created_at, updated_at
		FROM users WHERE id = $1
	`

	err := r.db.QueryRow(query, intraID).Scan(
		&user.ID,
		&user.IntraID,
		&user.Login,
		&user.DisplayName,
		&user.AvatarURL,
		&user.Campus,
		&user.TableTennisELO,
		&user.TableFootballELO,
		&user.IsAdmin,
		&user.IsBanned,
		&user.BanReason,
		&user.BannedAt,
		&user.BannedBy,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}

	return user, err
}

// GetByIDForUpdate retrieves a user by ID with a row lock for update
// This should be used within a transaction to prevent race conditions
func (r *UserRepository) GetByIDForUpdate(tx *sql.Tx, id int) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, id, login, display_name, avatar_url, campus,
		       table_tennis_elo, table_football_elo, is_admin, is_banned,
		       ban_reason, banned_at, banned_by, created_at, updated_at
		FROM users WHERE id = $1
		FOR UPDATE
	`

	err := tx.QueryRow(query, id).Scan(
		&user.ID,
		&user.IntraID,
		&user.Login,
		&user.DisplayName,
		&user.AvatarURL,
		&user.Campus,
		&user.TableTennisELO,
		&user.TableFootballELO,
		&user.IsAdmin,
		&user.IsBanned,
		&user.BanReason,
		&user.BannedAt,
		&user.BannedBy,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}

	return user, err
}

// GetAll retrieves all users with their sport-specific data
func (r *UserRepository) GetAll() ([]models.User, error) {
	query := `
		SELECT id, id, login, display_name, avatar_url, campus,
		       table_tennis_elo, table_football_elo, is_admin, is_banned,
		       ban_reason, banned_at, banned_by, created_at, updated_at
		FROM users
		WHERE id != -1
		ORDER BY login
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	userMap := make(map[int]*models.User)
	for rows.Next() {
		var user models.User
		if err := rows.Scan(
			&user.ID,
			&user.IntraID,
			&user.Login,
			&user.DisplayName,
			&user.AvatarURL,
			&user.Campus,
			&user.TableTennisELO,
			&user.TableFootballELO,
			&user.IsAdmin,
			&user.IsBanned,
			&user.BanReason,
			&user.BannedAt,
			&user.BannedBy,
			&user.CreatedAt,
			&user.UpdatedAt,
		); err != nil {
			return nil, err
		}
		user.Sports = make(map[string]models.UserSportData)
		users = append(users, user)
		userMap[user.ID] = &users[len(users)-1]
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Fetch all user_sports data and populate the Sports map
	sportsQuery := `
		SELECT user_id, sport_id, current_elo, highest_elo, matches_played, wins, losses
		FROM user_sports
	`
	sportsRows, err := r.db.Query(sportsQuery)
	if err != nil {
		return nil, err
	}
	defer sportsRows.Close()

	for sportsRows.Next() {
		var userID int
		var sportID string
		var sportData models.UserSportData

		if err := sportsRows.Scan(
			&userID,
			&sportID,
			&sportData.CurrentELO,
			&sportData.HighestELO,
			&sportData.MatchesPlayed,
			&sportData.Wins,
			&sportData.Losses,
		); err != nil {
			return nil, err
		}

		if user, exists := userMap[userID]; exists {
			user.Sports[sportID] = sportData
		}
	}

	return users, sportsRows.Err()
}

// UpdateELO updates a user's ELO rating for a specific sport
func (r *UserRepository) UpdateELO(tx *sql.Tx, userID int, sport string, newELO int) error {
	var query string
	if sport == models.SportTableTennis {
		query = `UPDATE users SET table_tennis_elo = $1 WHERE id = $2`
	} else {
		query = `UPDATE users SET table_football_elo = $1 WHERE id = $2`
	}

	var result sql.Result
	var err error

	if tx != nil {
		result, err = tx.Exec(query, newELO, userID)
	} else {
		result, err = r.db.Exec(query, newELO, userID)
	}

	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
