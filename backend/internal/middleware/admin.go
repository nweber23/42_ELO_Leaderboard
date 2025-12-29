package middleware

import (
	"net/http"

	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
	"github.com/42heilbronn/elo-leaderboard/internal/utils"
	"github.com/gin-gonic/gin"
)

// AdminMiddleware checks if the authenticated user is an admin
func AdminMiddleware(userRepo *repositories.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := GetUserID(c)
		if !exists {
			utils.RespondWithError(c, http.StatusUnauthorized, "authentication required", nil)
			c.Abort()
			return
		}

		user, err := userRepo.GetByID(userID)
		if err != nil {
			utils.RespondWithError(c, http.StatusUnauthorized, "user not found", err)
			c.Abort()
			return
		}

		if !user.IsAdmin {
			utils.RespondWithError(c, http.StatusForbidden, "admin access required", nil)
			c.Abort()
			return
		}

		// Check if admin is banned (should not happen, but safety check)
		if user.IsBanned {
			utils.RespondWithError(c, http.StatusForbidden, "account is banned", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// BannedUserMiddleware checks if the authenticated user is banned
// This should be applied after auth middleware to prevent banned users from taking actions
func BannedUserMiddleware(userRepo *repositories.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := GetUserID(c)
		if !exists {
			// Not authenticated, let other middleware handle it
			c.Next()
			return
		}

		user, err := userRepo.GetByID(userID)
		if err != nil {
			// User not found, let other middleware handle it
			c.Next()
			return
		}

		if user.IsBanned {
			utils.RespondWithError(c, http.StatusForbidden, "your account has been banned", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}
