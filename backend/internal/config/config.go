package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	DBUrl          string
	JWTSecret      string
	ResendApiKey   string
	AllowedOrigins []string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	return &Config{
		Port:           getEnv("PORT", "8080"),
		DBUrl:          getEnv("DB_URL", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		ResendApiKey:   getEnv("RESEND_API_KEY", ""),
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
