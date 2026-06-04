package config

import "os"

type Config struct {
	RedisURL    string
	DatabaseURL string
	GoogleClientID     string
	GoogleClientSecret string
}

func Load() Config {
	return Config{
		RedisURL:    getenv("EMAIL_WORKER_REDIS_URL", "redis://localhost:6379"),
		DatabaseURL: getenv("EMAIL_WORKER_DATABASE_URL", "postgresql://returnrider:returnrider@localhost:5432/returnrider"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
