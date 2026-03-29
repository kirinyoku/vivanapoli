package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/kirinyoku/vivanapoli/backend/internal/config"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
	"github.com/rs/cors"
)

// Handler struct encapsulates all API request handlers and their dependencies.
type Handler struct {
	queries *generated.Queries // sqlc-generated database queries
	config  *config.Config     // Application configuration
}

// New creates a new Handler instance with database and config dependencies.
func New(queries *generated.Queries, config *config.Config) *Handler {
	return &Handler{
		queries: queries,
		config:  config,
	}
}

// SetupRoutes initializes the Chi router and defines all API endpoints.
func (h *Handler) SetupRoutes() *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(h.corsMiddleware())

	// Health check endpoint
	r.Get("/health", h.handleHealth)

	// API endpoints group
	r.Route("/api", func(r chi.Router) {
		r.Get("/menu", h.GetMenu)          // Fetch full menu grouped by categories
		r.Get("/settings", h.GetSettings)  // Fetch restaurant configuration
		r.Post("/orders", h.CreateOrder)   // Place a new order
	})

	return r
}

func (h *Handler) corsMiddleware() func(http.Handler) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins: h.config.AllowedOrigins,
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
		},
		AllowCredentials: true,
		MaxAge:           300,
	})

	return c.Handler
}

func (h *Handler) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "ok"}`))
}
