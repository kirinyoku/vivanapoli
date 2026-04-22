// Package main is the application entry point.
// It wires together configuration, database, and HTTP routing,
// then starts the server with graceful shutdown on SIGINT/SIGTERM.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kirinyoku/vivanapoli/backend/internal/config"
	"github.com/kirinyoku/vivanapoli/backend/internal/db"
	"github.com/kirinyoku/vivanapoli/backend/internal/handler"
)

func main() {
	// 1. Load configuration from .env / environment.
	cfg := config.Load()

	// 2. Initialize structured logger.
	// TextHandler is used by default (human-readable). Switch to
	// slog.NewJSONHandler for production log aggregation.
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 3. Connect to PostgreSQL via connection pool.
	pool, err := db.NewPool(cfg.DBUrl)
	if err != nil {
		slog.Error("Failed to connect to db", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("Connected to database")

	queries := db.NewQueries(pool)

	// 4. Initialize handler (dependency injection) and build route tree.
	h := handler.New(queries, cfg)
	r := h.SetupRoutes()

	// 5. Configure and start HTTP server.
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// 6. Create a buffered channel (capacity 1) to receive OS signals.
	// Buffering is important: signal.Notify does not block when sending
	// to the channel, so a single signal won't be lost even if we're
	// temporarily not ready to receive.
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// 7. Start server in a separate goroutine so the main goroutine
	// can block on the signal channel for graceful shutdown.
	go func() {
		slog.Info("Server started", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("Failed to start server", "error", err)
			os.Exit(1)
		}
	}()

	// 8. Wait for OS interrupt / termination signal.
	<-done
	slog.Info("Server is shutting down...")

	// 9. Create a context with a 10-second deadline for graceful shutdown.
	// This gives in-flight requests time to complete before the process exits.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 10. Attempt graceful shutdown — waits for active connections to drain.
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("Server exited properly")
}
