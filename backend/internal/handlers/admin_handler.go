package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/42heilbronn/elo-leaderboard/internal/middleware"
	"github.com/42heilbronn/elo-leaderboard/internal/models"
	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
	"github.com/42heilbronn/elo-leaderboard/internal/utils"
	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	adminRepo *repositories.AdminRepository
	userRepo  *repositories.UserRepository
	matchRepo *repositories.MatchRepository
}

func NewAdminHandler(adminRepo *repositories.AdminRepository, userRepo *repositories.UserRepository, matchRepo *repositories.MatchRepository) *AdminHandler {
	return &AdminHandler{
		adminRepo: adminRepo,
		userRepo:  userRepo,
		matchRepo: matchRepo,
	}
}

// GetSystemHealth returns system health statistics
func (h *AdminHandler) GetSystemHealth(c *gin.Context) {
	health, err := h.adminRepo.GetSystemHealth()
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to get system health", err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, health)
}

// AdjustELO manually adjusts a user's ELO
func (h *AdminHandler) AdjustELO(c *gin.Context) {
	adminID, _ := middleware.GetUserID(c)

	var req models.AdjustELORequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	// Verify target user exists
	user, err := h.userRepo.GetByID(req.UserID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "user not found", err)
		return
	}

	adjustment, err := h.adminRepo.AdjustELO(req.UserID, req.Sport, req.NewELO, req.Reason, adminID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to adjust ELO", err)
		return
	}

	// Log admin action
	h.adminRepo.LogAdminAction(adminID, "adjust_elo", "user", &req.UserID, map[string]interface{}{
		"sport":   req.Sport,
		"old_elo": adjustment.OldELO,
		"new_elo": req.NewELO,
		"reason":  req.Reason,
		"user":    user.Login,
	})

	utils.RespondWithJSON(c, http.StatusOK, adjustment)
}

// GetELOAdjustments returns ELO adjustment history
func (h *AdminHandler) GetELOAdjustments(c *gin.Context) {
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	adjustments, err := h.adminRepo.GetELOAdjustments(limit)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to get ELO adjustments", err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, adjustments)
}

// BanUser bans a user
func (h *AdminHandler) BanUser(c *gin.Context) {
	adminID, _ := middleware.GetUserID(c)

	var req models.BanUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	// Prevent self-ban
	if req.UserID == adminID {
		utils.RespondWithError(c, http.StatusBadRequest, "cannot ban yourself", nil)
		return
	}

	// Verify target user exists
	user, err := h.userRepo.GetByID(req.UserID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "user not found", err)
		return
	}

	// Prevent banning other admins
	if user.IsAdmin {
		utils.RespondWithError(c, http.StatusForbidden, "cannot ban another admin", nil)
		return
	}

	err = h.adminRepo.BanUser(req.UserID, req.Reason, adminID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to ban user", err)
		return
	}

	// Log admin action
	h.adminRepo.LogAdminAction(adminID, "ban_user", "user", &req.UserID, map[string]interface{}{
		"reason": req.Reason,
		"user":   user.Login,
	})

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "user banned successfully"})
}

// UnbanUser unbans a user
func (h *AdminHandler) UnbanUser(c *gin.Context) {
	adminID, _ := middleware.GetUserID(c)

	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid user ID", err)
		return
	}

	// Verify target user exists
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "user not found", err)
		return
	}

	err = h.adminRepo.UnbanUser(userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to unban user", err)
		return
	}

	// Log admin action
	h.adminRepo.LogAdminAction(adminID, "unban_user", "user", &userID, map[string]interface{}{
		"user": user.Login,
	})

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "user unbanned successfully"})
}

// GetBannedUsers returns all banned users
func (h *AdminHandler) GetBannedUsers(c *gin.Context) {
	users, err := h.adminRepo.GetBannedUsers()
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to get banned users", err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, users)
}

// DeleteMatch permanently deletes a match
func (h *AdminHandler) DeleteMatch(c *gin.Context) {
	adminID, _ := middleware.GetUserID(c)

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	// Get match details before deleting for audit log
	match, err := h.matchRepo.GetByID(matchID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "match not found", err)
		return
	}

	err = h.adminRepo.DeleteMatch(matchID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to delete match", err)
		return
	}

	// Log admin action
	h.adminRepo.LogAdminAction(adminID, "delete_match", "match", &matchID, map[string]interface{}{
		"sport":         match.Sport,
		"player1_id":    match.Player1ID,
		"player2_id":    match.Player2ID,
		"player1_score": match.Player1Score,
		"player2_score": match.Player2Score,
		"status":        match.Status,
	})

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "match deleted successfully"})
}

// UpdateMatchStatus updates a match status
func (h *AdminHandler) UpdateMatchStatus(c *gin.Context) {
	adminID, _ := middleware.GetUserID(c)

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=pending confirmed denied cancelled disputed"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	// Verify match exists
	match, err := h.matchRepo.GetByID(matchID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "match not found", err)
		return
	}

	oldStatus := match.Status

	err = h.adminRepo.UpdateMatchStatus(matchID, req.Status)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to update match status", err)
		return
	}

	// Log admin action
	h.adminRepo.LogAdminAction(adminID, "update_match_status", "match", &matchID, map[string]interface{}{
		"old_status": oldStatus,
		"new_status": req.Status,
	})

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "match status updated successfully"})
}

