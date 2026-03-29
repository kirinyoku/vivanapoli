package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
)

// NewPool creates a new PostgreSQL connection pool with optimized configurations.
// It handles URL parsing, connection limits, and connectivity checks (Ping).
func NewPool(dbURL string) (*pgxpool.Pool, error) {
	if dbURL == "" {
		return nil, fmt.Errorf("dbURL is required")
	}

	cfg, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse dbURL: %w", err)
	}

	// Performance optimization for the connection pool
	cfg.MaxConns = 25
	cfg.MinConns = 5
	cfg.MaxConnLifetime = 1 * time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}

	// Verify the connection is working
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping pool: %w", err)
	}

	return pool, nil
}

// NewQueries returns a new instance of sqlc-generated queries using the provided pool.
func NewQueries(pool *pgxpool.Pool) *generated.Queries {
	return generated.New(pool)
}
