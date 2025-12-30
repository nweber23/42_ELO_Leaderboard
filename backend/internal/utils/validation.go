package utils

import (
	"fmt"
	"regexp"
	"strings"
	"unicode/utf8"
)

// Validation limits
const (
	MinScoreValue    = 0
	MaxScoreValue    = 999 // Reasonable max score for table tennis/football
	MinUserIDValue   = 1
	MaxReasonLength  = 500
	MinReasonLength  = 5
)

// ValidationError represents a validation error with field information
type InputValidationError struct {
	Field   string
	Message string
}

func (e *InputValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidateMatchSubmission validates match submission input beyond struct tags
func ValidateMatchSubmission(sport string, opponentID, playerScore, opponentScore, submitterID int) error {
	// Validate sport
	if sport != "table_tennis" && sport != "table_football" {
		return &InputValidationError{Field: "sport", Message: "must be 'table_tennis' or 'table_football'"}
	}

	// Validate opponent ID
	if opponentID < MinUserIDValue {
		return &InputValidationError{Field: "opponent_id", Message: "must be a positive integer"}
	}

	// Cannot play against yourself
	if opponentID == submitterID {
		return &InputValidationError{Field: "opponent_id", Message: "cannot submit a match against yourself"}
	}

	// Validate scores
	if playerScore < MinScoreValue || playerScore > MaxScoreValue {
		return &InputValidationError{Field: "player_score", Message: fmt.Sprintf("must be between %d and %d", MinScoreValue, MaxScoreValue)}
	}

	if opponentScore < MinScoreValue || opponentScore > MaxScoreValue {
		return &InputValidationError{Field: "opponent_score", Message: fmt.Sprintf("must be between %d and %d", MinScoreValue, MaxScoreValue)}
	}

	// Scores cannot be equal (someone must win)
	if playerScore == opponentScore {
		return &InputValidationError{Field: "score", Message: "scores cannot be equal - someone must win"}
	}

	return nil
}

// ValidateComment validates comment content beyond basic length checks
func ValidateComment(content string) (string, error) {
	// Check for empty after trimming
	content = strings.TrimSpace(content)
	if content == "" {
		return "", &InputValidationError{Field: "content", Message: "cannot be empty"}
	}

	// Check UTF-8 validity
	if !utf8.ValidString(content) {
		return "", &InputValidationError{Field: "content", Message: "must be valid UTF-8"}
	}

	// Check length
	if len(content) > MaxCommentLength {
		return "", &InputValidationError{Field: "content", Message: fmt.Sprintf("must be at most %d characters", MaxCommentLength)}
	}

	// Check for dangerous unicode
	if containsDangerousUnicode(content) {
		return "", &InputValidationError{Field: "content", Message: "contains invalid characters"}
	}

	// Sanitize the content
	sanitized := SanitizeString(content)
	if len(sanitized) == 0 {
		return "", &InputValidationError{Field: "content", Message: "cannot be empty after sanitization"}
	}

	return sanitized, nil
}

// ValidateReason validates admin action reasons
func ValidateReason(reason string) error {
	reason = strings.TrimSpace(reason)

	if len(reason) < MinReasonLength {
		return &InputValidationError{Field: "reason", Message: fmt.Sprintf("must be at least %d characters", MinReasonLength)}
	}

	if len(reason) > MaxReasonLength {
		return &InputValidationError{Field: "reason", Message: fmt.Sprintf("must be at most %d characters", MaxReasonLength)}
	}

	if !utf8.ValidString(reason) {
		return &InputValidationError{Field: "reason", Message: "must be valid UTF-8"}
	}

	if containsDangerousUnicode(reason) {
		return &InputValidationError{Field: "reason", Message: "contains invalid characters"}
	}

	return nil
}

// ValidateELOAdjustment validates ELO adjustment request
func ValidateELOAdjustment(userID int, sport string, newELO int, reason string, adminID int) error {
	// Cannot adjust own ELO
	if userID == adminID {
		return &InputValidationError{Field: "user_id", Message: "cannot adjust your own ELO"}
	}

	// Validate user ID
	if userID < MinUserIDValue {
		return &InputValidationError{Field: "user_id", Message: "must be a positive integer"}
	}

	// Validate sport
	if sport != "table_tennis" && sport != "table_football" {
		return &InputValidationError{Field: "sport", Message: "must be 'table_tennis' or 'table_football'"}
	}

	// Validate ELO range
	if newELO < 0 || newELO > 5000 {
		return &InputValidationError{Field: "new_elo", Message: "must be between 0 and 5000"}
	}

	// Validate reason
	return ValidateReason(reason)
}

// ValidateUserID validates a user ID
func ValidateUserID(userID int) error {
	if userID < MinUserIDValue {
		return &InputValidationError{Field: "user_id", Message: "must be a positive integer"}
	}
	return nil
}

// ValidateMatchID validates a match ID
func ValidateMatchID(matchID int) error {
	if matchID < 1 {
		return &InputValidationError{Field: "match_id", Message: "must be a positive integer"}
	}
	return nil
}

// ValidateStatus validates match status
func ValidateStatus(status string) error {
	validStatuses := map[string]bool{
		"pending":   true,
		"confirmed": true,
		"denied":    true,
		"cancelled": true,
		"disputed":  true,
	}

	if !validStatuses[status] {
		return &InputValidationError{Field: "status", Message: "must be one of: pending, confirmed, denied, cancelled, disputed"}
	}
	return nil
}

// ValidateLogin validates a login/username string
func ValidateLogin(login string) error {
	login = strings.TrimSpace(login)

	if len(login) == 0 {
		return &InputValidationError{Field: "login", Message: "cannot be empty"}
	}

	if len(login) > 50 {
		return &InputValidationError{Field: "login", Message: "must be at most 50 characters"}
	}

	// Only allow alphanumeric, underscore, and hyphen
	validLogin := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
	if !validLogin.MatchString(login) {
		return &InputValidationError{Field: "login", Message: "can only contain letters, numbers, underscores, and hyphens"}
	}

	return nil
}

// ValidateEditMatchRequest validates edit match request
func ValidateEditMatchRequest(player1Score, player2Score *int, status *string) error {
	if player1Score != nil {
		if *player1Score < MinScoreValue || *player1Score > MaxScoreValue {
			return &InputValidationError{Field: "player1_score", Message: fmt.Sprintf("must be between %d and %d", MinScoreValue, MaxScoreValue)}
		}
	}

	if player2Score != nil {
		if *player2Score < MinScoreValue || *player2Score > MaxScoreValue {
			return &InputValidationError{Field: "player2_score", Message: fmt.Sprintf("must be between %d and %d", MinScoreValue, MaxScoreValue)}
		}
	}

	// If both scores are provided, they cannot be equal
	if player1Score != nil && player2Score != nil && *player1Score == *player2Score {
		return &InputValidationError{Field: "score", Message: "scores cannot be equal - someone must win"}
	}

	if status != nil {
		return ValidateStatus(*status)
	}

	return nil
}
