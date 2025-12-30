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
	MaxEmojiLength       = 20 // Compound emojis can be longer
)

// AllowedEmojis is the whitelist of allowed emoji reactions
// Using a whitelist instead of complex unicode validation is more secure
// and easier to maintain
var AllowedEmojis = map[string]bool{
	// Common reaction emojis
	"👍": true, // thumbs up
	"👎": true, // thumbs down
	"❤️": true, // red heart
	"🎉": true, // party popper
	"🔥": true, // fire
	"😂": true, // face with tears of joy
	"😍": true, // smiling face with heart-eyes
	"🤔": true, // thinking face
	"😮": true, // face with open mouth
	"😢": true, // crying face
	"😡": true, // angry face
	"👏": true, // clapping hands
	"🙌": true, // raising hands
	"💪": true, // flexed biceps
	"🏆": true, // trophy
	"🥇": true, // 1st place medal
	"🥈": true, // 2nd place medal
	"🥉": true, // 3rd place medal
	"⭐": true, // star
	"🌟": true, // glowing star
	"💯": true, // hundred points
	"✅": true, // check mark
	"❌": true, // cross mark
	"🎯": true, // direct hit
	"🏓": true, // ping pong (table tennis)
	"⚽": true, // soccer ball (table football)
	"🎮": true, // video game
	"🤝": true, // handshake
	"👀": true, // eyes
	"💀": true, // skull
	"🤯": true, // exploding head
	"🫡": true, // saluting face
	"🤡": true, // clown face
	"😎": true, // smiling face with sunglasses
	"🥳": true, // partying face
	"😤": true, // face with steam from nose
	"🙏": true, // folded hands
	"💔": true, // broken heart
	"🤣": true, // rolling on the floor laughing
	"😭": true, // loudly crying face
	"🫠": true, // melting face
}

// ValidateEmojiWhitelist checks if the emoji is in the allowed whitelist
// This is the preferred method for emoji validation as it's simpler and more secure
func ValidateEmojiWhitelist(emoji string) bool {
	return AllowedEmojis[emoji]
}

// GetAllowedEmojis returns a slice of all allowed emojis
func GetAllowedEmojis() []string {
	emojis := make([]string, 0, len(AllowedEmojis))
	for emoji := range AllowedEmojis {
		emojis = append(emojis, emoji)
	}
	return emojis
}

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

// ValidateEmoji checks if the input is a valid emoji string
// Prevents abuse by limiting emoji length and blocking dangerous unicode sequences
func ValidateEmoji(emoji string) bool {
	// Emoji should be 1-20 bytes (compound emojis with ZWJ can be longer)
	if len(emoji) == 0 || len(emoji) > MaxEmojiLength {
		return false
	}

	// Must be valid UTF-8
	if !utf8.ValidString(emoji) {
		return false
	}

	// Check for dangerous unicode sequences
	if containsDangerousUnicode(emoji) {
		return false
	}

	// Check that it contains at least one emoji-like character
	hasEmoji := false
	for _, r := range emoji {
		// Common emoji ranges
		if isEmojiRune(r) {
			hasEmoji = true
		} else if !isEmojiModifier(r) {
			// Contains non-emoji, non-modifier character
			return false
		}
	}

	return hasEmoji
}

// isEmojiRune checks if a rune is in an emoji range
func isEmojiRune(r rune) bool {
	return (r >= 0x1F300 && r <= 0x1F9FF) || // Miscellaneous Symbols and Pictographs, Emoticons, etc.
		(r >= 0x2600 && r <= 0x26FF) || // Miscellaneous Symbols
		(r >= 0x2700 && r <= 0x27BF) || // Dingbats
		(r >= 0x1F600 && r <= 0x1F64F) || // Emoticons
		(r >= 0x1F680 && r <= 0x1F6FF) || // Transport and Map Symbols
		(r >= 0x1FA00 && r <= 0x1FAFF) || // Chess, extended-A symbols
		(r >= 0x1F1E0 && r <= 0x1F1FF) // Regional indicator symbols (flags)
}

// isEmojiModifier checks if a rune is a valid emoji modifier
func isEmojiModifier(r rune) bool {
	return r == 0x200D || // Zero Width Joiner (ZWJ)
		r == 0xFE0F || // Variation Selector-16 (emoji presentation)
		r == 0xFE0E || // Variation Selector-15 (text presentation)
		(r >= 0x1F3FB && r <= 0x1F3FF) // Skin tone modifiers
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

