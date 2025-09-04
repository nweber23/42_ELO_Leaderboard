package api

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// In-memory storage for demo purposes
var players []Player
var nextPlayerID = 1

// @Summary Get all players
// @Description Get list of all players
// @Tags players
// @Produce json
// @Success 200 {array} Player
// @Router /api/players [get]
func GetPlayers(c *gin.Context) {
	// Sort players by ELO descending
	sortedPlayers := make([]Player, len(players))
	copy(sortedPlayers, players)
	sort.Slice(sortedPlayers, func(i, j int) bool {
		return sortedPlayers[i].ELO > sortedPlayers[j].ELO
	})

	// Update ranks
	for i := range sortedPlayers {
		sortedPlayers[i].Rank = i + 1
	}

	c.JSON(http.StatusOK, sortedPlayers)
}

// @Summary Create a new player
// @Description Create a new player with default ELO of 1200
// @Tags players
// @Accept json
// @Produce json
// @Param player body Player true "Player object"
// @Success 201 {object} Player
// @Router /api/players [post]
func CreatePlayer(c *gin.Context) {
	var newPlayer Player
	if err := c.ShouldBindJSON(&newPlayer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newPlayer.ID = nextPlayerID
	nextPlayerID++
	newPlayer.ELO = 1200 // Default ELO
	newPlayer.Wins = 0
	newPlayer.Losses = 0
	newPlayer.Draws = 0
	newPlayer.Created = time.Now().Format("2006-01-02 15:04:05")
	newPlayer.LastGame = ""

	players = append(players, newPlayer)
	c.JSON(http.StatusCreated, newPlayer)
}

// @Summary Get a player by ID
// @Description Get a single player by their ID
// @Tags players
// @Produce json
// @Param id path int true "Player ID"
// @Success 200 {object} Player
// @Failure 404 {object} map[string]string
// @Router /api/players/{id} [get]
func GetPlayer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	for _, player := range players {
		if player.ID == id {
			c.JSON(http.StatusOK, player)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
}

// @Summary Update a player
// @Description Update a player's information
// @Tags players
// @Accept json
// @Produce json
// @Param id path int true "Player ID"
// @Param player body Player true "Updated player object"
// @Success 200 {object} Player
// @Failure 404 {object} map[string]string
// @Router /api/players/{id} [put]
func UpdatePlayer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	var updatedPlayer Player
	if err := c.ShouldBindJSON(&updatedPlayer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for i, player := range players {
		if player.ID == id {
			updatedPlayer.ID = id
			players[i] = updatedPlayer
			c.JSON(http.StatusOK, updatedPlayer)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
}

// @Summary Delete a player
// @Description Delete a player by ID
// @Tags players
// @Param id path int true "Player ID"
// @Success 204
// @Failure 404 {object} map[string]string
// @Router /api/players/{id} [delete]
func DeletePlayer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	for i, player := range players {
		if player.ID == id {
			players = append(players[:i], players[i+1:]...)
			c.Status(http.StatusNoContent)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
}