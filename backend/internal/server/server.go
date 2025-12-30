package server

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

// ShutdownManager coordinates graceful shutdown of all application components
type ShutdownManager struct {
	mu           sync.Mutex
	cleanupFuncs []CleanupFunc
	timeout      time.Duration
	isShutdown   bool
}

// CleanupFunc is a function that performs cleanup during shutdown
type CleanupFunc struct {
	Name    string
	Cleanup func(ctx context.Context) error
}

// NewShutdownManager creates a new shutdown manager
func NewShutdownManager(timeout time.Duration) *ShutdownManager {
	return &ShutdownManager{
		cleanupFuncs: make([]CleanupFunc, 0),
		timeout:      timeout,
	}
}

// Register adds a cleanup function to be called during shutdown
// Cleanup functions are called in reverse order (LIFO)
func (sm *ShutdownManager) Register(name string, cleanup func(ctx context.Context) error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sm.cleanupFuncs = append(sm.cleanupFuncs, CleanupFunc{
		Name:    name,
		Cleanup: cleanup,
	})
}

// RegisterSimple adds a simple cleanup function without context
func (sm *ShutdownManager) RegisterSimple(name string, cleanup func()) {
	sm.Register(name, func(ctx context.Context) error {
		cleanup()
		return nil
	})
}

// RegisterDatabase registers database cleanup
func (sm *ShutdownManager) RegisterDatabase(db *sql.DB) {
	sm.Register("database", func(ctx context.Context) error {
		slog.Info("Closing database connections")
		return db.Close()
	})
}

// WaitForShutdown blocks until a shutdown signal is received, then performs cleanup
func (sm *ShutdownManager) WaitForShutdown(server *http.Server) {
	// Create channel for shutdown signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)

	// Wait for signal
	sig := <-quit
	slog.Info("Shutdown signal received", "signal", sig.String())

	sm.Shutdown(server)
}

// Shutdown performs the graceful shutdown
func (sm *ShutdownManager) Shutdown(server *http.Server) {
	sm.mu.Lock()
	if sm.isShutdown {
		sm.mu.Unlock()
		return
	}
	sm.isShutdown = true
	sm.mu.Unlock()

	slog.Info("Starting graceful shutdown", "timeout", sm.timeout.String())

	// Create context with timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), sm.timeout)
	defer cancel()

	// Shutdown HTTP server first (stop accepting new requests)
	if server != nil {
		slog.Info("Shutting down HTTP server")
		if err := server.Shutdown(ctx); err != nil {
			slog.Error("HTTP server shutdown error", "error", err)
		} else {
			slog.Info("HTTP server shutdown complete")
		}
	}

	// Run cleanup functions in reverse order
	sm.mu.Lock()
	funcs := make([]CleanupFunc, len(sm.cleanupFuncs))
	copy(funcs, sm.cleanupFuncs)
	sm.mu.Unlock()

	for i := len(funcs) - 1; i >= 0; i-- {
		fn := funcs[i]
		slog.Info("Running cleanup", "name", fn.Name)

		if err := fn.Cleanup(ctx); err != nil {
			slog.Error("Cleanup error", "name", fn.Name, "error", err)
		} else {
			slog.Info("Cleanup complete", "name", fn.Name)
		}
	}

	slog.Info("Graceful shutdown complete")
}

// Server wraps http.Server with graceful shutdown capabilities
type Server struct {
	httpServer      *http.Server
	shutdownManager *ShutdownManager
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Addr            string
	Handler         http.Handler
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
}

// DefaultServerConfig returns sensible defaults
func DefaultServerConfig(addr string, handler http.Handler) ServerConfig {
	return ServerConfig{
		Addr:            addr,
		Handler:         handler,
		ReadTimeout:     15 * time.Second,
		WriteTimeout:    15 * time.Second,
		IdleTimeout:     60 * time.Second,
		ShutdownTimeout: 30 * time.Second,
	}
}

// NewServer creates a new server with graceful shutdown
func NewServer(cfg ServerConfig) *Server {
	return &Server{
		httpServer: &http.Server{
			Addr:         cfg.Addr,
			Handler:      cfg.Handler,
			ReadTimeout:  cfg.ReadTimeout,
			WriteTimeout: cfg.WriteTimeout,
			IdleTimeout:  cfg.IdleTimeout,
		},
		shutdownManager: NewShutdownManager(cfg.ShutdownTimeout),
	}
}

// Register adds a cleanup function
func (s *Server) Register(name string, cleanup func(ctx context.Context) error) {
	s.shutdownManager.Register(name, cleanup)
}

// RegisterSimple adds a simple cleanup function
func (s *Server) RegisterSimple(name string, cleanup func()) {
	s.shutdownManager.RegisterSimple(name, cleanup)
}

// Start starts the server and blocks until shutdown
func (s *Server) Start() error {
	// Start server in goroutine
	go func() {
		slog.Info("Server starting", "addr", s.httpServer.Addr)
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server error", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for shutdown signal
	s.shutdownManager.WaitForShutdown(s.httpServer)

	return nil
}

// StartWithContext starts the server with a context for cancellation
func (s *Server) StartWithContext(ctx context.Context) error {
	// Start server in goroutine
	go func() {
		slog.Info("Server starting", "addr", s.httpServer.Addr)
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server error", "error", err)
		}
	}()

	// Wait for context cancellation or shutdown signal
	select {
	case <-ctx.Done():
		slog.Info("Context cancelled, shutting down")
		s.shutdownManager.Shutdown(s.httpServer)
	}

	return nil
}

// ShutdownManager returns the shutdown manager for registering cleanup functions
func (s *Server) ShutdownManager() *ShutdownManager {
	return s.shutdownManager
}
