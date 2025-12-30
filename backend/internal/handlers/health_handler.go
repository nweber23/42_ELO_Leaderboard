package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db        *sql.DB
	startTime time.Time
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{
		db:        db,
		startTime: time.Now(),
	}
}

// HealthStatus represents the overall health status
type HealthStatus struct {
	Status      string                   `json:"status"`
	Timestamp   time.Time                `json:"timestamp"`
	Uptime      string                   `json:"uptime"`
	Version     string                   `json:"version,omitempty"`
	Checks      map[string]CheckResult   `json:"checks"`
}

// CheckResult represents the result of a single health check
type CheckResult struct {
	Status   string      `json:"status"`
	Message  string      `json:"message,omitempty"`
	Duration int64       `json:"duration_ms"`
	Details  interface{} `json:"details,omitempty"`
}

// HealthCheckStatus constants
const (
	StatusHealthy   = "healthy"
	StatusUnhealthy = "unhealthy"
	StatusDegraded  = "degraded"
)

// Liveness returns a simple liveness check
// Used by Kubernetes/Docker to determine if the container is alive
// This should always return 200 unless the application is completely dead
func (h *HealthHandler) Liveness(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": StatusHealthy,
		"timestamp": time.Now().UTC(),
	})
}

// Readiness returns a readiness check
// Used by Kubernetes/Docker to determine if the container is ready to accept traffic
// This checks if all dependencies are available
func (h *HealthHandler) Readiness(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	checks := make(map[string]CheckResult)
	overallStatus := StatusHealthy

	// Check database
	dbCheck := h.checkDatabase(ctx)
	checks["database"] = dbCheck
	if dbCheck.Status != StatusHealthy {
		overallStatus = StatusUnhealthy
	}

	statusCode := http.StatusOK
	if overallStatus == StatusUnhealthy {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, HealthStatus{
		Status:    overallStatus,
		Timestamp: time.Now().UTC(),
		Uptime:    time.Since(h.startTime).String(),
		Checks:    checks,
	})
}

// Health returns a comprehensive health check
// Includes detailed information about all dependencies
func (h *HealthHandler) Health(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	checks := make(map[string]CheckResult)
	overallStatus := StatusHealthy

	// Check database
	dbCheck := h.checkDatabase(ctx)
	checks["database"] = dbCheck
	if dbCheck.Status != StatusHealthy {
		overallStatus = StatusUnhealthy
	}

	// Check database connection pool
	poolCheck := h.checkConnectionPool()
	checks["connection_pool"] = poolCheck
	if poolCheck.Status == StatusUnhealthy {
		overallStatus = StatusUnhealthy
	} else if poolCheck.Status == StatusDegraded && overallStatus == StatusHealthy {
		overallStatus = StatusDegraded
	}

	// Check memory usage
	memCheck := h.checkMemory()
	checks["memory"] = memCheck
	if memCheck.Status == StatusDegraded && overallStatus == StatusHealthy {
		overallStatus = StatusDegraded
	}

	// Check goroutines
	goroutineCheck := h.checkGoroutines()
	checks["goroutines"] = goroutineCheck
	if goroutineCheck.Status == StatusDegraded && overallStatus == StatusHealthy {
		overallStatus = StatusDegraded
	}

	statusCode := http.StatusOK
	if overallStatus == StatusUnhealthy {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, HealthStatus{
		Status:    overallStatus,
		Timestamp: time.Now().UTC(),
		Uptime:    time.Since(h.startTime).String(),
		Checks:    checks,
	})
}

// checkDatabase checks database connectivity
func (h *HealthHandler) checkDatabase(ctx context.Context) CheckResult {
	start := time.Now()

	err := h.db.PingContext(ctx)
	duration := time.Since(start)

	if err != nil {
		return CheckResult{
			Status:   StatusUnhealthy,
			Message:  "Database connection failed",
			Duration: duration.Milliseconds(),
			Details: map[string]interface{}{
				"error": err.Error(),
			},
		}
	}

	// Check if we can execute a simple query
	var result int
	err = h.db.QueryRowContext(ctx, "SELECT 1").Scan(&result)
	queryDuration := time.Since(start)

	if err != nil {
		return CheckResult{
			Status:   StatusUnhealthy,
			Message:  "Database query failed",
			Duration: queryDuration.Milliseconds(),
			Details: map[string]interface{}{
				"error": err.Error(),
			},
		}
	}

	// Warn if query is slow (> 100ms)
	status := StatusHealthy
	message := "Database is responsive"
	if queryDuration > 100*time.Millisecond {
		status = StatusDegraded
		message = "Database query is slow"
	}

	return CheckResult{
		Status:   status,
		Message:  message,
		Duration: queryDuration.Milliseconds(),
	}
}

// checkConnectionPool checks database connection pool health
func (h *HealthHandler) checkConnectionPool() CheckResult {
	stats := h.db.Stats()

	// Calculate usage percentage
	maxConns := stats.MaxOpenConnections
	openConns := stats.OpenConnections
	inUse := stats.InUse
	idle := stats.Idle

	usagePercent := 0.0
	if maxConns > 0 {
		usagePercent = float64(inUse) / float64(maxConns) * 100
	}

	status := StatusHealthy
	message := "Connection pool is healthy"

	if usagePercent > 90 {
		status = StatusDegraded
		message = "Connection pool usage is high"
	}

	if stats.WaitCount > 0 && stats.WaitDuration > 5*time.Second {
		status = StatusDegraded
		message = "Connection pool has significant wait times"
	}

	return CheckResult{
		Status:   status,
		Message:  message,
		Duration: 0,
		Details: map[string]interface{}{
			"max_connections":  maxConns,
			"open_connections": openConns,
			"in_use":           inUse,
			"idle":             idle,
			"wait_count":       stats.WaitCount,
			"wait_duration":    stats.WaitDuration.String(),
			"usage_percent":    usagePercent,
		},
	}
}

// checkMemory checks memory usage
func (h *HealthHandler) checkMemory() CheckResult {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// Convert to MB for readability
	allocMB := float64(m.Alloc) / 1024 / 1024
	totalAllocMB := float64(m.TotalAlloc) / 1024 / 1024
	sysMB := float64(m.Sys) / 1024 / 1024

	status := StatusHealthy
	message := "Memory usage is normal"

	// Warn if using more than 80% of system memory or more than 1GB
	if allocMB > 1024 || sysMB > 2048 {
		status = StatusDegraded
		message = "Memory usage is high"
	}

	return CheckResult{
		Status:   status,
		Message:  message,
		Duration: 0,
		Details: map[string]interface{}{
			"alloc_mb":       allocMB,
			"total_alloc_mb": totalAllocMB,
			"sys_mb":         sysMB,
			"num_gc":         m.NumGC,
			"gc_pause_total": time.Duration(m.PauseTotalNs).String(),
		},
	}
}

// checkGoroutines checks goroutine count
func (h *HealthHandler) checkGoroutines() CheckResult {
	count := runtime.NumGoroutine()

	status := StatusHealthy
	message := "Goroutine count is normal"

	// Warn if we have too many goroutines
	if count > 10000 {
		status = StatusDegraded
		message = "High number of goroutines - possible leak"
	}

	return CheckResult{
		Status:   status,
		Message:  message,
		Duration: 0,
		Details: map[string]interface{}{
			"count": count,
		},
	}
}
