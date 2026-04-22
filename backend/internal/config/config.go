// Package config loads environment-based configuration for the application.
// It supports both .env files and direct environment variables, with the
// latter taking precedence for containerized/cloud deployments where
// injecting a .env file is impractical.
package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all environment-based configuration for the backend application.
// The struct is exported so it can be instantiated in tests without calling Load().
type Config struct {
	Port           string   // HTTP port the server listens on
	DBUrl          string   // PostgreSQL connection URL
	JWTSecret      string   // Secret key for JWT authentication
	// ResendApiKey — API key for Resend (https://resend.com), a transactional
	// email service used to send order notifications. Generate a key at:
	// https://resend.com/api-keys
	ResendApiKey string
	// OrderEmailTo — recipient address for order notification emails (i.e. the
	// restaurant's inbox). Must be a verified domain in your Resend account
	// (https://resend.com/domains) unless you're on a paid plan that allows
	// sending to unverified addresses.
	OrderEmailTo string
	// OrderEmailFrom — sender address used in the "From" header of order
	// emails. During development / on the free Resend plan this must be the
	// default "onboarding@resend.dev" sender. For production, configure a
	// custom domain (https://resend.com/domains) and use your own address
	// (e.g. "orders@yourdomain.com").
	OrderEmailFrom string
	AllowedOrigins []string // CORS allowed origins
}

// Load reads configuration from .env file or environment variables.
// .env loading is best-effort — if the file is missing (typical in production
// containers), the function silently falls back to os.Getenv. This avoids
// hard-failing when env vars are injected via the orchestrator (K8s, Docker).
func Load() *Config {
	// godotenv.Load() returns an error if .env doesn't exist, which is expected
	// in production. We only log it, not exit.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	return &Config{
		Port:           getEnv("PORT", ""),
		DBUrl:          getEnv("DB_URL", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		ResendApiKey:   getEnv("RESEND_API_KEY", ""),
		OrderEmailTo:   getEnv("ORDER_EMAIL_TO", ""),
		OrderEmailFrom: getEnv("ORDER_EMAIL_FROM", ""),
		// ALLOWED_ORIGINS is a comma-separated list (e.g. "http://a.com,http://b.com").
		// We parse it here rather than at CORS middleware time so misconfiguration
		// is caught as early as possible.
		AllowedOrigins: parseList(getEnv("ALLOWED_ORIGINS", "http://localhost:3000")),
	}
}

// getEnv reads an environment variable with an optional fallback default.
// An empty string from the environment is treated as "not set", so the
// fallback kicks in. This lets operators unset a variable to get defaults.
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// parseList splits a comma-separated string into a trimmed slice, discarding
// empty entries. strings.SplitSeq (Go 1.24+) is used instead of the classic
// strings.Split to avoid allocating the intermediate slice when the string
// is short (typical for CORS origins).
func parseList(s string) []string {
	var result []string
	for item := range strings.SplitSeq(s, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}
