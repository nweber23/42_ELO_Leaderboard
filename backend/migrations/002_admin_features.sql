-- +migrate Up

-- Add admin and ban fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by INTEGER REFERENCES users(id);

-- Add disputed status to matches
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE matches ADD CONSTRAINT matches_status_check
    CHECK (status IN ('pending', 'confirmed', 'denied', 'cancelled', 'disputed'));

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'user', 'match', 'system'
    target_id INTEGER,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);

-- Create ELO adjustment history table (for manual adjustments)
CREATE TABLE IF NOT EXISTS elo_adjustments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport VARCHAR(50) NOT NULL CHECK (sport IN ('table_tennis', 'table_football')),
    old_elo INTEGER NOT NULL,
    new_elo INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for ELO adjustments
CREATE INDEX idx_elo_adjustments_user_id ON elo_adjustments(user_id);
CREATE INDEX idx_elo_adjustments_created_at ON elo_adjustments(created_at DESC);

-- +migrate Down

-- Drop ELO adjustments
DROP INDEX IF EXISTS idx_elo_adjustments_created_at;
DROP INDEX IF EXISTS idx_elo_adjustments_user_id;
DROP TABLE IF EXISTS elo_adjustments;

-- Drop admin audit log
DROP INDEX IF EXISTS idx_admin_audit_log_action;
DROP INDEX IF EXISTS idx_admin_audit_log_created_at;
DROP INDEX IF EXISTS idx_admin_audit_log_admin_id;
DROP TABLE IF EXISTS admin_audit_log;

-- Remove disputed status from matches (revert to original constraint)
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE matches ADD CONSTRAINT matches_status_check
    CHECK (status IN ('pending', 'confirmed', 'denied', 'cancelled'));

-- Remove admin and ban fields from users table
ALTER TABLE users DROP COLUMN IF EXISTS banned_by;
ALTER TABLE users DROP COLUMN IF EXISTS banned_at;
ALTER TABLE users DROP COLUMN IF EXISTS ban_reason;
ALTER TABLE users DROP COLUMN IF EXISTS is_banned;
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
