package middleware

import (
	"net/http"
	"strings"

	"github.com/42heilbronn/elo-leaderboard/internal/utils"
	"github.com/gin-gonic/gin"
)

// getTokenFromRequest extracts the JWT token from either Authorization header or httpOnly cookie
func getTokenFromRequest(c *gin.Context) string {
	// First, try Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	// Then, try httpOnly cookie
	cookie, err := c.Cookie("auth_token")
	if err == nil && cookie != "" {
		return cookie
	}

	return ""
}

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := getTokenFromRequest(c)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization required"})
			c.Abort()
			return
		}

		// Validate token
		claims, err := utils.ValidateJWT(tokenString, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// Store user ID in context
		c.Set("user_id", claims.UserID)
		c.Next()
	}
}

func GetUserID(c *gin.Context) (int, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	id, ok := userID.(int)
	return id, ok
}

// OptionalAuthMiddleware extracts user ID from token if present, but doesn't require it
// This allows endpoints to behave differently for authenticated vs unauthenticated users
func OptionalAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := getTokenFromRequest(c)
		if tokenString == "" {
			// No token - continue as unauthenticated
			c.Set("authenticated", false)
			c.Next()
			return
		}

		// Validate token
		claims, err := utils.ValidateJWT(tokenString, jwtSecret)
		if err != nil {
			// Invalid token - continue as unauthenticated
			c.Set("authenticated", false)
			c.Next()
			return
		}

		// Store user ID in context
		c.Set("user_id", claims.UserID)
		c.Set("authenticated", true)
		c.Next()
	}
}

// IsAuthenticated checks if the request is authenticated
func IsAuthenticated(c *gin.Context) bool {
	authenticated, exists := c.Get("authenticated")
	if !exists {
		return false
	}
	return authenticated.(bool)
}
