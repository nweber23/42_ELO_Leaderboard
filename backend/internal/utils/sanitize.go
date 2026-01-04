package utils

import (
	"html"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

// MaxStringLength defines maximum lengths for different input types
const (
	MaxCommentLength     = 500
	MaxDisplayNameLength = 255
)




// SanitizeString removes potentially dangerous characters and normalizes whitespace
// Use this for user input like comments to prevent XSS and ensure clean data
func SanitizeString(s string) string {
	// Trim leading/trailing whitespace
	s = strings.TrimSpace(s)

	// Escape HTML entities to prevent XSS
	s = html.EscapeString(s)

	// Normalize internal whitespace (collapse multiple spaces to single space)
	var result strings.Builder
	lastWasSpace := false
	for _, r := range s {
		if unicode.IsSpace(r) {
			if !lastWasSpace {
				result.WriteRune(' ')
				lastWasSpace = true
			}
		} else {
			result.WriteRune(r)
			lastWasSpace = false
		}
	}

	return result.String()
}

// SanitizeStringWithLength sanitizes and validates string length
func SanitizeStringWithLength(s string, maxLength int) (string, bool) {
	sanitized := SanitizeString(s)
	if len(sanitized) > maxLength {
		return "", false
	}
	return sanitized, true
}



// containsDangerousUnicode checks for potentially dangerous unicode sequences
func containsDangerousUnicode(s string) bool {
	for _, r := range s {
		// Block bidirectional override characters (can be used for spoofing)
		if r >= 0x202A && r <= 0x202E {
			return true
		}
		// Block other potentially dangerous control characters
		if r >= 0x200B && r <= 0x200F && r != 0x200D { // Keep ZWJ (0x200D) for compound emojis
			return true
		}
		// Block invisible separators
		if r == 0x2028 || r == 0x2029 {
			return true
		}
		// Block unusual control characters
		if unicode.IsControl(r) && r != '\n' && r != '\r' && r != '\t' {
			return true
		}
	}
	return false
}

// ValidateInput performs comprehensive input validation
func ValidateInput(s string, maxLength int, allowNewlines bool) (string, error) {
	// Must be valid UTF-8
	if !utf8.ValidString(s) {
		return "", ErrInvalidUTF8
	}

	// Check for dangerous unicode
	if containsDangerousUnicode(s) {
		return "", ErrDangerousUnicode
	}

	// Sanitize
	sanitized := SanitizeString(s)

	// Preserve newlines if allowed (for multi-line comments)
	if allowNewlines {
		// Re-add newlines that were stripped
		sanitized = normalizeNewlines(s)
	}

	// Check length
	if len(sanitized) > maxLength {
		return "", ErrInputTooLong
	}

	if len(sanitized) == 0 {
		return "", ErrInputEmpty
	}

	return sanitized, nil
}

// normalizeNewlines keeps newlines but normalizes other whitespace
func normalizeNewlines(s string) string {
	s = strings.TrimSpace(s)
	s = html.EscapeString(s)

	// Replace CRLF with LF
	s = strings.ReplaceAll(s, "\r\n", "\n")
	// Replace CR with LF
	s = strings.ReplaceAll(s, "\r", "\n")

	// Limit consecutive newlines to 2
	re := regexp.MustCompile(`\n{3,}`)
	s = re.ReplaceAllString(s, "\n\n")

	return s
}

// Custom errors for input validation
type ValidationError string

func (e ValidationError) Error() string {
	return string(e)
}

const (
	ErrInvalidUTF8      = ValidationError("invalid UTF-8 encoding")
	ErrDangerousUnicode = ValidationError("input contains dangerous unicode sequences")
	ErrInputTooLong     = ValidationError("input exceeds maximum length")
	ErrInputEmpty       = ValidationError("input cannot be empty")
)

