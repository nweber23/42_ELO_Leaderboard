package main

import (
	"database/sql"
	"log/slog"
	"os"
	"time"

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

	// Configure connection pool for better performance under load
	db.SetMaxOpenConns(25)                  // Maximum number of open connections
	db.SetMaxIdleConns(10)                  // Maximum number of idle connections
	db.SetConnMaxLifetime(5 * time.Minute)  // Maximum connection lifetime
	db.SetConnMaxIdleTime(1 * time.Minute)  // Maximum idle time before closing

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

	// Initialize rate limiters
	strictLimiter := middleware.NewStrictRateLimiter()   // 10 req/min for match submission
	moderateLimiter := middleware.NewModerateRateLimiter() // 30 req/min for reactions/comments
	looseLimiter := middleware.NewLooseRateLimiter()     // 100 req/min for reads
	defer strictLimiter.Stop()
	defer moderateLimiter.Stop()
	defer looseLimiter.Stop()

	// Public routes
	api := router.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.GET("/login", authHandler.Login)
			auth.GET("/callback", authHandler.Callback)
			auth.POST("/logout", authHandler.Logout) // Logout endpoint to clear httpOnly cookie
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

		// Matches - apply strict rate limiting to mutation endpoints
		protected.POST("/matches", middleware.RateLimitMiddleware(strictLimiter, middleware.CombinedKeyFunc), matchHandler.SubmitMatch)
		protected.GET("/matches", middleware.RateLimitMiddleware(looseLimiter, middleware.IPKeyFunc), matchHandler.GetMatches)
		protected.GET("/matches/:id", middleware.RateLimitMiddleware(looseLimiter, middleware.IPKeyFunc), matchHandler.GetMatch)
		protected.POST("/matches/:id/confirm", middleware.RateLimitMiddleware(strictLimiter, middleware.CombinedKeyFunc), matchHandler.ConfirmMatch)
		protected.POST("/matches/:id/deny", middleware.RateLimitMiddleware(strictLimiter, middleware.CombinedKeyFunc), matchHandler.DenyMatch)
		protected.POST("/matches/:id/cancel", middleware.RateLimitMiddleware(strictLimiter, middleware.CombinedKeyFunc), matchHandler.CancelMatch)

		// Reactions - moderate rate limiting
		protected.POST("/matches/:id/reactions", middleware.RateLimitMiddleware(moderateLimiter, middleware.CombinedKeyFunc), matchHandler.AddReaction)
		protected.GET("/matches/:id/reactions", middleware.RateLimitMiddleware(looseLimiter, middleware.IPKeyFunc), matchHandler.GetReactions)
		protected.DELETE("/matches/:id/reactions/:emoji", middleware.RateLimitMiddleware(moderateLimiter, middleware.CombinedKeyFunc), matchHandler.RemoveReaction)

		// Comments - moderate rate limiting
		protected.POST("/matches/:id/comments", middleware.RateLimitMiddleware(moderateLimiter, middleware.CombinedKeyFunc), matchHandler.AddComment)
		protected.GET("/matches/:id/comments", middleware.RateLimitMiddleware(looseLimiter, middleware.IPKeyFunc), matchHandler.GetComments)
		protected.DELETE("/matches/:id/comments/:commentId", middleware.RateLimitMiddleware(moderateLimiter, middleware.CombinedKeyFunc), matchHandler.DeleteComment)
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
