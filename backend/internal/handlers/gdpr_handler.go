package handlers

import (
	"database/sql"
	"log/slog"
	"net/http"
	"time"

	"github.com/42heilbronn/elo-leaderboard/internal/middleware"
	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
	"github.com/42heilbronn/elo-leaderboard/internal/services"
	"github.com/42heilbronn/elo-leaderboard/internal/utils"
	"github.com/gin-gonic/gin"
)

// GDPRHandler handles GDPR-related requests (data export, account deletion)
type GDPRHandler struct {
	db           *sql.DB
	userRepo     *repositories.UserRepository
	matchRepo    *repositories.MatchRepository
	commentRepo  *repositories.CommentRepository
	matchService *services.MatchService
}

// NewGDPRHandler creates a new GDPR handler
func NewGDPRHandler(
	db *sql.DB,
	userRepo *repositories.UserRepository,
	matchRepo *repositories.MatchRepository,
	commentRepo *repositories.CommentRepository,
	matchService *services.MatchService,
) *GDPRHandler {
	return &GDPRHandler{
		db:           db,
		userRepo:     userRepo,
		matchRepo:    matchRepo,
		commentRepo:  commentRepo,
		matchService: matchService,
	}
}

// UserDataExport represents all data associated with a user (Art. 15 GDPR)
type UserDataExport struct {
	ExportDate    string                 `json:"export_date"`
	ExportVersion string                 `json:"export_version"`
	Profile       UserProfileExport      `json:"profile"`
	Matches       []MatchExport          `json:"matches"`
	Comments      []CommentExport        `json:"comments"`
	DataInfo      DataProcessingInfo     `json:"data_processing_info"`
}

// UserProfileExport contains user profile data
type UserProfileExport struct {
	ID               int       `json:"id"`
	IntraID          int       `json:"intra_id"`
	Login            string    `json:"login"`
	DisplayName      string    `json:"display_name"`
	AvatarURL        string    `json:"avatar_url"`
	Campus           string    `json:"campus"`
	TableTennisELO   int       `json:"table_tennis_elo"`
	TableFootballELO int       `json:"table_football_elo"`
	IsAdmin          bool      `json:"is_admin"`
	IsBanned         bool      `json:"is_banned"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// MatchExport contains match data for export
type MatchExport struct {
	ID           int        `json:"id"`
	Sport        string     `json:"sport"`
	Role         string     `json:"role"` // "player1", "player2", "submitter"
	OpponentID   int        `json:"opponent_id,omitempty"`
	PlayerScore  int        `json:"player_score"`
	OpponentScore int       `json:"opponent_score"`
	Won          bool       `json:"won"`
	Status       string     `json:"status"`
	ELOBefore    *int       `json:"elo_before,omitempty"`
	ELOAfter     *int       `json:"elo_after,omitempty"`
	ELODelta     *int       `json:"elo_delta,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	ConfirmedAt  *time.Time `json:"confirmed_at,omitempty"`
}

