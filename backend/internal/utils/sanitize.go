package utils

import (
	"html"
	"strings"
	"unicode"
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

// ValidateEmoji checks if the input is a valid emoji string
// Prevents abuse by limiting emoji length and characters
func ValidateEmoji(emoji string) bool {
	// Emoji should be 1-10 bytes (typical emojis are 4 bytes, some compound emojis can be longer)
	if len(emoji) == 0 || len(emoji) > 10 {
		return false
	}

	// Check that it contains at least one emoji-like character
	// This is a basic check - emojis are in specific Unicode ranges
	for _, r := range emoji {
		// Common emoji ranges
		if (r >= 0x1F300 && r <= 0x1F9FF) || // Miscellaneous Symbols and Pictographs, Emoticons, etc.
			(r >= 0x2600 && r <= 0x26FF) || // Miscellaneous Symbols
			(r >= 0x2700 && r <= 0x27BF) || // Dingbats
			(r >= 0x1F600 && r <= 0x1F64F) { // Emoticons
			return true
		}
	}

	return false
}
