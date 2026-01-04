package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter implements a token bucket rate limiting algorithm
type RateLimiter struct {
	mu           sync.RWMutex
	buckets      map[string]*bucket
	maxTokens    int           // Maximum tokens per bucket
	refillRate   time.Duration // How often to add a token
	cleanupEvery time.Duration // How often to cleanup old buckets
	stopCleanup  chan struct{}
}

type bucket struct {
	tokens    int
	lastRefill time.Time
}

// NewRateLimiter creates a new rate limiter
// maxRequests: maximum requests allowed in the window
// window: time window for rate limiting
func NewRateLimiter(maxRequests int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		buckets:      make(map[string]*bucket),
		maxTokens:    maxRequests,
		refillRate:   window / time.Duration(maxRequests),
		cleanupEvery: 10 * time.Minute,
		stopCleanup:  make(chan struct{}),
	}

	// Start cleanup goroutine
	go rl.cleanup()

	return rl
}

// Allow checks if a request from the given key should be allowed
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	b, exists := rl.buckets[key]

	if !exists {
		rl.buckets[key] = &bucket{
			tokens:    rl.maxTokens - 1, // Use one token for this request
			lastRefill: now,
		}
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(b.lastRefill)
	tokensToAdd := int(elapsed / rl.refillRate)

	if tokensToAdd > 0 {
		b.tokens = min(b.tokens+tokensToAdd, rl.maxTokens)
		b.lastRefill = now
	}

	if b.tokens > 0 {
		b.tokens--
		return true
	}

	return false
}

// cleanup periodically removes old buckets to prevent memory leaks
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.cleanupEvery)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			rl.mu.Lock()
			now := time.Now()
			for key, b := range rl.buckets {
				// Remove buckets that haven't been used for a while and are full
				if now.Sub(b.lastRefill) > rl.cleanupEvery && b.tokens >= rl.maxTokens {
					delete(rl.buckets, key)
				}
			}
			rl.mu.Unlock()
		case <-rl.stopCleanup:
			return
		}
	}
}

// Stop stops the cleanup goroutine
func (rl *RateLimiter) Stop() {
	close(rl.stopCleanup)
}

// RateLimitMiddleware creates a Gin middleware for rate limiting
// keyFunc determines how to identify requests (by IP, user ID, etc.)
func RateLimitMiddleware(rl *RateLimiter, keyFunc func(*gin.Context) string) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := keyFunc(c)

		if !rl.Allow(key) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, please try again later",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// IPKeyFunc returns the client IP as the rate limit key
func IPKeyFunc(c *gin.Context) string {
	return c.ClientIP()
}

// UserOrIPKeyFunc returns user ID if authenticated, otherwise IP
func UserOrIPKeyFunc(c *gin.Context) string {
	if userID, ok := c.Get("user_id"); ok {
		if id, ok := userID.(int); ok {
			return "user:" + string(rune(id))
		}
	}
	return "ip:" + c.ClientIP()
}

// CombinedKeyFunc returns a combination of user ID (or IP) and endpoint
func CombinedKeyFunc(c *gin.Context) string {
	base := UserOrIPKeyFunc(c)
	return base + ":" + c.Request.Method + ":" + c.FullPath()
}

// Pre-configured rate limiters for different use cases

// NewStrictRateLimiter for sensitive endpoints (e.g., match submission)
// 10 requests per minute
func NewStrictRateLimiter() *RateLimiter {
	return NewRateLimiter(10, time.Minute)
}

// NewModerateRateLimiter for regular endpoints (e.g., comments)
// 30 requests per minute
func NewModerateRateLimiter() *RateLimiter {
	return NewRateLimiter(30, time.Minute)
}

// NewLooseRateLimiter for read-heavy endpoints
// 100 requests per minute
func NewLooseRateLimiter() *RateLimiter {
	return NewRateLimiter(100, time.Minute)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
