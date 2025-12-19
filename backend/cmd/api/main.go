package main

import (
	"database/sql"
	"log"

	"github.com/42heilbronn/elo-leaderboard/internal/config"
	"github.com/42heilbronn/elo-leaderboard/internal/handlers"
	"github.com/42heilbronn/elo-leaderboard/internal/middleware"
	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
	"github.com/42heilbronn/elo-leaderboard/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Connected to database successfully")

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	matchRepo := repositories.NewMatchRepository(db)
	reactionRepo := repositories.NewReactionRepository(db)
	commentRepo := repositories.NewCommentRepository(db)

	// Initialize services
	eloService := services.NewELOService(cfg.ELOKFactor)
	matchService := services.NewMatchService(db, matchRepo, userRepo, eloService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg, userRepo)
	matchHandler := handlers.NewMatchHandler(matchService, matchRepo, reactionRepo, commentRepo)

	// Setup Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Public routes
	api := router.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.GET("/login", authHandler.Login)
			auth.GET("/callback", authHandler.Callback)
		}

		// Public leaderboard
		api.GET("/leaderboard/:sport", matchHandler.GetLeaderboard)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Auth
		protected.GET("/auth/me", authHandler.Me)
		protected.GET("/users", authHandler.GetUsers)

		// Matches
		protected.POST("/matches", matchHandler.SubmitMatch)
		protected.GET("/matches", matchHandler.GetMatches)
		protected.GET("/matches/:id", matchHandler.GetMatch)
		protected.POST("/matches/:id/confirm", matchHandler.ConfirmMatch)
		protected.POST("/matches/:id/deny", matchHandler.DenyMatch)

		// Reactions
		protected.POST("/matches/:id/reactions", matchHandler.AddReaction)
		protected.GET("/matches/:id/reactions", matchHandler.GetReactions)
		protected.DELETE("/matches/:id/reactions/:emoji", matchHandler.RemoveReaction)

		// Comments
		protected.POST("/matches/:id/comments", matchHandler.AddComment)
		protected.GET("/matches/:id/comments", matchHandler.GetComments)
		protected.DELETE("/matches/:id/comments/:commentId", matchHandler.DeleteComment)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
