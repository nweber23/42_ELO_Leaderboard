package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL     string
	FTClientUID     string
	FTClientSecret  string
	FTRedirectURI   string
	JWTSecret       string
	Port            string
	DefaultELO      int
	ELOKFactor      int
}

func Load() (*Config, error) {
	defaultELO, err := strconv.Atoi(getEnv("DEFAULT_ELO", "1000"))
	if err != nil {
		return nil, fmt.Errorf("invalid DEFAULT_ELO: %w", err)
	}

	kFactor, err := strconv.Atoi(getEnv("ELO_K_FACTOR", "32"))
	if err != nil {
		return nil, fmt.Errorf("invalid ELO_K_FACTOR: %w", err)
	}

	cfg := &Config{
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		FTClientUID:    getEnv("FT_CLIENT_UID", ""),
		FTClientSecret: getEnv("FT_CLIENT_SECRET", ""),
		FTRedirectURI:  getEnv("FT_REDIRECT_URI", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		Port:           getEnv("PORT", "8080"),
		DefaultELO:     defaultELO,
		ELOKFactor:     kFactor,
	}

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) Validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.FTClientUID == "" {
		return fmt.Errorf("FT_CLIENT_UID is required")
	}
	if c.FTClientSecret == "" {
		return fmt.Errorf("FT_CLIENT_SECRET is required")
	}
	if c.FTRedirectURI == "" {
		return fmt.Errorf("FT_REDIRECT_URI is required")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
