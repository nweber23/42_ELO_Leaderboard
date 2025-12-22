package main

import (
	"database/sql"
	"log/slog"
	"os"

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
	// Setup structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load config", "error", err)
		os.Exit(1)
	}

	// Connect to database
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		slog.Error("Failed to ping database", "error", err)
		os.Exit(1)
	}

	slog.Info("Connected to database successfully")

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
		AllowOrigins:     cfg.AllowedOrigins,
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

		// Public leaderboard - with optional auth to show real data to logged-in users
		api.GET("/leaderboard/:sport", middleware.OptionalAuthMiddleware(cfg.JWTSecret), matchHandler.GetLeaderboard)
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
		protected.POST("/matches/:id/cancel", matchHandler.CancelMatch)

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
	slog.Info("Server starting", "port", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}
