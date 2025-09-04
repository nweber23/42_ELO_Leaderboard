package main

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	api "elo-leaderboard-backend/api"
)

// @title ELO Leaderboard API
// @version 1.0.0
// @description API for managing ELO ratings and leaderboard
// @host localhost:8081
// @BasePath /
func main() {
	router := gin.Default()

	// Configure CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "https://your-domain.com"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}

	// Apply the CORS middleware to the router
	router.Use(cors.New(config))

	// API routes
	router.GET("/api/players", api.GetPlayers)
	router.POST("/api/players", api.CreatePlayer)
	router.GET("/api/players/:id", api.GetPlayer)
	router.PUT("/api/players/:id", api.UpdatePlayer)
	router.DELETE("/api/players/:id", api.DeletePlayer)
	
	router.GET("/api/matches", api.GetMatches)
	router.POST("/api/matches", api.CreateMatch)
	router.GET("/api/matches/:id", api.GetMatch)
	
	router.GET("/api/leaderboard", api.GetLeaderboard)
	router.GET("/api/stats", api.GetStats)

	// Health check endpoint
	router.GET("/api/health", api.HealthCheck)

	router.Run(":8081")
}