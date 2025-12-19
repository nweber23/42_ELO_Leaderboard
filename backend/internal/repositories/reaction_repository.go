package repositories

import (
	"database/sql"

	"github.com/42heilbronn/elo-leaderboard/internal/models"
)

type ReactionRepository struct {
	db *sql.DB
}

func NewReactionRepository(db *sql.DB) *ReactionRepository {
	return &ReactionRepository{db: db}
}

// Add creates a new reaction
func (r *ReactionRepository) Add(reaction *models.Reaction) error {
	query := `
		INSERT INTO reactions (match_id, user_id, emoji)
		VALUES ($1, $2, $3)
		ON CONFLICT (match_id, user_id, emoji) DO NOTHING
		RETURNING id, created_at
	`

	return r.db.QueryRow(query, reaction.MatchID, reaction.UserID, reaction.Emoji).
		Scan(&reaction.ID, &reaction.CreatedAt)
}

// GetByMatchID retrieves all reactions for a match
func (r *ReactionRepository) GetByMatchID(matchID int) ([]models.Reaction, error) {
	query := `
		SELECT id, match_id, user_id, emoji, created_at
		FROM reactions
		WHERE match_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, matchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reactions []models.Reaction
	for rows.Next() {
		var reaction models.Reaction
		if err := rows.Scan(
			&reaction.ID,
			&reaction.MatchID,
			&reaction.UserID,
			&reaction.Emoji,
			&reaction.CreatedAt,
		); err != nil {
			return nil, err
		}
		reactions = append(reactions, reaction)
	}

	return reactions, rows.Err()
}

// Delete removes a reaction
func (r *ReactionRepository) Delete(matchID, userID int, emoji string) error {
	query := `DELETE FROM reactions WHERE match_id = $1 AND user_id = $2 AND emoji = $3`
	_, err := r.db.Exec(query, matchID, userID, emoji)
	return err
}
