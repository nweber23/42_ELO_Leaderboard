package services

import "math"

type ELOService struct {
	kFactor int
}

func NewELOService(kFactor int) *ELOService {
	return &ELOService{kFactor: kFactor}
}

// CalculateELO calculates new ELO ratings after a match
// Returns: player1NewELO, player2NewELO, player1Delta, player2Delta
func (s *ELOService) CalculateELO(player1ELO, player2ELO int, player1Won bool) (int, int, int, int) {
	// Expected scores
	expectedPlayer1 := s.expectedScore(player1ELO, player2ELO)
	expectedPlayer2 := s.expectedScore(player2ELO, player1ELO)

	// Actual scores
	var actualPlayer1, actualPlayer2 float64
	if player1Won {
		actualPlayer1 = 1.0
		actualPlayer2 = 0.0
	} else {
		actualPlayer1 = 0.0
		actualPlayer2 = 1.0
	}

	// Calculate new ratings
	player1Delta := int(float64(s.kFactor) * (actualPlayer1 - expectedPlayer1))
	player2Delta := int(float64(s.kFactor) * (actualPlayer2 - expectedPlayer2))

	player1NewELO := player1ELO + player1Delta
	player2NewELO := player2ELO + player2Delta

	return player1NewELO, player2NewELO, player1Delta, player2Delta
}

// expectedScore calculates the expected score for a player
// Formula: E = 1 / (1 + 10^((opponentELO - playerELO) / 400))
func (s *ELOService) expectedScore(playerELO, opponentELO int) float64 {
	return 1.0 / (1.0 + math.Pow(10, float64(opponentELO-playerELO)/400.0))
}
