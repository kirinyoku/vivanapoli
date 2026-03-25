package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/kirinyoku/vivanapoli/backend/internal/config"
	"github.com/kirinyoku/vivanapoli/backend/internal/db"
	"github.com/kirinyoku/vivanapoli/backend/internal/handler"
)

func main() {
	cfg := config.Load()

	pool, err := db.NewPool(cfg.DBUrl)
	if err != nil {
		log.Fatalf("Failed to connect to db: %v", err)
	}
	defer pool.Close()
	fmt.Println("Connected to database")

	queries := db.NewQueries(pool)

	h := handler.New(queries, cfg)
	r := h.SetupRoutes()

	fmt.Printf("Server started on port: %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
