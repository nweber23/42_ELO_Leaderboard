package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// RecoveryConfig holds configuration for the recovery middleware
type RecoveryConfig struct {
	// EnableStackTrace enables stack trace logging (should be false in production for security)
	EnableStackTrace bool
	// OnPanic is called when a panic occurs (optional)
	OnPanic func(c *gin.Context, err interface{}, stack []byte)
}

// DefaultRecoveryConfig returns sensible defaults for recovery
func DefaultRecoveryConfig() RecoveryConfig {
	return RecoveryConfig{
		EnableStackTrace: false,
		OnPanic:          nil,
	}
}

// RecoveryMiddleware returns a middleware that recovers from panics
// and returns a 500 error response instead of crashing the server
func RecoveryMiddleware() gin.HandlerFunc {
	return RecoveryMiddlewareWithConfig(DefaultRecoveryConfig())
}

// RecoveryMiddlewareWithConfig returns a recovery middleware with custom configuration
func RecoveryMiddlewareWithConfig(cfg RecoveryConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// Get stack trace
				stack := debug.Stack()

				// Log the error
				slog.Error("Panic recovered",
					"error", fmt.Sprintf("%v", err),
					"path", c.Request.URL.Path,
					"method", c.Request.Method,
					"client_ip", c.ClientIP(),
				)

				// Log stack trace if enabled
				if cfg.EnableStackTrace {
					slog.Error("Stack trace", "stack", string(stack))
				}

				// Call custom panic handler if provided
				if cfg.OnPanic != nil {
					cfg.OnPanic(c, err, stack)
				}

				// Abort with internal server error
				// Don't expose internal error details to client
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error":   "internal server error",
					"message": "An unexpected error occurred. Please try again later.",
				})
			}
		}()

		c.Next()
	}
}

// ErrorBoundary wraps a handler function with panic recovery
// Useful for wrapping individual handlers that might panic
func ErrorBoundary(handler gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("Handler panic recovered",
					"error", fmt.Sprintf("%v", err),
					"path", c.Request.URL.Path,
				)
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": "internal server error",
				})
			}
		}()

		handler(c)
	}
}

// SafeGoroutine runs a function in a goroutine with panic recovery
// Use this for background tasks to prevent panics from crashing the server
func SafeGoroutine(fn func()) {
	go func() {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("Goroutine panic recovered",
					"error", fmt.Sprintf("%v", err),
					"stack", string(debug.Stack()),
				)
			}
		}()

		fn()
	}()
}

// SafeGoroutineWithContext runs a function in a goroutine with panic recovery
// and context for logging
func SafeGoroutineWithContext(name string, fn func()) {
	go func() {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("Goroutine panic recovered",
					"goroutine", name,
					"error", fmt.Sprintf("%v", err),
					"stack", string(debug.Stack()),
				)
			}
		}()

		fn()
	}()
}

// RetryWithRecovery executes a function with retry logic and panic recovery
// Useful for operations that might fail intermittently
func RetryWithRecovery(maxRetries int, fn func() error) error {
	var lastErr error

	for i := 0; i < maxRetries; i++ {
		err := func() (err error) {
			defer func() {
				if r := recover(); r != nil {
					err = fmt.Errorf("panic: %v", r)
					slog.Error("Retry operation panic",
						"attempt", i+1,
						"error", fmt.Sprintf("%v", r),
					)
				}
			}()

			return fn()
		}()

		if err == nil {
			return nil
		}

		lastErr = err
		slog.Warn("Retry operation failed",
			"attempt", i+1,
			"max_retries", maxRetries,
			"error", err.Error(),
		)
	}

	return fmt.Errorf("operation failed after %d retries: %w", maxRetries, lastErr)
}
