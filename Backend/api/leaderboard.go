package api

import (
	"net/http"
	"sort"

	"github.com/gin-gonic/gin"
)

// @Summary Get leaderboard
// @Description Get ranked leaderboard of all players
// @Tags leaderboard
// @Produce json
// @Success 200 {array} LeaderboardEntry
// @Router /api/leaderboard [get]
func GetLeaderboard(c *gin.Context) {
	// Create leaderboard entries - initialize as empty slice, not nil
	leaderboard := make([]LeaderboardEntry, 0)

	if len(players) > 0 {
		// Sort players by ELO descending
		sortedPlayers := make([]Player, len(players))
		copy(sortedPlayers, players)
		sort.Slice(sortedPlayers, func(i, j int) bool {
			return sortedPlayers[i].ELO > sortedPlayers[j].ELO
		})

		for i, player := range sortedPlayers {
			totalGames := player.Wins + player.Losses + player.Draws
			var winRate float64
			if totalGames > 0 {
				winRate = float64(player.Wins) / float64(totalGames) * 100
			}

			entry := LeaderboardEntry{
				Rank:    i + 1,
				Player:  player,
				Games:   totalGames,
				WinRate: winRate,
			}
			leaderboard = append(leaderboard, entry)
		}
	}

	c.JSON(http.StatusOK, leaderboard)
}

// @Summary Get statistics
// @Description Get overall statistics for the leaderboard
// @Tags stats
// @Produce json
// @Success 200 {object} Stats
// @Router /api/stats [get]
func GetStats(c *gin.Context) {
	if len(players) == 0 {
		stats := Stats{
			TotalPlayers: 0,
			TotalMatches: len(matches),
			AvgELO:       0,
		}
		c.JSON(http.StatusOK, stats)
		return
	}

	// Calculate average ELO
	totalELO := 0
	topPlayer := players[0]
	
	for _, player := range players {
		totalELO += player.ELO
		if player.ELO > topPlayer.ELO {
			topPlayer = player
		}
	}

	avgELO := float64(totalELO) / float64(len(players))

	stats := Stats{
		TotalPlayers: len(players),
		TotalMatches: len(matches),
		AvgELO:       avgELO,
		TopPlayer:    topPlayer,
	}

	c.JSON(http.StatusOK, stats)
}