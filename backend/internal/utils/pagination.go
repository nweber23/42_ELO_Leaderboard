package utils

import (
	"strconv"
)

// Pagination limits
const (
	DefaultLimit    = 20
	MaxLimit        = 100
	DefaultOffset   = 0
	MaxOffset       = 10000 // Prevent excessive offset values that could cause performance issues
)

// PaginationParams holds validated pagination parameters
type PaginationParams struct {
	Limit  int
	Offset int
}

// ParsePagination parses and validates pagination query parameters
// It enforces maximum limits to prevent abuse
func ParsePagination(limitStr, offsetStr string) PaginationParams {
	params := PaginationParams{
		Limit:  DefaultLimit,
		Offset: DefaultOffset,
	}

	// Parse limit
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			if l > 0 && l <= MaxLimit {
				params.Limit = l
			} else if l > MaxLimit {
				params.Limit = MaxLimit // Cap at maximum
			}
		}
	}

	// Parse offset
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil {
			if o >= 0 && o <= MaxOffset {
				params.Offset = o
			} else if o > MaxOffset {
				params.Offset = MaxOffset // Cap at maximum
			}
		}
	}

	return params
}

// ParsePaginationWithDefaults parses pagination with custom defaults
func ParsePaginationWithDefaults(limitStr, offsetStr string, defaultLimit, maxLimit int) PaginationParams {
	params := PaginationParams{
		Limit:  defaultLimit,
		Offset: DefaultOffset,
	}

	// Parse limit
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			if l > 0 && l <= maxLimit {
				params.Limit = l
			} else if l > maxLimit {
				params.Limit = maxLimit
			}
		}
	}

	// Parse offset
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil {
			if o >= 0 && o <= MaxOffset {
				params.Offset = o
			} else if o > MaxOffset {
				params.Offset = MaxOffset
			}
		}
	}

	return params
}

// ValidatePaginationParams validates pagination parameters and returns an error message if invalid
func ValidatePaginationParams(limit, offset int) string {
	if limit < 0 {
		return "limit must be non-negative"
	}
	if limit > MaxLimit {
		return "limit exceeds maximum allowed value"
	}
	if offset < 0 {
		return "offset must be non-negative"
	}
	if offset > MaxOffset {
		return "offset exceeds maximum allowed value"
	}
	return ""
}
