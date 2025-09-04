package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary Health check
// @Description Check if the API is running
// @Tags health
// @Produce json
// @Success 200 {object} map[string]string
// @Router /api/health [get]
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "elo-leaderboard-api",
		"version": "1.0.0",
	})
}