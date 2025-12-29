package cache

import (
	"sync"
	"time"
)

// CacheEntry represents a cached item with expiration
type CacheEntry struct {
	Value      interface{}
	Expiration time.Time
}

// Cache provides thread-safe in-memory caching
type Cache struct {
	mu      sync.RWMutex
	items   map[string]CacheEntry
	ttl     time.Duration
	cleanup *time.Ticker
	done    chan bool
}

// NewCache creates a new cache with the specified TTL and cleanup interval
func NewCache(ttl time.Duration, cleanupInterval time.Duration) *Cache {
	c := &Cache{
		items:   make(map[string]CacheEntry),
		ttl:     ttl,
		cleanup: time.NewTicker(cleanupInterval),
		done:    make(chan bool),
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

// Set adds an item to the cache
func (c *Cache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = CacheEntry{
		Value:      value,
		Expiration: time.Now().Add(c.ttl),
	}
}

// SetWithTTL adds an item to the cache with a custom TTL
func (c *Cache) SetWithTTL(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

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

// Stop stops the cleanup goroutine
func (c *Cache) Stop() {
	c.done <- true
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
