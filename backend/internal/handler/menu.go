package handler

import (
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
)

type menuItemResponse struct {
	ID          int32    `json:"id"`
	Name        string   `json:"name"`
	Description *string  `json:"description"`
	PriceSmall  *float64 `json:"price_small"`
	PriceLarge  *float64 `json:"price_large"`
	Allergens   []string `json:"allergens"`
	IsAvailable bool     `json:"is_available"`
}

type categoryResponse struct {
	ID    int32              `json:"id"`
	Name  string             `json:"name"`
	Slug  string             `json:"slug"`
	Items []menuItemResponse `json:"items"`
}

func toMenuItemResponse(item generated.MenuItem) menuItemResponse {
	return menuItemResponse{
		ID:          item.ID,
		Name:        item.Name,
		Description: item.Description,
		PriceSmall:  pgNumericToPtr(item.PriceSmall),
		PriceLarge:  pgNumericToPtr(item.PriceLarge),
		Allergens:   item.Allergens,
		IsAvailable: item.IsAvailable,
	}
}

func (h *Handler) GetMenu(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	categories, err := h.queries.GetCategories(ctx)
	if err != nil {
		log.Printf("GetMenu: failed to get categories: %v", err)
		respondInternalError(w)
		return
	}

	response := make([]categoryResponse, 0, len(categories))

	for _, cat := range categories {
		items, err := h.queries.GetAvailableMenuItemsByCategory(ctx, cat.ID)
		if err != nil {
			log.Printf("GetMenu: failed to get items for category %d: %v", cat.ID, err)
			respondInternalError(w)
			return
		}

		itemResponses := make([]menuItemResponse, 0, len(items))
		for _, item := range items {
			itemResponses = append(itemResponses, toMenuItemResponse(item))
		}

		response = append(response, categoryResponse{
			ID:    cat.ID,
			Name:  cat.Name,
			Slug:  cat.Slug,
			Items: itemResponses,
		})
	}

	respondData(w, http.StatusOK, response)
}

func pgNumericToPtr(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	f, _ := n.Float64Value()
	if !f.Valid {
		return nil
	}
	return &f.Float64
}
