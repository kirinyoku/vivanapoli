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
	// 1. Load configuration
	cfg := config.Load()

	// 2. Initialize structured logger (JSON for production-ready approach)
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 3. Connect to database
	pool, err := db.NewPool(cfg.DBUrl)
	if err != nil {
		slog.Error("Failed to connect to db", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("Connected to database")

	queries := db.NewQueries(pool)

	// 4. Initialize handler and routes
	h := handler.New(queries, cfg)
	r := h.SetupRoutes()

	// 5. Configure HTTP server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// 6. Channel to listen for interrupt signals
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// 7. Start server in a separate goroutine
	go func() {
		slog.Info("Server started", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("Failed to start server", "error", err)
			os.Exit(1)
		}
	}()

	// 8. Wait for termination signal
	<-done
	slog.Info("Server is shutting down...")

	// 9. Context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 10. Attempt to shutdown the server gracefully
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("Server exited properly")
}
