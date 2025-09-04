package api

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// In-memory storage for demo purposes
var matches []Match
var nextMatchID = 1

// calculateELO calculates new ELO ratings after a match
func calculateELO(player1ELO, player2ELO int, result string) (int, int) {
	const K = 32 // K-factor

	// Calculate expected scores
	expectedScore1 := 1.0 / (1.0 + math.Pow(10, float64(player2ELO-player1ELO)/400.0))
	expectedScore2 := 1.0 / (1.0 + math.Pow(10, float64(player1ELO-player2ELO)/400.0))

	// Determine actual scores based on result
	var actualScore1, actualScore2 float64
	switch result {
	case "player1_wins":
		actualScore1, actualScore2 = 1.0, 0.0
	case "player2_wins":
		actualScore1, actualScore2 = 0.0, 1.0
	case "draw":
		actualScore1, actualScore2 = 0.5, 0.5
	}

	// Calculate new ELO ratings
	newELO1 := int(float64(player1ELO) + K*(actualScore1-expectedScore1))
	newELO2 := int(float64(player2ELO) + K*(actualScore2-expectedScore2))

	return newELO1, newELO2
}

// @Summary Get all matches
// @Description Get list of all matches
// @Tags matches
// @Produce json
// @Success 200 {array} Match
// @Router /api/matches [get]
func GetMatches(c *gin.Context) {
	// Add player details to matches
	enrichedMatches := make([]Match, len(matches))
	for i, match := range matches {
		enrichedMatches[i] = match
		// Find and add player details
		for _, player := range players {
			if player.ID == match.Player1ID {
				enrichedMatches[i].Player1 = player
			}
			if player.ID == match.Player2ID {
				enrichedMatches[i].Player2 = player
			}
		}
	}

	c.JSON(http.StatusOK, enrichedMatches)
}

// @Summary Create a new match
// @Description Create a new match and update player ELO ratings
// @Tags matches
// @Accept json
// @Produce json
// @Param match body Match true "Match object"
// @Success 201 {object} Match
// @Router /api/matches [post]
func CreateMatch(c *gin.Context) {
	var newMatch Match
	if err := c.ShouldBindJSON(&newMatch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find the players
	var player1, player2 *Player
	for i := range players {
		if players[i].ID == newMatch.Player1ID {
			player1 = &players[i]
		}
		if players[i].ID == newMatch.Player2ID {
			player2 = &players[i]
		}
	}

	if player1 == nil || player2 == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "One or both players not found"})
		return
	}

	// Record ELO before match
	newMatch.Player1ELOBefore = player1.ELO
	newMatch.Player2ELOBefore = player2.ELO

	// Calculate new ELO ratings
	newELO1, newELO2 := calculateELO(player1.ELO, player2.ELO, newMatch.Result)

	// Update match with new ELO
	newMatch.Player1ELOAfter = newELO1
	newMatch.Player2ELOAfter = newELO2

	// Update players
	player1.ELO = newELO1
	player2.ELO = newELO2
	
	// Update win/loss/draw counts
	switch newMatch.Result {
	case "player1_wins":
		player1.Wins++
		player2.Losses++
	case "player2_wins":
		player2.Wins++
		player1.Losses++
	case "draw":
		player1.Draws++
		player2.Draws++
	}

	// Update last game time
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	player1.LastGame = currentTime
	player2.LastGame = currentTime

	// Set match details
	newMatch.ID = nextMatchID
	nextMatchID++
	newMatch.PlayedAt = currentTime
	newMatch.Player1 = *player1
	newMatch.Player2 = *player2

	matches = append(matches, newMatch)
	c.JSON(http.StatusCreated, newMatch)
}

// @Summary Get a match by ID
// @Description Get a single match by its ID
// @Tags matches
// @Produce json
// @Param id path int true "Match ID"
// @Success 200 {object} Match
// @Failure 404 {object} map[string]string
// @Router /api/matches/{id} [get]
func GetMatch(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	for _, match := range matches {
		if match.ID == id {
			// Add player details
			enrichedMatch := match
			for _, player := range players {
				if player.ID == match.Player1ID {
					enrichedMatch.Player1 = player
				}
				if player.ID == match.Player2ID {
					enrichedMatch.Player2 = player
				}
			}
			c.JSON(http.StatusOK, enrichedMatch)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
}