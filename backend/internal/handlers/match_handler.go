package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/42heilbronn/elo-leaderboard/internal/middleware"
	"github.com/42heilbronn/elo-leaderboard/internal/models"
	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
	"github.com/42heilbronn/elo-leaderboard/internal/services"
	"github.com/42heilbronn/elo-leaderboard/internal/utils"
	"github.com/gin-gonic/gin"
)

type MatchHandler struct {
	matchService *services.MatchService
	matchRepo    *repositories.MatchRepository
	reactionRepo *repositories.ReactionRepository
	commentRepo  *repositories.CommentRepository
}

func NewMatchHandler(
	matchService *services.MatchService,
	matchRepo *repositories.MatchRepository,
	reactionRepo *repositories.ReactionRepository,
	commentRepo *repositories.CommentRepository,
) *MatchHandler {
	return &MatchHandler{
		matchService: matchService,
		matchRepo:    matchRepo,
		reactionRepo: reactionRepo,
		commentRepo:  commentRepo,
	}
}

// SubmitMatch handles match submission
func (h *MatchHandler) SubmitMatch(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	var req models.SubmitMatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	match, err := h.matchService.SubmitMatch(&req, userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusCreated, match)
}

// ConfirmMatch handles match confirmation
func (h *MatchHandler) ConfirmMatch(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	if err := h.matchService.ConfirmMatch(matchID, userID); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "match confirmed"})
}

// DenyMatch handles match denial
func (h *MatchHandler) DenyMatch(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	if err := h.matchService.DenyMatch(matchID, userID); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "match denied"})
}

// CancelMatch handles match cancellation by the submitter
func (h *MatchHandler) CancelMatch(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	if err := h.matchService.CancelMatch(matchID, userID); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "match cancelled"})
}

// GetMatches lists matches with filters
func (h *MatchHandler) GetMatches(c *gin.Context) {
	var userID *int
	var sport *string
	var status *string

	if userIDStr := c.Query("user_id"); userIDStr != "" {
		id, err := strconv.Atoi(userIDStr)
		if err == nil {
			userID = &id
		}
	}

	if sportStr := c.Query("sport"); sportStr != "" {
		sport = &sportStr
	}

	if statusStr := c.Query("status"); statusStr != "" {
		status = &statusStr
	}

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	offset := 0
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil {
			offset = o
		}
	}

	matches, err := h.matchRepo.GetMatches(userID, sport, status, limit, offset)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, matches)
}

// GetMatch retrieves a single match
func (h *MatchHandler) GetMatch(c *gin.Context) {
	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	match, err := h.matchRepo.GetByID(matchID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "match not found", err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, match)
}

// GetLeaderboard returns leaderboard for a sport
func (h *MatchHandler) GetLeaderboard(c *gin.Context) {
	sport := c.Param("sport")
	if sport != models.SportTableTennis && sport != models.SportTableFootball {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid sport", nil)
		return
	}

	leaderboard, err := h.matchService.GetLeaderboard(sport)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	// Check if user is authenticated - if not, mask personal data for privacy
	if !middleware.IsAuthenticated(c) {
		for i := range leaderboard {
			leaderboard[i].User = maskUserData(leaderboard[i].User)
		}
	}

	utils.RespondWithJSON(c, http.StatusOK, leaderboard)
}

// maskUserData replaces personal information with anonymous data
func maskUserData(user models.User) models.User {
	return models.User{
		ID:               user.ID,
		IntraID:          0, // Hide real intra ID
		Login:            utils.GenerateAnonymousLogin(user.ID),
		DisplayName:      utils.GenerateAnonymousName(user.ID),
		AvatarURL:        utils.DefaultAvatarURL(user.ID),
		Campus:           user.Campus, // Keep campus for context
		TableTennisELO:   user.TableTennisELO,
		TableFootballELO: user.TableFootballELO,
		CreatedAt:        user.CreatedAt,
		UpdatedAt:        user.UpdatedAt,
	}
}

// AddReaction adds a reaction to a match
func (h *MatchHandler) AddReaction(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	var req models.AddReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	reaction := &models.Reaction{
		MatchID: matchID,
		UserID:  userID,
		Emoji:   req.Emoji,
	}

	if err := h.reactionRepo.Add(reaction); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusCreated, reaction)
}

// GetReactions retrieves reactions for a match
func (h *MatchHandler) GetReactions(c *gin.Context) {
	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	reactions, err := h.reactionRepo.GetByMatchID(matchID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, reactions)
}

// AddComment adds a comment to a match
func (h *MatchHandler) AddComment(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	var req models.AddCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	// Sanitize comment content to prevent XSS and clean up whitespace
	sanitizedContent := utils.SanitizeString(req.Content)
	if len(sanitizedContent) == 0 {
		utils.RespondWithError(c, http.StatusBadRequest, "comment cannot be empty", nil)
		return
	}

	comment := &models.Comment{
		MatchID: matchID,
		UserID:  userID,
		Content: sanitizedContent,
	}

	if err := h.commentRepo.Add(comment); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusCreated, comment)
}

// GetComments retrieves comments for a match
func (h *MatchHandler) GetComments(c *gin.Context) {
	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	comments, err := h.commentRepo.GetByMatchID(matchID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, comments)
}

// RemoveReaction removes a user's reaction from a match
func (h *MatchHandler) RemoveReaction(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	emoji := c.Param("emoji")
	if emoji == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "emoji is required", nil)
		return
	}

	if err := h.reactionRepo.Delete(matchID, userID, emoji); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "reaction removed"})
}

// DeleteComment deletes a comment
func (h *MatchHandler) DeleteComment(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	commentID, err := strconv.Atoi(c.Param("commentId"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid comment ID", err)
		return
	}

	if err := h.commentRepo.Delete(commentID, userID); err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(c, http.StatusForbidden, "cannot delete comment", err)
			return
		}
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "comment deleted"})
}
