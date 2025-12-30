package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// DistributedRateLimiter implements rate limiting using an external store (like Redis)
// This allows rate limiting to work across multiple application instances
type DistributedRateLimiter struct {
	store        RateLimitStore
	maxRequests  int
	window       time.Duration
	keyPrefix    string
}

// RateLimitStore defines the interface for a distributed rate limit store
type RateLimitStore interface {
	// Increment increments the counter for the given key and returns the new count
	// The key should expire after the window duration
	Increment(ctx context.Context, key string, window time.Duration) (int64, error)
	// Get returns the current count for the given key
	Get(ctx context.Context, key string) (int64, error)
	// Reset resets the counter for the given key
	Reset(ctx context.Context, key string) error
}

// RedisRateLimitStore implements RateLimitStore using Redis
// This is a reference implementation - users should provide their own Redis client
type RedisRateLimitStore struct {
	// RedisClient should be injected - e.g., *redis.Client from go-redis
	client RedisClient
}

// RedisClient defines the minimal Redis interface needed for rate limiting
type RedisClient interface {
	Incr(ctx context.Context, key string) (int64, error)
	Expire(ctx context.Context, key string, expiration time.Duration) error
	Get(ctx context.Context, key string) (string, error)
	Del(ctx context.Context, keys ...string) error
	TTL(ctx context.Context, key string) (time.Duration, error)
}

// NewRedisRateLimitStore creates a new Redis-backed rate limit store
func NewRedisRateLimitStore(client RedisClient) *RedisRateLimitStore {
	return &RedisRateLimitStore{client: client}
}

// Increment implements sliding window rate limiting with Redis
func (s *RedisRateLimitStore) Increment(ctx context.Context, key string, window time.Duration) (int64, error) {
	count, err := s.client.Incr(ctx, key)
	if err != nil {
		return 0, fmt.Errorf("failed to increment rate limit counter: %w", err)
	}

	// Set expiry only on first request (count == 1) to create a fixed window
	// For a more accurate sliding window, consider using Redis sorted sets
	if count == 1 {
		if err := s.client.Expire(ctx, key, window); err != nil {
			return count, fmt.Errorf("failed to set rate limit expiry: %w", err)
		}
	}

	return count, nil
}

// Get returns the current count for a key
func (s *RedisRateLimitStore) Get(ctx context.Context, key string) (int64, error) {
	val, err := s.client.Get(ctx, key)
	if err != nil {
		// Key doesn't exist - return 0
		return 0, nil
	}
	var count int64
	_, err = fmt.Sscanf(val, "%d", &count)
	return count, err
}

// Reset removes the rate limit for a key
func (s *RedisRateLimitStore) Reset(ctx context.Context, key string) error {
	return s.client.Del(ctx, key)
}

// InMemoryRateLimitStore provides a fallback for local development
// It wraps the existing RateLimiter for compatibility
type InMemoryRateLimitStore struct {
	limiter *RateLimiter
}

// NewInMemoryRateLimitStore creates a new in-memory rate limit store
func NewInMemoryRateLimitStore(maxRequests int, window time.Duration) *InMemoryRateLimitStore {
	return &InMemoryRateLimitStore{
		limiter: NewRateLimiter(maxRequests, window),
	}
}

// Increment checks if the request is allowed and returns a pseudo-count
func (s *InMemoryRateLimitStore) Increment(ctx context.Context, key string, window time.Duration) (int64, error) {
	if s.limiter.Allow(key) {
		return 1, nil // Allowed
	}
	return int64(s.limiter.maxTokens + 1), nil // Exceeds limit
}

// Get returns a placeholder count
func (s *InMemoryRateLimitStore) Get(ctx context.Context, key string) (int64, error) {
	return 0, nil
}

// Reset is a no-op for in-memory store
func (s *InMemoryRateLimitStore) Reset(ctx context.Context, key string) error {
	return nil
}

// Stop stops the cleanup goroutine
func (s *InMemoryRateLimitStore) Stop() {
	s.limiter.Stop()
}

// NewDistributedRateLimiter creates a new distributed rate limiter
func NewDistributedRateLimiter(store RateLimitStore, maxRequests int, window time.Duration, keyPrefix string) *DistributedRateLimiter {
	return &DistributedRateLimiter{
		store:       store,
		maxRequests: maxRequests,
		window:      window,
		keyPrefix:   keyPrefix,
	}
}

// Allow checks if a request should be allowed
func (rl *DistributedRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	fullKey := fmt.Sprintf("%s:%s", rl.keyPrefix, key)
	count, err := rl.store.Increment(ctx, fullKey, rl.window)
	if err != nil {
		// On error, allow the request but log the issue
		return true, err
	}
	return count <= int64(rl.maxRequests), nil
}

// GetRemainingRequests returns how many requests are remaining for a key
func (rl *DistributedRateLimiter) GetRemainingRequests(ctx context.Context, key string) (int, error) {
	fullKey := fmt.Sprintf("%s:%s", rl.keyPrefix, key)
	count, err := rl.store.Get(ctx, fullKey)
	if err != nil {
		return rl.maxRequests, err
	}
	remaining := rl.maxRequests - int(count)
	if remaining < 0 {
		return 0, nil
	}
	return remaining, nil
}

// Reset resets the rate limit for a key
func (rl *DistributedRateLimiter) Reset(ctx context.Context, key string) error {
	fullKey := fmt.Sprintf("%s:%s", rl.keyPrefix, key)
	return rl.store.Reset(ctx, fullKey)
}

// Pre-configured distributed rate limiters

// NewDistributedStrictRateLimiter for sensitive endpoints (10 req/min)
func NewDistributedStrictRateLimiter(store RateLimitStore) *DistributedRateLimiter {
	return NewDistributedRateLimiter(store, 10, time.Minute, "ratelimit:strict")
}

// NewDistributedModerateRateLimiter for moderate endpoints (30 req/min)
func NewDistributedModerateRateLimiter(store RateLimitStore) *DistributedRateLimiter {
	return NewDistributedRateLimiter(store, 30, time.Minute, "ratelimit:moderate")
}

// NewDistributedLooseRateLimiter for read endpoints (100 req/min)
func NewDistributedLooseRateLimiter(store RateLimitStore) *DistributedRateLimiter {
	return NewDistributedRateLimiter(store, 100, time.Minute, "ratelimit:loose")
}

// DistributedRateLimitMiddleware creates a Gin middleware for distributed rate limiting
func DistributedRateLimitMiddleware(rl *DistributedRateLimiter, keyFunc func(*gin.Context) string) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := keyFunc(c)

		allowed, err := rl.Allow(c.Request.Context(), key)
		if err != nil {
			// Log error but allow request to proceed (fail-open for availability)
			// In a strict security environment, you might want to fail-closed instead
			c.Next()
			return
		}

		if !allowed {
			remaining, _ := rl.GetRemainingRequests(c.Request.Context(), key)
			c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", rl.maxRequests))
			c.Header("Retry-After", "60")

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, please try again later",
			})
			c.Abort()
			return
		}

		// Add rate limit headers for visibility
		remaining, _ := rl.GetRemainingRequests(c.Request.Context(), key)
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", rl.maxRequests))

		c.Next()
	}
}
