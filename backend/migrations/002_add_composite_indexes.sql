-- Migration: Add composite indexes for common query patterns
-- This improves query performance for frequently used queries

-- Composite index for matching queries that filter by players and sport
-- Used when checking for existing pending matches between players
CREATE INDEX IF NOT EXISTS idx_matches_player_sport_status
ON matches(player1_id, player2_id, sport, status);

-- Composite index for leaderboard and match listing queries
-- Used when fetching matches by sport with status filtering, ordered by date
CREATE INDEX IF NOT EXISTS idx_matches_sport_status_created
ON matches(sport, status, created_at DESC);

-- Index for user match history queries
-- Used when filtering matches by a specific user
CREATE INDEX IF NOT EXISTS idx_matches_submitted_by
ON matches(submitted_by);

-- Composite index for finding matches involving a specific player
-- Covers queries that filter by either player1 or player2
CREATE INDEX IF NOT EXISTS idx_matches_player1_status
ON matches(player1_id, status);

CREATE INDEX IF NOT EXISTS idx_matches_player2_status
ON matches(player2_id, status);

-- Index for reaction queries by user (for checking if user already reacted)
CREATE INDEX IF NOT EXISTS idx_reactions_user_match
ON reactions(user_id, match_id);

-- Index for comment queries by user
CREATE INDEX IF NOT EXISTS idx_comments_user_id
ON comments(user_id);