// CommentExport contains comment data for export
type CommentExport struct {
	ID        int       `json:"id"`
	MatchID   int       `json:"match_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DataProcessingInfo provides information about data processing (Art. 13/14 GDPR)
type DataProcessingInfo struct {
	Purpose           string   `json:"purpose"`
	LegalBasis        string   `json:"legal_basis"`
	RetentionPeriod   string   `json:"retention_period"`
	ThirdParties      []string `json:"third_parties"`
	YourRights        []string `json:"your_rights"`
	ContactEmail      string   `json:"contact_email"`
}

// ExportUserData handles GET /api/users/me/data-export (Art. 15 GDPR - Right to Access)
func (h *GDPRHandler) ExportUserData(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	// Get user profile
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		slog.Error("Failed to get user for data export", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to retrieve user data", err)
		return
	}

	// Get user's matches
	matches, err := h.getMatchesForUser(userID)
	if err != nil {
		slog.Error("Failed to get matches for data export", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to retrieve match data", err)
		return
	}

	// Get user's comments
	comments, err := h.getCommentsForUser(userID)
	if err != nil {
		slog.Error("Failed to get comments for data export", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to retrieve comment data", err)
		return
	}

	export := UserDataExport{
		ExportDate:    time.Now().UTC().Format(time.RFC3339),
		ExportVersion: "1.0",
		Profile: UserProfileExport{
			ID:               user.ID,
			IntraID:          user.IntraID,
			Login:            user.Login,
			DisplayName:      user.DisplayName,
			AvatarURL:        user.AvatarURL,
			Campus:           user.Campus,
			TableTennisELO:   user.TableTennisELO,
			TableFootballELO: user.TableFootballELO,
			IsAdmin:          user.IsAdmin,
			IsBanned:         user.IsBanned,
			CreatedAt:        user.CreatedAt,
			UpdatedAt:        user.UpdatedAt,
		},
		Matches:   matches,
		Comments:  comments,
		DataInfo: DataProcessingInfo{
			Purpose:         "ELO Leaderboard ranking system for table tennis and table football at 42 Heilbronn",
			LegalBasis:      "Art. 6(1)(a) GDPR - Consent, Art. 6(1)(b) GDPR - Contract performance",
			RetentionPeriod: "Data is retained until account deletion or upon request",
			ThirdParties: []string{
				"42 Intra API (authentication)",
				"Hosting provider (infrastructure)",
			},
			YourRights: []string{
				"Right to access (Art. 15 GDPR)",
				"Right to rectification (Art. 16 GDPR)",
				"Right to erasure (Art. 17 GDPR)",
				"Right to restriction of processing (Art. 18 GDPR)",
				"Right to data portability (Art. 20 GDPR)",
				"Right to object (Art. 21 GDPR)",
			},
			ContactEmail: "privacy@example.com",
		},
	}

	slog.Info("User data exported", "user_id", userID, "matches", len(matches), "comments", len(comments))

	// Set headers for download
	c.Header("Content-Disposition", "attachment; filename=my-data-export.json")
	c.Header("Content-Type", "application/json")
	utils.RespondWithJSON(c, http.StatusOK, export)
}

// DeleteAccount handles DELETE /api/users/me/delete (Art. 17 GDPR - Right to Erasure)
func (h *GDPRHandler) DeleteAccount(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	// Verify user exists
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "user not found", err)
		return
	}

	slog.Info("Starting account deletion", "user_id", userID, "login", user.Login)

	// Ensure anonymized user exists (IntraID -1)
	var anonymizedID int
	err = h.db.QueryRow("SELECT id FROM users WHERE intra_id = -1").Scan(&anonymizedID)
	if err == sql.ErrNoRows {
		// Create it
		err = h.db.QueryRow(`
			INSERT INTO users (intra_id, login, display_name, avatar_url, campus, is_banned, ban_reason)
			VALUES (-1, 'deleted_user', 'Deleted User', '', '42heilbronn', true, 'System account for anonymized data')
			RETURNING id
		`).Scan(&anonymizedID)
		if err != nil {
			slog.Error("Failed to create anonymized user", "error", err)
			utils.RespondWithError(c, http.StatusInternalServerError, "failed to prepare deletion", err)
			return
		}
	} else if err != nil {
		slog.Error("Failed to find anonymized user", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to prepare deletion", err)
		return
	}

	// Start transaction for atomic deletion
	tx, err := h.db.Begin()
	if err != nil {
		slog.Error("Failed to begin transaction for account deletion", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to process deletion", err)
		return
	}
	defer tx.Rollback()

	// 1. Delete all comments by this user
	_, err = tx.Exec("DELETE FROM comments WHERE user_id = $1", userID)
	if err != nil {
		slog.Error("Failed to delete comments", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to delete comments", err)
		return
	}

	// 2. Anonymize matches where user is player1, player2, winner, or submitter
	// We keep match history but remove personal data linkage

	// Anonymize player1
	_, err = tx.Exec(`
		UPDATE matches SET player1_id = $1
		WHERE player1_id = $2
	`, anonymizedID, userID)
	if err != nil {
		slog.Error("Failed to anonymize matches (player1)", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to anonymize matches", err)
		return
	}

	// Anonymize player2
	_, err = tx.Exec(`
		UPDATE matches SET player2_id = $1
		WHERE player2_id = $2
	`, anonymizedID, userID)
	if err != nil {
		slog.Error("Failed to anonymize matches (player2)", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to anonymize matches", err)
		return
	}

	// Anonymize winner_id
	_, err = tx.Exec(`
		UPDATE matches SET winner_id = $1
		WHERE winner_id = $2
	`, anonymizedID, userID)
	if err != nil {
		slog.Error("Failed to anonymize matches (winner)", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to anonymize matches", err)
		return
	}

	// Anonymize submitted_by
	_, err = tx.Exec(`
		UPDATE matches SET submitted_by = $1
		WHERE submitted_by = $2
	`, anonymizedID, userID)
	if err != nil {
		slog.Error("Failed to anonymize matches (submitted_by)", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to anonymize matches", err)
		return
	}

	// 5. Delete audit log entries related to this user (admin actions on this user)
	// Note: target_type must be 'user' and target_id matches userID
	_, err = tx.Exec("DELETE FROM admin_audit_log WHERE target_type = 'user' AND target_id = $1", userID)
	if err != nil {
		slog.Error("Failed to delete audit log entries", "error", err, "user_id", userID)
		// Non-critical, continue
	}

	// 6. Delete the user account
	_, err = tx.Exec("DELETE FROM users WHERE id = $1", userID)
	if err != nil {
		slog.Error("Failed to delete user", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to delete user account", err)
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		slog.Error("Failed to commit account deletion", "error", err, "user_id", userID)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to complete deletion", err)
		return
	}

	// Invalidate caches
	h.matchService.InvalidateLeaderboardCache()

	slog.Info("Account deleted successfully", "user_id", userID, "login", user.Login)

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"message": "Your account and associated data have been deleted",
		"deleted": gin.H{
			"user_id":            userID,
			"comments_deleted":   true,
			"matches_anonymized": true,
		},
	})
}

// Helper methods

func (h *GDPRHandler) getMatchesForUser(userID int) ([]MatchExport, error) {
	query := `
		SELECT id, sport, player1_id, player2_id, player1_score, player2_score,
		       winner_id, status, player1_elo_before, player1_elo_after, player1_elo_delta,
		       player2_elo_before, player2_elo_after, player2_elo_delta,
		       submitted_by, created_at, confirmed_at
		FROM matches
		WHERE player1_id = $1 OR player2_id = $1 OR submitted_by = $1
		ORDER BY created_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []MatchExport
	for rows.Next() {
		var m struct {
			ID              int
			Sport           string
			Player1ID       int
			Player2ID       int
			Player1Score    int
			Player2Score    int
			WinnerID        int
			Status          string
			Player1ELOBefore *int
			Player1ELOAfter  *int
			Player1ELODelta  *int
			Player2ELOBefore *int
			Player2ELOAfter  *int
			Player2ELODelta  *int
			SubmittedBy     int
			CreatedAt       time.Time
			ConfirmedAt     *time.Time
		}

		if err := rows.Scan(
			&m.ID, &m.Sport, &m.Player1ID, &m.Player2ID, &m.Player1Score, &m.Player2Score,
			&m.WinnerID, &m.Status, &m.Player1ELOBefore, &m.Player1ELOAfter, &m.Player1ELODelta,
			&m.Player2ELOBefore, &m.Player2ELOAfter, &m.Player2ELODelta,
			&m.SubmittedBy, &m.CreatedAt, &m.ConfirmedAt,
		); err != nil {
			return nil, err
		}

		export := MatchExport{
			ID:          m.ID,
			Sport:       m.Sport,
			Status:      m.Status,
			CreatedAt:   m.CreatedAt,
			ConfirmedAt: m.ConfirmedAt,
		}

		// Determine role and set appropriate fields
		if m.Player1ID == userID {
			export.Role = "player1"
			export.OpponentID = m.Player2ID
			export.PlayerScore = m.Player1Score
			export.OpponentScore = m.Player2Score
			export.Won = m.WinnerID == userID
			export.ELOBefore = m.Player1ELOBefore
			export.ELOAfter = m.Player1ELOAfter
			export.ELODelta = m.Player1ELODelta
		} else if m.Player2ID == userID {
			export.Role = "player2"
			export.OpponentID = m.Player1ID
			export.PlayerScore = m.Player2Score
			export.OpponentScore = m.Player1Score
			export.Won = m.WinnerID == userID
			export.ELOBefore = m.Player2ELOBefore
			export.ELOAfter = m.Player2ELOAfter
			export.ELODelta = m.Player2ELODelta
		} else if m.SubmittedBy == userID {
			export.Role = "submitter"
			export.PlayerScore = m.Player1Score
			export.OpponentScore = m.Player2Score
		}

		matches = append(matches, export)
	}

	return matches, rows.Err()
}

func (h *GDPRHandler) getCommentsForUser(userID int) ([]CommentExport, error) {
	query := `
		SELECT id, match_id, content, created_at, updated_at
		FROM comments
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []CommentExport
	for rows.Next() {
		var c CommentExport
		if err := rows.Scan(&c.ID, &c.MatchID, &c.Content, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}

	return comments, rows.Err()
}
