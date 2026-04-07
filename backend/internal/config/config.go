package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all environment-based configuration for the backend application.
type Config struct {
	Port           string   // HTTP port the server listens on
	DBUrl          string   // PostgreSQL connection URL
	JWTSecret      string   // Secret key for JWT authentication
	ResendApiKey   string   // API key for Resend email service
	OrderEmailTo   string   // Recipient email for orders (restaurant)
	OrderEmailFrom string   // Sender email (e.g. hello@vivanapolinotodden.no)
	AllowedOrigins []string // CORS allowed origins
}

// Load reads configuration from .env file or environment variables.
// It prioritizes .env but falls back to environment variables or defaults.
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	return &Config{
		Port:           getEnv("PORT", "8080"),
		DBUrl:          getEnv("DB_URL", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		ResendApiKey:   getEnv("RESEND_API_KEY", ""),
		OrderEmailTo:   getEnv("ORDER_EMAIL_TO", ""),
		OrderEmailFrom: getEnv("ORDER_EMAIL_FROM", ""),
		AllowedOrigins: parseList(getEnv("ALLOWED_ORIGINS", "http://localhost:3000")),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

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
