-- +migrate Up

-- ============================================================================
-- Migration 005: Add Sports Configuration Tables
--
-- This migration transforms the hardcoded dual-sport system into a flexible,
-- configuration-driven architecture. New sports can be added via database
-- INSERT instead of code changes.
-- ============================================================================

-- Create sports configuration table
CREATE TABLE IF NOT EXISTS sports (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(255),
    default_elo INTEGER NOT NULL DEFAULT 1000,
    k_factor INTEGER NOT NULL DEFAULT 32,
    min_score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 999,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user sports junction table for per-sport ELO and stats
CREATE TABLE IF NOT EXISTS user_sports (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_id VARCHAR(50) NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    current_elo INTEGER NOT NULL DEFAULT 1000,
    highest_elo INTEGER NOT NULL DEFAULT 1000,
    matches_played INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sport_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_sports_elo ON user_sports(sport_id, current_elo DESC);
CREATE INDEX idx_user_sports_user ON user_sports(user_id);
CREATE INDEX idx_sports_active ON sports(is_active, sort_order);

-- Add trigger for updated_at on sports table
CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON sports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for updated_at on user_sports table
CREATE TRIGGER update_user_sports_updated_at BEFORE UPDATE ON user_sports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Insert existing sports
-- ============================================================================

INSERT INTO sports (id, name, display_name, default_elo, k_factor, min_score, max_score, is_active, sort_order)
VALUES
    ('table_tennis', 'Table Tennis', 'Table Tennis', 1000, 32, 0, 999, true, 1),
    ('table_football', 'Table Football', 'Table Football', 1000, 32, 0, 999, true, 2);

-- ============================================================================
-- Migrate existing ELO data from users table to user_sports
-- ============================================================================

-- Migrate table_tennis ELO for all users
INSERT INTO user_sports (user_id, sport_id, current_elo, highest_elo, matches_played, wins, losses)
SELECT
    u.id,
    'table_tennis',
    u.table_tennis_elo,
    u.table_tennis_elo,
    COALESCE(stats.matches_played, 0),
    COALESCE(stats.wins, 0),
    COALESCE(stats.losses, 0)
FROM users u
LEFT JOIN (
    SELECT
        player_id,
        COUNT(*) as matches_played,
        SUM(CASE WHEN won THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN NOT won THEN 1 ELSE 0 END) as losses
    FROM (
        SELECT player1_id as player_id, (winner_id = player1_id) as won
        FROM matches WHERE sport = 'table_tennis' AND status = 'confirmed'
        UNION ALL
        SELECT player2_id as player_id, (winner_id = player2_id) as won
        FROM matches WHERE sport = 'table_tennis' AND status = 'confirmed'
    ) match_participation
    GROUP BY player_id
) stats ON u.id = stats.player_id;

-- Migrate table_football ELO for all users
INSERT INTO user_sports (user_id, sport_id, current_elo, highest_elo, matches_played, wins, losses)
SELECT
    u.id,
    'table_football',
    u.table_football_elo,
    u.table_football_elo,
    COALESCE(stats.matches_played, 0),
    COALESCE(stats.wins, 0),
    COALESCE(stats.losses, 0)
FROM users u
LEFT JOIN (
    SELECT
        player_id,
        COUNT(*) as matches_played,
        SUM(CASE WHEN won THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN NOT won THEN 1 ELSE 0 END) as losses
    FROM (
        SELECT player1_id as player_id, (winner_id = player1_id) as won
        FROM matches WHERE sport = 'table_football' AND status = 'confirmed'
        UNION ALL
        SELECT player2_id as player_id, (winner_id = player2_id) as won
        FROM matches WHERE sport = 'table_football' AND status = 'confirmed'
    ) match_participation
    GROUP BY player_id
) stats ON u.id = stats.player_id;

-- ============================================================================
-- Update highest_elo based on historical match data
-- This calculates the peak ELO each user reached based on match history
-- ============================================================================

-- Update highest ELO for table_tennis
UPDATE user_sports us
SET highest_elo = GREATEST(us.current_elo, COALESCE(peak.max_elo, us.current_elo))
FROM (
    SELECT player_id, MAX(elo_after) as max_elo
    FROM (
        SELECT player1_id as player_id, player1_elo_after as elo_after
        FROM matches WHERE sport = 'table_tennis' AND status = 'confirmed' AND player1_elo_after IS NOT NULL
        UNION ALL
        SELECT player2_id as player_id, player2_elo_after as elo_after
        FROM matches WHERE sport = 'table_tennis' AND status = 'confirmed' AND player2_elo_after IS NOT NULL
    ) elo_history
    GROUP BY player_id
) peak
WHERE us.user_id = peak.player_id AND us.sport_id = 'table_tennis';

-- Update highest ELO for table_football
UPDATE user_sports us
SET highest_elo = GREATEST(us.current_elo, COALESCE(peak.max_elo, us.current_elo))
FROM (
    SELECT player_id, MAX(elo_after) as max_elo
    FROM (
        SELECT player1_id as player_id, player1_elo_after as elo_after
        FROM matches WHERE sport = 'table_football' AND status = 'confirmed' AND player1_elo_after IS NOT NULL
        UNION ALL
        SELECT player2_id as player_id, player2_elo_after as elo_after
        FROM matches WHERE sport = 'table_football' AND status = 'confirmed' AND player2_elo_after IS NOT NULL
    ) elo_history
    GROUP BY player_id
) peak
WHERE us.user_id = peak.player_id AND us.sport_id = 'table_football';

-- ============================================================================
-- Update foreign key constraints to reference sports table
-- ============================================================================

-- Drop old CHECK constraint on matches.sport
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_sport_check;

-- Add foreign key constraint on matches.sport
ALTER TABLE matches ADD CONSTRAINT matches_sport_fk
    FOREIGN KEY (sport) REFERENCES sports(id);

-- Drop old CHECK constraint on elo_adjustments.sport
ALTER TABLE elo_adjustments DROP CONSTRAINT IF EXISTS elo_adjustments_sport_check;

-- Add foreign key constraint on elo_adjustments.sport
ALTER TABLE elo_adjustments ADD CONSTRAINT elo_adjustments_sport_fk
    FOREIGN KEY (sport) REFERENCES sports(id);

-- ============================================================================
-- Create sync trigger to keep legacy ELO columns in sync during transition
-- This allows gradual migration without breaking existing code
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_legacy_elo_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sport_id = 'table_tennis' THEN
        UPDATE users SET table_tennis_elo = NEW.current_elo WHERE id = NEW.user_id;
    ELSIF NEW.sport_id = 'table_football' THEN
        UPDATE users SET table_football_elo = NEW.current_elo WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_sports_to_legacy
    AFTER INSERT OR UPDATE OF current_elo ON user_sports
    FOR EACH ROW
    EXECUTE FUNCTION sync_legacy_elo_columns();

-- ============================================================================
-- +migrate Down
-- ============================================================================

-- +migrate Down

-- Drop sync trigger
DROP TRIGGER IF EXISTS sync_user_sports_to_legacy ON user_sports;
DROP FUNCTION IF EXISTS sync_legacy_elo_columns();

-- Remove foreign key constraints, restore CHECK constraints
ALTER TABLE elo_adjustments DROP CONSTRAINT IF EXISTS elo_adjustments_sport_fk;
ALTER TABLE elo_adjustments ADD CONSTRAINT elo_adjustments_sport_check
    CHECK (sport IN ('table_tennis', 'table_football'));

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_sport_fk;
ALTER TABLE matches ADD CONSTRAINT matches_sport_check
    CHECK (sport IN ('table_tennis', 'table_football'));

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_sports_updated_at ON user_sports;
DROP TRIGGER IF EXISTS update_sports_updated_at ON sports;

-- Drop indexes
DROP INDEX IF EXISTS idx_sports_active;
DROP INDEX IF EXISTS idx_user_sports_user;
DROP INDEX IF EXISTS idx_user_sports_elo;

-- Drop tables
DROP TABLE IF EXISTS user_sports;
DROP TABLE IF EXISTS sports;
