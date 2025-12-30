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

	// Explicit validation beyond struct tags
	if err := utils.ValidateMatchSubmission(req.Sport, req.OpponentID, req.PlayerScore, req.OpponentScore, userID); err != nil {
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

	// Use pagination utility with enforced maximum limits
	pagination := utils.ParsePaginationWithDefaults(
		c.Query("limit"),
		c.Query("offset"),
		50,  // default limit
		100, // max limit
	)

	matches, err := h.matchRepo.GetMatches(userID, sport, status, pagination.Limit, pagination.Offset)
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
		// Create a copy of the leaderboard to avoid modifying the cached data
		// which is shared across requests
		maskedLeaderboard := make([]models.LeaderboardEntry, len(leaderboard))
		copy(maskedLeaderboard, leaderboard)

		for i := range maskedLeaderboard {
			maskedLeaderboard[i].User = maskUserData(maskedLeaderboard[i].User)
		}
		utils.RespondWithJSON(c, http.StatusOK, maskedLeaderboard)
		return
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

	// Validate emoji against whitelist for security
	if !utils.ValidateEmojiWhitelist(req.Emoji) {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid emoji: not in allowed list", nil)
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

	// Validate match ID explicitly
	if err := utils.ValidateMatchID(matchID); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	var req models.AddCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	// Validate and sanitize comment content using explicit validation
	sanitizedContent, err := utils.ValidateComment(req.Content)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error(), err)
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

// GetComments retrieves comments for a match with optional pagination
func (h *MatchHandler) GetComments(c *gin.Context) {
	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "invalid match ID", err)
		return
	}

	// Check for pagination parameters
	limitStr := c.Query("limit")
	offsetStr := c.Query("offset")

	if limitStr != "" || offsetStr != "" {
		// Paginated request - use pagination utility with enforced limits
		pagination := utils.ParsePagination(limitStr, offsetStr)

		comments, total, err := h.commentRepo.GetByMatchIDPaginated(matchID, pagination.Limit, pagination.Offset)
		if err != nil {
			utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
			return
		}

		utils.RespondWithJSON(c, http.StatusOK, gin.H{
			"comments": comments,
			"total":    total,
			"limit":    pagination.Limit,
			"offset":   pagination.Offset,
		})
		return
	}

	// Non-paginated request (backwards compatibility)
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
