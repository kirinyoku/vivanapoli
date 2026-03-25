package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/kirinyoku/vivanapoli/backend/internal/config"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
	"github.com/rs/cors"
)

type Handler struct {
	queries *generated.Queries
	config  *config.Config
}

func New(queries *generated.Queries, config *config.Config) *Handler {
	return &Handler{
		queries: queries,
		config:  config,
	}
}

func (h *Handler) SetupRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(h.corsMiddleware())

	r.Get("/health", h.handleHealth)

	r.Route("/api", func(r chi.Router) {
		r.Get("/menu", h.GetMenu)
		r.Get("/settings", h.GetSettings)
		r.Post("/orders", h.CreateOrder)
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
