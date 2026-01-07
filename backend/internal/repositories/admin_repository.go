package repositories

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/42heilbronn/elo-leaderboard/internal/models"
)

type AdminRepository struct {
	db *sql.DB
}

func NewAdminRepository(db *sql.DB) *AdminRepository {
	return &AdminRepository{db: db}
}

// GetSystemHealth returns system health statistics
func (r *AdminRepository) GetSystemHealth() (*models.SystemHealth, error) {
	health := &models.SystemHealth{
		Status:         "healthy",
		DatabaseStatus: "connected",
	}

	// Get total users
	err := r.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&health.TotalUsers)
	if err != nil {
		return nil, err
	}

	// Get total matches
	err = r.db.QueryRow("SELECT COUNT(*) FROM matches").Scan(&health.TotalMatches)
	if err != nil {
		return nil, err
	}

	// Get pending matches
	err = r.db.QueryRow("SELECT COUNT(*) FROM matches WHERE status = 'pending'").Scan(&health.PendingMatches)
	if err != nil {
		return nil, err
	}

	// Get disputed matches
	err = r.db.QueryRow("SELECT COUNT(*) FROM matches WHERE status = 'disputed'").Scan(&health.DisputedMatches)
	if err != nil {
		return nil, err
	}

	// Get banned users
	err = r.db.QueryRow("SELECT COUNT(*) FROM users WHERE is_banned = true").Scan(&health.BannedUsers)
	if err != nil {
		return nil, err
	}

	// Get matches today
	today := time.Now().Truncate(24 * time.Hour)
	err = r.db.QueryRow("SELECT COUNT(*) FROM matches WHERE created_at >= $1", today).Scan(&health.MatchesToday)
	if err != nil {
		return nil, err
	}

	// Get active users today (submitted or confirmed a match)
	err = r.db.QueryRow(`
		SELECT COUNT(DISTINCT user_id) FROM (
			SELECT submitted_by as user_id FROM matches WHERE created_at >= $1
			UNION
			SELECT player1_id as user_id FROM matches WHERE confirmed_at >= $1
			UNION
			SELECT player2_id as user_id FROM matches WHERE confirmed_at >= $1
		) active_users
	`, today).Scan(&health.ActiveUsersToday)
	if err != nil {
		return nil, err
	}

	return health, nil
}

// BanUser bans a user
func (r *AdminRepository) BanUser(userID int, reason string, adminID int) error {
	query := `
		UPDATE users
		SET is_banned = true, ban_reason = $1, banned_at = $2, banned_by = $3, updated_at = $2
		WHERE id = $4
	`
	now := time.Now()
	_, err := r.db.Exec(query, reason, now, adminID, userID)
	return err
}

// UnbanUser unbans a user
func (r *AdminRepository) UnbanUser(userID int) error {
	query := `
		UPDATE users
		SET is_banned = false, ban_reason = NULL, banned_at = NULL, banned_by = NULL, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`
	_, err := r.db.Exec(query, userID)
	return err
}

