// Package db provides the PostgreSQL connection layer.
// It wraps pgxpool for connection pooling and exposes sqlc-generated
// query functions. The pool configuration is tuned for a typical
// restaurant-order workload (moderate concurrency, short-lived queries).
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
//
// Pool sizing rationale (MaxConns=25, MinConns=5):
//   - 25 connections is generous for a pizzeria ordering system where most
//     requests are short (menu reads, order inserts). The Go runtime multiplexes
//     many goroutines over few connections via pgxpool.
//   - 5 minimum connections keep the pool warm during idle periods (e.g. overnight
//     when the restaurant is closed), avoiding cold-start latency spikes.
//   - MaxConnLifetime (1h) prevents long-running connections from accumulating
//     stale state in the PostgreSQL backend (e.g. prepared plan cache bloat).
//   - MaxConnIdleTime (30m) reclaims resources during extended inactivity.
func NewPool(dbURL string) (*pgxpool.Pool, error) {
	if dbURL == "" {
		return nil, fmt.Errorf("dbURL is required")
	}

	cfg, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse dbURL: %w", err)
	}

	cfg.MaxConns = 25
	cfg.MinConns = 5
	cfg.MaxConnLifetime = 1 * time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}

	// Ping confirms the TCP + PostgreSQL handshake is complete and the pool
	// can immediately serve queries. Without this, the first real request would
	// pay the connection-establishment penalty.
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping pool: %w", err)
	}

	return pool, nil
}

// NewQueries returns a new instance of sqlc-generated queries using the provided pool.
// The returned *generated.Queries is safe for concurrent use because it delegates
// to pgxpool.Pool which is itself goroutine-safe.
func NewQueries(pool *pgxpool.Pool) *generated.Queries {
	return generated.New(pool)
}
