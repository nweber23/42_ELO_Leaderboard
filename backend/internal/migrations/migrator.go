package migrations

import (
	"database/sql"
	"embed"
	"fmt"
	"log/slog"
	"sort"
	"strings"
	"time"
)

//go:embed *.sql
var migrationFiles embed.FS

// Migration represents a database migration
type Migration struct {
	Version     int
	Name        string
	UpSQL       string
	DownSQL     string
	AppliedAt   *time.Time
}

// Migrator handles database migrations
type Migrator struct {
	db         *sql.DB
	migrations []Migration
}

// NewMigrator creates a new migrator instance
func NewMigrator(db *sql.DB) (*Migrator, error) {
	m := &Migrator{db: db}

	// Ensure migrations table exists
	if err := m.ensureMigrationsTable(); err != nil {
		return nil, fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Load migrations from embedded files
	if err := m.loadMigrations(); err != nil {
		return nil, fmt.Errorf("failed to load migrations: %w", err)
	}

	return m, nil
}

// ensureMigrationsTable creates the schema_migrations table if it doesn't exist
func (m *Migrator) ensureMigrationsTable() error {
	_, err := m.db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

// loadMigrations loads migration files and parses them
func (m *Migrator) loadMigrations() error {
	entries, err := migrationFiles.ReadDir(".")
	if err != nil {
		return fmt.Errorf("failed to read migration files: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		content, err := migrationFiles.ReadFile(entry.Name())
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", entry.Name(), err)
		}

		migration, err := parseMigration(entry.Name(), string(content))
		if err != nil {
			slog.Warn("Skipping migration file", "file", entry.Name(), "error", err)
			continue
		}

		m.migrations = append(m.migrations, migration)
	}

	// Sort migrations by version
	sort.Slice(m.migrations, func(i, j int) bool {
		return m.migrations[i].Version < m.migrations[j].Version
	})

	return nil
}

// parseMigration parses a migration file
// Expected format:
// -- +migrate Up
// <up SQL>
// -- +migrate Down
// <down SQL>
func parseMigration(filename, content string) (Migration, error) {
	// Parse version from filename (e.g., "001_init_schema.sql" -> 1)
	var version int
	var name string
	_, err := fmt.Sscanf(filename, "%d_%s", &version, &name)
	if err != nil {
		// Try alternative format
		parts := strings.SplitN(filename, "_", 2)
		if len(parts) >= 1 {
			fmt.Sscanf(parts[0], "%d", &version)
		}
		if len(parts) >= 2 {
			name = strings.TrimSuffix(parts[1], ".sql")
		}
	}

	if version == 0 {
		return Migration{}, fmt.Errorf("could not parse version from filename: %s", filename)
	}

	// Parse up and down sections
	upSQL, downSQL := parseUpDown(content)

	return Migration{
		Version: version,
		Name:    name,
		UpSQL:   upSQL,
		DownSQL: downSQL,
	}, nil
}

// parseUpDown parses the up and down SQL from migration content
func parseUpDown(content string) (upSQL, downSQL string) {
	lines := strings.Split(content, "\n")
	var current *strings.Builder
	up := &strings.Builder{}
	down := &strings.Builder{}

	current = up // Default to up if no markers

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.Contains(trimmed, "+migrate Up") || strings.Contains(trimmed, "-- Up") {
			current = up
			continue
		}
		if strings.Contains(trimmed, "+migrate Down") || strings.Contains(trimmed, "-- Down") {
			current = down
			continue
		}
		if current != nil {
			current.WriteString(line)
			current.WriteString("\n")
		}
	}

	return strings.TrimSpace(up.String()), strings.TrimSpace(down.String())
}

// GetAppliedVersions returns the list of applied migration versions
func (m *Migrator) GetAppliedVersions() ([]int, error) {
	rows, err := m.db.Query("SELECT version FROM schema_migrations ORDER BY version")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var versions []int
	for rows.Next() {
		var version int
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		versions = append(versions, version)
	}

	return versions, rows.Err()
}

// MigrateUp applies all pending migrations
func (m *Migrator) MigrateUp() error {
	applied, err := m.GetAppliedVersions()
	if err != nil {
		return fmt.Errorf("failed to get applied versions: %w", err)
	}

	appliedMap := make(map[int]bool)
	for _, v := range applied {
		appliedMap[v] = true
	}

	for _, migration := range m.migrations {
		if appliedMap[migration.Version] {
			continue
		}

		slog.Info("Applying migration", "version", migration.Version, "name", migration.Name)

		if err := m.applyMigration(migration); err != nil {
			return fmt.Errorf("failed to apply migration %d: %w", migration.Version, err)
		}

		slog.Info("Migration applied successfully", "version", migration.Version)
	}

	return nil
}

// MigrateDown rolls back the last migration
func (m *Migrator) MigrateDown() error {
	applied, err := m.GetAppliedVersions()
	if err != nil {
		return fmt.Errorf("failed to get applied versions: %w", err)
	}

	if len(applied) == 0 {
		slog.Info("No migrations to rollback")
		return nil
	}

	// Get the last applied version
	lastVersion := applied[len(applied)-1]

	// Find the migration
	var migration *Migration
	for i := range m.migrations {
		if m.migrations[i].Version == lastVersion {
			migration = &m.migrations[i]
			break
		}
	}

	if migration == nil {
		return fmt.Errorf("migration %d not found in files", lastVersion)
	}

	if migration.DownSQL == "" {
		return fmt.Errorf("migration %d has no down SQL", lastVersion)
	}

	slog.Info("Rolling back migration", "version", migration.Version, "name", migration.Name)

	if err := m.rollbackMigration(*migration); err != nil {
		return fmt.Errorf("failed to rollback migration %d: %w", migration.Version, err)
	}

	slog.Info("Migration rolled back successfully", "version", migration.Version)

	return nil
}

// MigrateDownTo rolls back to a specific version
func (m *Migrator) MigrateDownTo(targetVersion int) error {
	for {
		applied, err := m.GetAppliedVersions()
		if err != nil {
			return fmt.Errorf("failed to get applied versions: %w", err)
		}

		if len(applied) == 0 {
			break
		}

		lastVersion := applied[len(applied)-1]
		if lastVersion <= targetVersion {
			break
		}

		if err := m.MigrateDown(); err != nil {
			return err
		}
	}

	return nil
}

// applyMigration applies a single migration within a transaction
func (m *Migrator) applyMigration(migration Migration) error {
	tx, err := m.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Execute the up SQL
	if _, err = tx.Exec(migration.UpSQL); err != nil {
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	// Record the migration
	if _, err = tx.Exec(
		"INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
		migration.Version, migration.Name,
	); err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	return tx.Commit()
}

// rollbackMigration rolls back a single migration within a transaction
func (m *Migrator) rollbackMigration(migration Migration) error {
	tx, err := m.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Execute the down SQL
	if _, err = tx.Exec(migration.DownSQL); err != nil {
		return fmt.Errorf("failed to execute rollback SQL: %w", err)
	}

	// Remove the migration record
	if _, err = tx.Exec(
		"DELETE FROM schema_migrations WHERE version = $1",
		migration.Version,
	); err != nil {
		return fmt.Errorf("failed to remove migration record: %w", err)
	}

	return tx.Commit()
}

// Status returns the current migration status
func (m *Migrator) Status() ([]MigrationStatus, error) {
	applied, err := m.GetAppliedVersions()
	if err != nil {
		return nil, err
	}

	appliedMap := make(map[int]bool)
	for _, v := range applied {
		appliedMap[v] = true
	}

	var status []MigrationStatus
	for _, migration := range m.migrations {
		status = append(status, MigrationStatus{
			Version: migration.Version,
			Name:    migration.Name,
			Applied: appliedMap[migration.Version],
		})
	}

	return status, nil
}

// MigrationStatus represents the status of a migration
type MigrationStatus struct {
	Version int    `json:"version"`
	Name    string `json:"name"`
	Applied bool   `json:"applied"`
}