// SetAdmin sets or removes admin privileges
func (r *AdminRepository) SetAdmin(userID int, isAdmin bool) error {
	query := `UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	_, err := r.db.Exec(query, isAdmin, userID)
	return err
}

// AdjustELO manually adjusts a user's ELO
func (r *AdminRepository) AdjustELO(userID int, sport string, newELO int, reason string, adminID int) (*models.ELOAdjustment, error) {
	// Get current ELO
	var oldELO int
	var query string
	if sport == models.SportTableTennis {
		query = "SELECT table_tennis_elo FROM users WHERE id = $1"
	} else {
		query = "SELECT table_football_elo FROM users WHERE id = $1"
	}
	err := r.db.QueryRow(query, userID).Scan(&oldELO)
	if err != nil {
		return nil, err
	}

	// Update ELO
	if sport == models.SportTableTennis {
		query = "UPDATE users SET table_tennis_elo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	} else {
		query = "UPDATE users SET table_football_elo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	}
	_, err = r.db.Exec(query, newELO, userID)
	if err != nil {
		return nil, err
	}

	// Record adjustment
	adjustment := &models.ELOAdjustment{
		UserID:     userID,
		Sport:      sport,
		OldELO:     oldELO,
		NewELO:     newELO,
		Reason:     reason,
		AdjustedBy: adminID,
	}

	err = r.db.QueryRow(`
		INSERT INTO elo_adjustments (user_id, sport, old_elo, new_elo, reason, adjusted_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`, userID, sport, oldELO, newELO, reason, adminID).Scan(&adjustment.ID, &adjustment.CreatedAt)

	return adjustment, err
}

// GetELOAdjustments returns all ELO adjustments
func (r *AdminRepository) GetELOAdjustments(limit int) ([]models.ELOAdjustment, error) {
	query := `
		SELECT id, user_id, sport, old_elo, new_elo, reason, adjusted_by, created_at
		FROM elo_adjustments
		ORDER BY created_at DESC
		LIMIT $1
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var adjustments []models.ELOAdjustment
	for rows.Next() {
		var adj models.ELOAdjustment
		err := rows.Scan(&adj.ID, &adj.UserID, &adj.Sport, &adj.OldELO, &adj.NewELO, &adj.Reason, &adj.AdjustedBy, &adj.CreatedAt)
		if err != nil {
			return nil, err
		}
		adjustments = append(adjustments, adj)
	}

	return adjustments, rows.Err()
}

// DeleteMatch permanently deletes a match
func (r *AdminRepository) DeleteMatch(matchID int) error {
	_, err := r.db.Exec("DELETE FROM matches WHERE id = $1", matchID)
	return err
}

// UpdateMatchStatus updates a match status
func (r *AdminRepository) UpdateMatchStatus(matchID int, status string) error {
	query := `UPDATE matches SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	_, err := r.db.Exec(query, status, matchID)
	return err
}

// GetDisputedMatches returns all disputed matches
func (r *AdminRepository) GetDisputedMatches() ([]models.Match, error) {
	query := `
		SELECT id, sport, player1_id, player2_id, player1_score, player2_score,
		       winner_id, status, player1_elo_before, player1_elo_after, player1_elo_delta,
		       player2_elo_before, player2_elo_after, player2_elo_delta,
		       submitted_by, confirmed_at, denied_at, created_at, updated_at
		FROM matches
		WHERE status = 'disputed'
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []models.Match
	for rows.Next() {
		var m models.Match
		err := rows.Scan(
			&m.ID, &m.Sport, &m.Player1ID, &m.Player2ID, &m.Player1Score, &m.Player2Score,
			&m.WinnerID, &m.Status, &m.Player1ELOBefore, &m.Player1ELOAfter, &m.Player1ELODelta,
			&m.Player2ELOBefore, &m.Player2ELOAfter, &m.Player2ELODelta,
			&m.SubmittedBy, &m.ConfirmedAt, &m.DeniedAt, &m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}

	return matches, rows.Err()
}

// LogAdminAction logs an admin action
func (r *AdminRepository) LogAdminAction(adminID int, action string, targetType string, targetID *int, details interface{}) error {
	var detailsJSON []byte
	var err error
	if details != nil {
		detailsJSON, err = json.Marshal(details)
		if err != nil {
			return err
		}
	}

	query := `
		INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err = r.db.Exec(query, adminID, action, targetType, targetID, detailsJSON)
	return err
}

// GetAuditLog returns admin audit log entries
func (r *AdminRepository) GetAuditLog(limit int) ([]models.AdminAuditLog, error) {
	query := `
		SELECT id, admin_id, action, target_type, target_id, details, created_at
		FROM admin_audit_log
		ORDER BY created_at DESC
		LIMIT $1
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.AdminAuditLog
	for rows.Next() {
		var log models.AdminAuditLog
		var details sql.NullString
		err := rows.Scan(&log.ID, &log.AdminID, &log.Action, &log.TargetType, &log.TargetID, &details, &log.CreatedAt)
		if err != nil {
			return nil, err
		}
		if details.Valid {
			log.Details = details.String
		}
		logs = append(logs, log)
	}

	return logs, rows.Err()
}

// GetBannedUsers returns all banned users
func (r *AdminRepository) GetBannedUsers() ([]models.User, error) {
	query := `
		SELECT id, id, login, display_name, avatar_url, campus,
		       table_tennis_elo, table_football_elo, is_admin, is_banned,
		       ban_reason, banned_at, banned_by, created_at, updated_at
		FROM users
		WHERE is_banned = true
		ORDER BY banned_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(
			&u.ID, &u.IntraID, &u.Login, &u.DisplayName, &u.AvatarURL, &u.Campus,
			&u.TableTennisELO, &u.TableFootballELO, &u.IsAdmin, &u.IsBanned,
			&u.BanReason, &u.BannedAt, &u.BannedBy, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, rows.Err()
}

// ExportMatchesCSV returns all matches for CSV export
func (r *AdminRepository) ExportMatchesCSV() ([]models.Match, error) {
	query := `
		SELECT id, sport, player1_id, player2_id, player1_score, player2_score,
		       winner_id, status, player1_elo_before, player1_elo_after, player1_elo_delta,
		       player2_elo_before, player2_elo_after, player2_elo_delta,
		       submitted_by, confirmed_at, denied_at, created_at, updated_at
		FROM matches
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []models.Match
	for rows.Next() {
		var m models.Match
		err := rows.Scan(
			&m.ID, &m.Sport, &m.Player1ID, &m.Player2ID, &m.Player1Score, &m.Player2Score,
			&m.WinnerID, &m.Status, &m.Player1ELOBefore, &m.Player1ELOAfter, &m.Player1ELODelta,
			&m.Player2ELOBefore, &m.Player2ELOAfter, &m.Player2ELODelta,
			&m.SubmittedBy, &m.ConfirmedAt, &m.DeniedAt, &m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}

	return matches, rows.Err()
}

// ExportUsersCSV returns all users for CSV export
func (r *AdminRepository) ExportUsersCSV() ([]models.User, error) {
	query := `
		SELECT id, id, login, display_name, avatar_url, campus,
		       table_tennis_elo, table_football_elo, is_admin, is_banned,
		       ban_reason, banned_at, banned_by, created_at, updated_at
		FROM users
		ORDER BY id
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(
			&u.ID, &u.IntraID, &u.Login, &u.DisplayName, &u.AvatarURL, &u.Campus,
			&u.TableTennisELO, &u.TableFootballELO, &u.IsAdmin, &u.IsBanned,
			&u.BanReason, &u.BannedAt, &u.BannedBy, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, rows.Err()
}

// GetConfirmedMatches returns all confirmed matches (revertable)
func (r *AdminRepository) GetConfirmedMatches(limit int) ([]models.Match, error) {
	query := `
		SELECT id, sport, player1_id, player2_id, player1_score, player2_score,
		       winner_id, status, player1_elo_before, player1_elo_after, player1_elo_delta,
		       player2_elo_before, player2_elo_after, player2_elo_delta,
		       submitted_by, confirmed_at, denied_at, created_at, updated_at
		FROM matches
		WHERE status = 'confirmed'
		ORDER BY confirmed_at DESC
		LIMIT $1
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []models.Match
	for rows.Next() {
		var m models.Match
		err := rows.Scan(
			&m.ID, &m.Sport, &m.Player1ID, &m.Player2ID, &m.Player1Score, &m.Player2Score,
			&m.WinnerID, &m.Status, &m.Player1ELOBefore, &m.Player1ELOAfter, &m.Player1ELODelta,
			&m.Player2ELOBefore, &m.Player2ELOAfter, &m.Player2ELODelta,
			&m.SubmittedBy, &m.ConfirmedAt, &m.DeniedAt, &m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}

	return matches, rows.Err()
}

// RevertMatch reverts a confirmed match by restoring players' ELO ratings and deleting the match
func (r *AdminRepository) RevertMatch(matchID int) error {
	// Start transaction
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get the match details
	var match models.Match
	err = tx.QueryRow(`
		SELECT id, sport, player1_id, player2_id, player1_elo_before, player2_elo_before, status
		FROM matches WHERE id = $1
	`, matchID).Scan(
		&match.ID, &match.Sport, &match.Player1ID, &match.Player2ID,
		&match.Player1ELOBefore, &match.Player2ELOBefore, &match.Status,
	)
	if err != nil {
		return err
	}

	// Only revert confirmed matches
	if match.Status != "confirmed" {
		return fmt.Errorf("can only revert confirmed matches")
	}

	// Restore player 1's ELO
	var updateQuery string
	if match.Sport == models.SportTableTennis {
		updateQuery = "UPDATE users SET table_tennis_elo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	} else {
		updateQuery = "UPDATE users SET table_football_elo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	}

	_, err = tx.Exec(updateQuery, match.Player1ELOBefore, match.Player1ID)
	if err != nil {
		return err
	}

	// Restore player 2's ELO
	_, err = tx.Exec(updateQuery, match.Player2ELOBefore, match.Player2ID)
	if err != nil {
		return err
	}

	// Delete the match
	_, err = tx.Exec("DELETE FROM matches WHERE id = $1", matchID)
	if err != nil {
		return err
	}

	return tx.Commit()
}
