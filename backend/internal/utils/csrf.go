package utils

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
)

// CSRF-related errors
var (
	ErrInvalidCSRFToken = errors.New("invalid CSRF token")
	ErrCSRFTokenMissing = errors.New("CSRF token missing")
)

// GenerateCSRFToken generates a cryptographically secure random token
func GenerateCSRFToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// ConstantTimeCompare performs a constant-time comparison of two strings
// This prevents timing attacks where an attacker could determine the correct
// token by measuring response times
func ConstantTimeCompare(a, b string) bool {
	// Convert to byte slices for constant-time comparison
	aBytes := []byte(a)
	bBytes := []byte(b)

	// Use subtle.ConstantTimeCompare which is designed to take the same
	// amount of time regardless of whether the values match
	return subtle.ConstantTimeCompare(aBytes, bBytes) == 1
}

// ValidateCSRFToken validates a CSRF token using constant-time comparison
// expectedToken: the token stored in the session/cookie
// providedToken: the token provided in the request
func ValidateCSRFToken(expectedToken, providedToken string) error {
	if expectedToken == "" || providedToken == "" {
		return ErrCSRFTokenMissing
	}

	if !ConstantTimeCompare(expectedToken, providedToken) {
		return ErrInvalidCSRFToken
	}

	return nil
}
