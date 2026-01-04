package main

import (
	"database/sql"
	"log/slog"
	"os"
	"time"

	"github.com/42heilbronn/elo-leaderboard/internal/config"
	"github.com/42heilbronn/elo-leaderboard/internal/handlers"
	"github.com/42heilbronn/elo-leaderboard/internal/middleware"
	"github.com/42heilbronn/elo-leaderboard/internal/migrations"
	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
	"github.com/42heilbronn/elo-leaderboard/internal/server"
	"github.com/42heilbronn/elo-leaderboard/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
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
	// Note: db.Close() is handled by the shutdown manager

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

	// Run database migrations
	migrator, err := migrations.NewMigrator(db)
	if err != nil {
		slog.Error("Failed to initialize migrator", "error", err)
		os.Exit(1)
	}
	if err := migrator.MigrateUp(); err != nil {
		slog.Error("Failed to run migrations", "error", err)
		os.Exit(1)
	}
	slog.Info("Database migrations applied successfully")

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	matchRepo := repositories.NewMatchRepository(db)
	commentRepo := repositories.NewCommentRepository(db)
	adminRepo := repositories.NewAdminRepository(db)

	// Initialize services
	eloService := services.NewELOService(cfg.ELOKFactor)
	matchService := services.NewMatchService(db, matchRepo, userRepo, eloService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg, userRepo, matchService)
	matchHandler := handlers.NewMatchHandler(matchService, matchRepo, commentRepo)
	adminHandler := handlers.NewAdminHandler(adminRepo, userRepo, matchRepo)
	healthHandler := handlers.NewHealthHandler(db)
	gdprHandler := handlers.NewGDPRHandler(db, userRepo, matchRepo, commentRepo, matchService)

	// Setup Gin router
	router := gin.New()

	// Add recovery middleware with proper error boundaries
	router.Use(middleware.RecoveryMiddleware())
	router.Use(gin.Logger())

	// Security headers middleware (HSTS, XSS protection, etc.) - GDPR/security compliance
	router.Use(middleware.SecurityHeaders(cfg.CookieSecure))

	// HTTPS redirect in production
	router.Use(middleware.HTTPSRedirect(cfg.CookieSecure))

	// Gzip compression middleware - compress responses for better performance
	router.Use(gzip.Gzip(gzip.DefaultCompression))

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
	moderateLimiter := middleware.NewModerateRateLimiter() // 30 req/min for comments
	looseLimiter := middleware.NewLooseRateLimiter()     // 100 req/min for reads

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
	protected.Use(middleware.BannedUserMiddleware(userRepo))
	{
		// Auth
		protected.GET("/auth/me", authHandler.Me)
		protected.GET("/users", authHandler.GetUsers)

		// GDPR endpoints (Art. 15 & 17)
		protected.GET("/users/me/data-export", gdprHandler.ExportUserData)
		protected.DELETE("/users/me/delete", gdprHandler.DeleteAccount)

		// Matches - apply strict rate limiting to mutation endpoints
		protected.POST("/matches", middleware.RateLimitMiddleware(strictLimiter, middleware.CombinedKeyFunc), matchHandler.SubmitMatch)
		protected.GET("/matches", middleware.RateLimitMiddleware(looseLimiter, middleware.IPKeyFunc), matchHandler.GetMatches)
		protected.GET("/matches/:id", middleware.RateLimitMiddleware(looseLimiter, middleware.IPKeyFunc), matchHandler.GetMatch)
		protected.POST("/matches/:id/confirm", middleware.RateLimitMiddleware(strictLimiter, middleware.CombinedKeyFunc), matchHandler.ConfirmMatch)
		protected.POST("/matches/:id/deny", middleware.RateLimitMiddleware(strictLimiter, middleware.CombinedKeyFunc), matchHandler.DenyMatch)
		protected.POST("/matches/:id/cancel", middleware.RateLimitMiddleware(strictLimiter, middleware.CombinedKeyFunc), matchHandler.CancelMatch)

		// Comments - moderate rate limiting
		protected.POST("/matches/:id/comments", middleware.RateLimitMiddleware(moderateLimiter, middleware.CombinedKeyFunc), matchHandler.AddComment)
		protected.GET("/matches/:id/comments", middleware.RateLimitMiddleware(looseLimiter, middleware.IPKeyFunc), matchHandler.GetComments)
		protected.DELETE("/matches/:id/comments/:commentId", middleware.RateLimitMiddleware(moderateLimiter, middleware.CombinedKeyFunc), matchHandler.DeleteComment)
	}

	// Admin routes - require authentication + admin privilege
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	admin.Use(middleware.AdminMiddleware(userRepo))
	{
		// System health dashboard
		admin.GET("/health", adminHandler.GetSystemHealth)

		// User management
		admin.GET("/users/banned", adminHandler.GetBannedUsers)
		admin.POST("/users/ban", adminHandler.BanUser)
		admin.POST("/users/:id/unban", adminHandler.UnbanUser)

		// ELO management
		admin.POST("/elo/adjust", adminHandler.AdjustELO)
		admin.GET("/elo/adjustments", adminHandler.GetELOAdjustments)

		// Match management
		admin.GET("/matches/disputed", adminHandler.GetDisputedMatches)
		admin.GET("/matches/confirmed", adminHandler.GetConfirmedMatches)
		admin.PUT("/matches/:id/status", adminHandler.UpdateMatchStatus)
		admin.POST("/matches/:id/revert", adminHandler.RevertMatch)
		admin.DELETE("/matches/:id", adminHandler.DeleteMatch)

		// Audit log
		admin.GET("/audit-log", adminHandler.GetAuditLog)

		// CSV exports
		admin.GET("/export/matches", adminHandler.ExportMatchesCSV)
		admin.GET("/export/users", adminHandler.ExportUsersCSV)
	}

	// Health check endpoints
	router.GET("/health", healthHandler.Health)
	router.GET("/health/live", healthHandler.Liveness)
	router.GET("/health/ready", healthHandler.Readiness)

	// Create server with graceful shutdown
	srv := server.NewServer(server.ServerConfig{
		Addr:            ":" + cfg.Port,
		Handler:         router,
		ReadTimeout:     15 * time.Second,
		WriteTimeout:    15 * time.Second,
		IdleTimeout:     60 * time.Second,
		ShutdownTimeout: 30 * time.Second,
	})

	// Register cleanup functions
	srv.RegisterSimple("strict_rate_limiter", strictLimiter.Stop)
	srv.RegisterSimple("moderate_rate_limiter", moderateLimiter.Stop)
	srv.RegisterSimple("loose_rate_limiter", looseLimiter.Stop)
	srv.ShutdownManager().RegisterDatabase(db)

	// Start server with graceful shutdown
	slog.Info("Server starting", "port", cfg.Port)
	if err := srv.Start(); err != nil {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}
