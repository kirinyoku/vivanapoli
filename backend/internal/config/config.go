package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string `env:"PORT"`
	DBUrl        string `env:"DB_URL"`
	JWTSecret    string `env:"JWT_SECRET"`
	ResendApiKey string `env:"RESEND_API_KEY"`
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	return &Config{
		Port:         getEnv("PORT", "8080"),
		DBUrl:        getEnv("DB_URL", ""),
		JWTSecret:    getEnv("JWT_SECRET", ""),
		ResendApiKey: getEnv("RESEND_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
