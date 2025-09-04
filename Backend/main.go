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

	// Auth routes
	router.GET("/api/auth/login", api.LoginHandler)
	router.GET("/api/auth/callback", api.CallbackHandler)
	router.POST("/api/auth/logout", api.LogoutHandler)
	router.GET("/api/auth/me", api.AuthMiddleware(), api.MeHandler)

	// Protected API routes
	protected := router.Group("/api")
	protected.Use(api.AuthMiddleware())
	{
		protected.GET("/players", api.GetPlayers)
		protected.POST("/players", api.CreatePlayer)
		protected.GET("/players/:id", api.GetPlayer)
		protected.PUT("/players/:id", api.UpdatePlayer)
		protected.DELETE("/players/:id", api.DeletePlayer)
		
		protected.GET("/matches", api.GetMatches)
		protected.POST("/matches", api.CreateMatch)
		protected.GET("/matches/:id", api.GetMatch)
		
		protected.GET("/leaderboard", api.GetLeaderboard)
		protected.GET("/stats", api.GetStats)
	}

	// Health check endpoint (public)
	router.GET("/api/health", api.HealthCheck)

	router.Run(":8081")
}