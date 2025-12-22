package repositories

import (
	"database/sql"

	"github.com/42heilbronn/elo-leaderboard/internal/models"
)

type CommentRepository struct {
	db *sql.DB
}

func NewCommentRepository(db *sql.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

// Add creates a new comment
func (r *CommentRepository) Add(comment *models.Comment) error {
	query := `
		INSERT INTO comments (match_id, user_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(query, comment.MatchID, comment.UserID, comment.Content).
		Scan(&comment.ID, &comment.CreatedAt, &comment.UpdatedAt)
}

// GetByMatchID retrieves all comments for a match
func (r *CommentRepository) GetByMatchID(matchID int) ([]models.Comment, error) {
	query := `
		SELECT id, match_id, user_id, content, created_at, updated_at
		FROM comments
		WHERE match_id = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(query, matchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		if err := rows.Scan(
			&comment.ID,
			&comment.MatchID,
			&comment.UserID,
			&comment.Content,
			&comment.CreatedAt,
			&comment.UpdatedAt,
		); err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}

	return comments, rows.Err()
}

// Delete removes a comment
func (r *CommentRepository) Delete(commentID, userID int) error {
	query := `DELETE FROM comments WHERE id = $1 AND user_id = $2`
	result, err := r.db.Exec(query, commentID, userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}
