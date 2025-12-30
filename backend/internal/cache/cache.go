package cache

import (
	"sync"
	"sync/atomic"
	"time"
)

// CacheEntry represents a cached item with expiration
type CacheEntry struct {
	Value      interface{}
	Expiration time.Time
}

// Cache provides thread-safe in-memory caching
type Cache struct {
	mu       sync.RWMutex
	items    map[string]CacheEntry
	ttl      time.Duration
	cleanup  *time.Ticker
	done     chan struct{} // Use struct{} for signal-only channels (zero memory)
	stopped  atomic.Bool   // Track if cache is stopped to prevent double-stop
	maxItems int           // Maximum number of items to prevent unbounded growth
}

// CacheConfig holds configuration options for the cache
type CacheConfig struct {
	TTL             time.Duration
	CleanupInterval time.Duration
	MaxItems        int // 0 means no limit
}

// DefaultCacheConfig returns sensible default configuration
func DefaultCacheConfig() CacheConfig {
	return CacheConfig{
		TTL:             5 * time.Minute,
		CleanupInterval: 1 * time.Minute,
		MaxItems:        10000, // Prevent unbounded growth
	}
}

// NewCache creates a new cache with the specified TTL and cleanup interval
func NewCache(ttl time.Duration, cleanupInterval time.Duration) *Cache {
	return NewCacheWithConfig(CacheConfig{
		TTL:             ttl,
		CleanupInterval: cleanupInterval,
		MaxItems:        10000, // Default max items
	})
}

// NewCacheWithConfig creates a new cache with full configuration
func NewCacheWithConfig(cfg CacheConfig) *Cache {
	c := &Cache{
		items:    make(map[string]CacheEntry),
		ttl:      cfg.TTL,
		cleanup:  time.NewTicker(cfg.CleanupInterval),
		done:     make(chan struct{}),
		maxItems: cfg.MaxItems,
	}

	// Start cleanup goroutine
	go c.cleanupLoop()

	return c
}

// cleanupLoop periodically removes expired entries
func (c *Cache) cleanupLoop() {
	for {
		select {
		case <-c.cleanup.C:
			c.deleteExpired()
		case <-c.done:
			c.cleanup.Stop()
			return
		}
	}
}

// deleteExpired removes all expired entries
func (c *Cache) deleteExpired() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, entry := range c.items {
		if now.After(entry.Expiration) {
			delete(c.items, key)
		}
	}
}

// evictOldest removes the oldest entries if cache exceeds max size
// Must be called with lock held
func (c *Cache) evictOldest() {
	if c.maxItems <= 0 || len(c.items) < c.maxItems {
		return
	}

	// Find and remove oldest entries (up to 10% of max to avoid frequent evictions)
	toRemove := len(c.items) - c.maxItems + (c.maxItems / 10)
	if toRemove <= 0 {
		toRemove = 1
	}

	// Simple eviction: remove expired first, then oldest
	now := time.Now()
	removed := 0

	// First pass: remove expired
	for key, entry := range c.items {
		if removed >= toRemove {
			break
		}
		if now.After(entry.Expiration) {
			delete(c.items, key)
			removed++
		}
	}

	// Second pass: remove oldest by expiration time if still need to evict
	if removed < toRemove {
		type keyExp struct {
			key string
			exp time.Time
		}
		var oldest []keyExp
		for key, entry := range c.items {
			oldest = append(oldest, keyExp{key, entry.Expiration})
		}
		// Sort by expiration (oldest first) - simple bubble for small evictions
		for i := 0; i < len(oldest)-1 && removed < toRemove; i++ {
			minIdx := i
			for j := i + 1; j < len(oldest); j++ {
				if oldest[j].exp.Before(oldest[minIdx].exp) {
					minIdx = j
				}
			}
			if minIdx != i {
				oldest[i], oldest[minIdx] = oldest[minIdx], oldest[i]
			}
			delete(c.items, oldest[i].key)
			removed++
		}
	}
}

// Set adds an item to the cache
func (c *Cache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Evict if necessary before adding
	c.evictOldest()

	c.items[key] = CacheEntry{
		Value:      value,
		Expiration: time.Now().Add(c.ttl),
	}
}

// SetWithTTL adds an item to the cache with a custom TTL
func (c *Cache) SetWithTTL(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Evict if necessary before adding
	c.evictOldest()

	c.items[key] = CacheEntry{
		Value:      value,
		Expiration: time.Now().Add(ttl),
	}
}

// Get retrieves an item from the cache
func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.items[key]
	if !exists {
		return nil, false
	}

	if time.Now().After(entry.Expiration) {
		return nil, false
	}

	return entry.Value, true
}

// Delete removes an item from the cache
func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// DeleteByPrefix removes all items with keys starting with the prefix
func (c *Cache) DeleteByPrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.items {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.items, key)
		}
	}
}

// Clear removes all items from the cache
func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]CacheEntry)
}

// Stop stops the cleanup goroutine safely
// It's safe to call Stop multiple times
func (c *Cache) Stop() {
	// Use atomic to prevent double-close panic
	if c.stopped.CompareAndSwap(false, true) {
		close(c.done)
	}
}

// IsStopped returns whether the cache has been stopped
func (c *Cache) IsStopped() bool {
	return c.stopped.Load()
}

// Stats returns cache statistics
func (c *Cache) Stats() (count int, expired int) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	now := time.Now()
	for _, entry := range c.items {
		count++
		if now.After(entry.Expiration) {
			expired++
		}
	}
	return
}
