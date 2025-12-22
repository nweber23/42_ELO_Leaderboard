package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL     string
	FTClientUID     string
	FTClientSecret  string
	FTRedirectURI   string
	JWTSecret       string
	Port            string
	AllowedOrigins  []string
	FrontendURL     string
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

	allowedOrigins := getEnvAsSlice("ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173"}, ",")
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:3000")

	cfg := &Config{
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		FTClientUID:    getEnv("FT_CLIENT_UID", ""),
		FTClientSecret: getEnv("FT_CLIENT_SECRET", ""),
		FTRedirectURI:  getEnv("FT_REDIRECT_URI", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		Port:           getEnv("PORT", "8080"),
		AllowedOrigins: allowedOrigins,
		FrontendURL:    frontendURL,
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

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvAsSlice(name string, defaultVal []string, sep string) []string {
	valStr := getEnv(name, "")

	if valStr == "" {
		return defaultVal
	}

	val := strings.Split(valStr, sep)

	return val
}
