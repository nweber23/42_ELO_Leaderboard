package models

import "time"

// Sport types
const (
	SportTableTennis   = "table_tennis"
	SportTableFootball = "table_football"
)

// Match status types
const (
	StatusPending   = "pending"
	StatusConfirmed = "confirmed"
	StatusDenied    = "denied"
)

// User represents a 42 student
type User struct {
	ID               int       `json:"id"`
	IntraID          int       `json:"intra_id"`
	Login            string    `json:"login"`
	DisplayName      string    `json:"display_name"`
	AvatarURL        string    `json:"avatar_url"`
	Campus           string    `json:"campus"`
	TableTennisELO   int       `json:"table_tennis_elo"`
	TableFootballELO int       `json:"table_football_elo"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// Match represents a game between two players
type Match struct {
	ID               int        `json:"id"`
	Sport            string     `json:"sport"`
	Player1ID        int        `json:"player1_id"`
	Player2ID        int        `json:"player2_id"`
	Player1Score     int        `json:"player1_score"`
	Player2Score     int        `json:"player2_score"`
	WinnerID         int        `json:"winner_id"`
	Status           string     `json:"status"`
	Player1ELOBefore *int       `json:"player1_elo_before,omitempty"`
	Player1ELOAfter  *int       `json:"player1_elo_after,omitempty"`
	Player1ELODelta  *int       `json:"player1_elo_delta,omitempty"`
	Player2ELOBefore *int       `json:"player2_elo_before,omitempty"`
	Player2ELOAfter  *int       `json:"player2_elo_after,omitempty"`
	Player2ELODelta  *int       `json:"player2_elo_delta,omitempty"`
	SubmittedBy      int        `json:"submitted_by"`
	ConfirmedAt      *time.Time `json:"confirmed_at,omitempty"`
	DeniedAt         *time.Time `json:"denied_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// MatchWithPlayers includes player details
type MatchWithPlayers struct {
	Match
	Player1      User `json:"player1"`
	Player2      User `json:"player2"`
	Winner       User `json:"winner"`
	SubmittedBy_ User `json:"submitted_by_user"`
}

// Reaction represents an emoji reaction to a match
type Reaction struct {
	ID        int       `json:"id"`
	MatchID   int       `json:"match_id"`
	UserID    int       `json:"user_id"`
	Emoji     string    `json:"emoji"`
	CreatedAt time.Time `json:"created_at"`
}

// Comment represents a comment on a match
type Comment struct {
	ID        int       `json:"id"`
	MatchID   int       `json:"match_id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CommentWithUser includes user details
type CommentWithUser struct {
	Comment
	User User `json:"user"`
}

// LeaderboardEntry represents a player's rank
type LeaderboardEntry struct {
	Rank         int    `json:"rank"`
	User         User   `json:"user"`
	ELO          int    `json:"elo"`
	MatchesPlayed int   `json:"matches_played"`
	Wins         int    `json:"wins"`
	Losses       int    `json:"losses"`
	WinRate      float64 `json:"win_rate"`
}

// PlayerStats represents detailed statistics for a player
type PlayerStats struct {
	User              User   `json:"user"`
	Sport             string `json:"sport"`
	CurrentELO        int    `json:"current_elo"`
	HighestELO        int    `json:"highest_elo"`
	TotalMatches      int    `json:"total_matches"`
	Wins              int    `json:"wins"`
	Losses            int    `json:"losses"`
	WinRate           float64 `json:"win_rate"`
	CurrentWinStreak  int    `json:"current_win_streak"`
	LongestWinStreak  int    `json:"longest_win_streak"`
	MostPlayedRival   *User  `json:"most_played_rival,omitempty"`
	RivalMatchCount   int    `json:"rival_match_count"`
}

// SubmitMatchRequest is the request body for submitting a match
type SubmitMatchRequest struct {
	Sport        string `json:"sport" binding:"required,oneof=table_tennis table_football"`
	OpponentID   int    `json:"opponent_id" binding:"required,min=1"`
	PlayerScore  int    `json:"player_score" binding:"required,min=0"`
	OpponentScore int   `json:"opponent_score" binding:"required,min=0"`
}

// AddReactionRequest is the request body for adding a reaction
type AddReactionRequest struct {
	Emoji string `json:"emoji" binding:"required,max=10"`
}

// AddCommentRequest is the request body for adding a comment
type AddCommentRequest struct {
	Content string `json:"content" binding:"required,max=500"`
}
