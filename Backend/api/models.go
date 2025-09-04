package api

import "time"

type Player struct {
	ID              int       `json:"id"`
	Login           string    `json:"login"`
	Name            string    `json:"name"`
	FirstName       string    `json:"first_name"`
	LastName        string    `json:"last_name"`
	Email           string    `json:"email"`
	ImageURL        string    `json:"image_url"`
	Campus          string    `json:"campus"`
	TableTennisELO  int       `json:"table_tennis_elo"`
	FoosballELO     int       `json:"foosball_elo"`
	ELO             int       `json:"elo"` // Keep for backward compatibility
	Wins            int       `json:"wins"`
	Losses          int       `json:"losses"`
	Draws           int       `json:"draws"`
	GamesPlayed     int       `json:"games_played"`
	GamesWon        int       `json:"games_won"`
	GamesLost       int       `json:"games_lost"`
	WinRate         float64   `json:"win_rate"`
	Rank            int       `json:"rank"`
	LastActive      time.Time `json:"last_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	Created         string    `json:"created"`  // Keep for backward compatibility
	LastGame        string    `json:"last_game"` // Keep for backward compatibility
}

type Match struct {
	ID        int    `json:"id"`
	Player1ID int    `json:"player1_id"`
	Player2ID int    `json:"player2_id"`
	Player1   Player `json:"player1"`
	Player2   Player `json:"player2"`
	Result    string `json:"result"` // "player1_wins", "player2_wins", "draw"
	Player1ELOBefore int `json:"player1_elo_before"`
	Player2ELOBefore int `json:"player2_elo_before"`
	Player1ELOAfter  int `json:"player1_elo_after"`
	Player2ELOAfter  int `json:"player2_elo_after"`
	PlayedAt  string `json:"played_at"`
}

type LeaderboardEntry struct {
	Rank     int    `json:"rank"`
	Player   Player `json:"player"`
	Games    int    `json:"games"`
	WinRate  float64 `json:"win_rate"`
}

type Stats struct {
	TotalPlayers int     `json:"total_players"`
	TotalMatches int     `json:"total_matches"`
	AvgELO       float64 `json:"avg_elo"`
	TopPlayer    Player  `json:"top_player"`
}