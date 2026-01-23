package handlers

import (
	"net/http"

	"github.com/42heilbronn/elo-leaderboard/internal/services"
	"github.com/gin-gonic/gin"
)

// SportHandler handles sport-related API endpoints
type SportHandler struct {
	sportService *services.SportService
}

// NewSportHandler creates a new sport handler
func NewSportHandler(sportService *services.SportService) *SportHandler {
	return &SportHandler{
		sportService: sportService,
	}
}

// GetAllSports returns all active sports
// GET /api/sports
func (h *SportHandler) GetAllSports(c *gin.Context) {
	sports, err := h.sportService.GetAllActiveSports()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sports"})
		return
	}

	c.JSON(http.StatusOK, sports)
}

// GetSport returns a specific sport by ID
// GET /api/sports/:id
func (h *SportHandler) GetSport(c *gin.Context) {
	sportID := c.Param("id")
	if sportID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sport ID is required"})
		return
	}

	sport, err := h.sportService.GetSport(sportID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sport)
}