// GetDisputedMatches returns all disputed matches
func (h *AdminHandler) GetDisputedMatches(c *gin.Context) {
	matches, err := h.adminRepo.GetDisputedMatches()
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to get disputed matches", err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, matches)
}

// GetConfirmedMatches returns confirmed matches that can be reverted
func (h *AdminHandler) GetConfirmedMatches(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}

	matches, err := h.adminRepo.GetConfirmedMatches(limit)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to get confirmed matches", err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, matches)
}

// RevertMatch reverts a confirmed match by restoring ELO ratings and deleting the match
func (h *AdminHandler) RevertMatch(c *gin.Context) {
	adminID, _ := middleware.GetUserID(c)

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	// Get match details before reverting for logging
	match, err := h.matchRepo.GetByID(matchID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "match not found", err)
		return
	}

	// Perform the revert
	err = h.adminRepo.RevertMatch(matchID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to revert match", err)
		return
	}

	// Log admin action
	h.adminRepo.LogAdminAction(adminID, "revert_match", "match", &matchID, map[string]interface{}{
		"sport":             match.Sport,
		"player1_id":        match.Player1ID,
		"player2_id":        match.Player2ID,
		"player1_score":     match.Player1Score,
		"player2_score":     match.Player2Score,
		"player1_elo_delta": match.Player1ELODelta,
		"player2_elo_delta": match.Player2ELODelta,
	})

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "match reverted successfully"})
}

// GetAuditLog returns admin audit log
func (h *AdminHandler) GetAuditLog(c *gin.Context) {
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	logs, err := h.adminRepo.GetAuditLog(limit)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to get audit log", err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, logs)
}

// ExportMatchesCSV exports all matches as CSV
func (h *AdminHandler) ExportMatchesCSV(c *gin.Context) {
	adminID, _ := middleware.GetUserID(c)

	matches, err := h.adminRepo.ExportMatchesCSV()
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to export matches", err)
		return
	}

	// Log admin action
	h.adminRepo.LogAdminAction(adminID, "export_matches_csv", "system", nil, map[string]interface{}{
		"count": len(matches),
	})

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=matches_%s.csv", time.Now().Format("2006-01-02")))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	writer.Write([]string{
		"ID", "Sport", "Player1ID", "Player2ID", "Player1Score", "Player2Score",
		"WinnerID", "Status", "Player1ELOBefore", "Player1ELOAfter", "Player1ELODelta",
		"Player2ELOBefore", "Player2ELOAfter", "Player2ELODelta",
		"SubmittedBy", "ConfirmedAt", "DeniedAt", "CreatedAt", "UpdatedAt",
	})

	// Write data
	for _, m := range matches {
		confirmedAt := ""
		if m.ConfirmedAt != nil {
			confirmedAt = m.ConfirmedAt.Format(time.RFC3339)
		}
		deniedAt := ""
		if m.DeniedAt != nil {
			deniedAt = m.DeniedAt.Format(time.RFC3339)
		}

		writer.Write([]string{
			strconv.Itoa(m.ID),
			m.Sport,
			strconv.Itoa(m.Player1ID),
			strconv.Itoa(m.Player2ID),
			strconv.Itoa(m.Player1Score),
			strconv.Itoa(m.Player2Score),
			strconv.Itoa(m.WinnerID),
			m.Status,
			intPtrToString(m.Player1ELOBefore),
			intPtrToString(m.Player1ELOAfter),
			intPtrToString(m.Player1ELODelta),
			intPtrToString(m.Player2ELOBefore),
			intPtrToString(m.Player2ELOAfter),
			intPtrToString(m.Player2ELODelta),
			strconv.Itoa(m.SubmittedBy),
			confirmedAt,
			deniedAt,
			m.CreatedAt.Format(time.RFC3339),
			m.UpdatedAt.Format(time.RFC3339),
		})
	}
}

// ExportUsersCSV exports all users as CSV
func (h *AdminHandler) ExportUsersCSV(c *gin.Context) {
	adminID, _ := middleware.GetUserID(c)

	users, err := h.adminRepo.ExportUsersCSV()
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to export users", err)
		return
	}

	// Log admin action
	h.adminRepo.LogAdminAction(adminID, "export_users_csv", "system", nil, map[string]interface{}{
		"count": len(users),
	})

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=users_%s.csv", time.Now().Format("2006-01-02")))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	writer.Write([]string{
		"ID", "IntraID", "Login", "DisplayName", "Campus",
		"TableTennisELO", "TableFootballELO", "IsAdmin", "IsBanned",
		"BanReason", "BannedAt", "CreatedAt", "UpdatedAt",
	})

	// Write data
	for _, u := range users {
		bannedAt := ""
		if u.BannedAt != nil {
			bannedAt = u.BannedAt.Format(time.RFC3339)
		}
		banReason := ""
		if u.BanReason != nil {
			banReason = *u.BanReason
		}

		writer.Write([]string{
			strconv.Itoa(u.ID),
			strconv.Itoa(u.IntraID),
			u.Login,
			u.DisplayName,
			u.Campus,
			strconv.Itoa(u.TableTennisELO),
			strconv.Itoa(u.TableFootballELO),
			strconv.FormatBool(u.IsAdmin),
			strconv.FormatBool(u.IsBanned),
			banReason,
			bannedAt,
			u.CreatedAt.Format(time.RFC3339),
			u.UpdatedAt.Format(time.RFC3339),
		})
	}
}

// Helper function
func intPtrToString(p *int) string {
	if p == nil {
		return ""
	}
	return strconv.Itoa(*p)
}
