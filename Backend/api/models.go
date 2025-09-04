package api

import "time"

type Player struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	ELO      int    `json:"elo"`
	Wins     int    `json:"wins"`
	Losses   int    `json:"losses"`
	Draws    int    `json:"draws"`
	Rank     int    `json:"rank"`
	Created  string `json:"created"`
	LastGame string `json:"last_game"`
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