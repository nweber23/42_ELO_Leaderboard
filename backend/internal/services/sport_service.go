package services

import (
	"database/sql"
	"fmt"
	"sync"
	"time"
)

// Sport represents a sport configuration from the database
type Sport struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	IconURL     *string   `json:"icon_url,omitempty"`
	DefaultELO  int       `json:"default_elo"`
	KFactor     int       `json:"k_factor"`
	MinScore    int       `json:"min_score"`
	MaxScore    int       `json:"max_score"`
	IsActive    bool      `json:"is_active"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// SportService manages sport configurations with in-memory caching
type SportService struct {
	db           *sql.DB
	cache        map[string]*Sport
	cacheList    []*Sport
	cacheMutex   sync.RWMutex
	cacheExpiry  time.Time
	cacheTTL     time.Duration
}

// NewSportService creates a new SportService instance
func NewSportService(db *sql.DB) *SportService {
	return &SportService{
		db:       db,
		cache:    make(map[string]*Sport),
		cacheTTL: 5 * time.Minute,
	}
}

// GetSport retrieves a sport by ID, returning nil if not found or inactive
func (s *SportService) GetSport(sportID string) (*Sport, error) {
	if err := s.ensureCacheFresh(); err != nil {
		return nil, err
	}

	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	sport, exists := s.cache[sportID]
	if !exists {
		return nil, fmt.Errorf("sport not found: %s", sportID)
	}

	if !sport.IsActive {
		return nil, fmt.Errorf("sport is not active: %s", sportID)
	}

	return sport, nil
}

// GetAllActiveSports returns all active sports sorted by sort_order
func (s *SportService) GetAllActiveSports() ([]*Sport, error) {
	if err := s.ensureCacheFresh(); err != nil {
		return nil, err
	}

	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	var activeSports []*Sport
	for _, sport := range s.cacheList {
		if sport.IsActive {
			activeSports = append(activeSports, sport)
		}
	}

	return activeSports, nil
}

// ValidateSportID checks if a sport ID is valid and active
func (s *SportService) ValidateSportID(sportID string) error {
	_, err := s.GetSport(sportID)
	return err
}

// GetKFactor returns the K-factor for a sport, or the default if not found
func (s *SportService) GetKFactor(sportID string) int {
	sport, err := s.GetSport(sportID)
	if err != nil {
		return 32 // Default K-factor
	}
	return sport.KFactor
}

// GetDefaultELO returns the default ELO for a sport
func (s *SportService) GetDefaultELO(sportID string) int {
	sport, err := s.GetSport(sportID)
	if err != nil {
		return 1000 // Default starting ELO
	}
	return sport.DefaultELO
}

// ensureCacheFresh refreshes the cache if it has expired
func (s *SportService) ensureCacheFresh() error {
	s.cacheMutex.RLock()
	if time.Now().Before(s.cacheExpiry) && len(s.cache) > 0 {
		s.cacheMutex.RUnlock()
		return nil
	}
	s.cacheMutex.RUnlock()

	return s.refreshCache()
}

// refreshCache loads all sports from the database into the cache
func (s *SportService) refreshCache() error {
	s.cacheMutex.Lock()
	defer s.cacheMutex.Unlock()

	// Double-check after acquiring write lock
	if time.Now().Before(s.cacheExpiry) && len(s.cache) > 0 {
		return nil
	}

	query := `
		SELECT id, name, display_name, icon_url, default_elo, k_factor,
		       min_score, max_score, is_active, sort_order, created_at, updated_at
		FROM sports
		ORDER BY sort_order, name
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return fmt.Errorf("failed to load sports: %w", err)
	}
	defer rows.Close()

	newCache := make(map[string]*Sport)
	var newCacheList []*Sport

	for rows.Next() {
		sport := &Sport{}
		if err := rows.Scan(
			&sport.ID,
			&sport.Name,
			&sport.DisplayName,
			&sport.IconURL,
			&sport.DefaultELO,
			&sport.KFactor,
			&sport.MinScore,
			&sport.MaxScore,
			&sport.IsActive,
			&sport.SortOrder,
			&sport.CreatedAt,
			&sport.UpdatedAt,
		); err != nil {
			return fmt.Errorf("failed to scan sport: %w", err)
		}

		newCache[sport.ID] = sport
		newCacheList = append(newCacheList, sport)
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("error iterating sports: %w", err)
	}

	s.cache = newCache
	s.cacheList = newCacheList
	s.cacheExpiry = time.Now().Add(s.cacheTTL)

	return nil
}

// InvalidateCache forces a cache refresh on the next request
func (s *SportService) InvalidateCache() {
	s.cacheMutex.Lock()
	defer s.cacheMutex.Unlock()
	s.cacheExpiry = time.Time{} // Set to zero time to force refresh
}
