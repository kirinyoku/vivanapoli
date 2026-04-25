package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
)

// menuItemResponse is the public DTO for a menu item.
// Prices are *float64 to correctly represent NULL from the DB — a NULL price
// means "this size is not available for this item" (e.g. burgers only have large).
// Using a pointer also distinguishes "0 NOK" from "not set".
type menuItemResponse struct {
	ID                 int32    `json:"id"`
	CategoryID         int32    `json:"category_id"`
	Name               string   `json:"name"`
	Description        *string  `json:"description"`
	PriceSmall         *float64 `json:"price_small"`
	PriceLarge         *float64 `json:"price_large"`
	DiscountPriceSmall *float64 `json:"discount_price_small"`
	DiscountPriceLarge *float64 `json:"discount_price_large"`
	Allergens          []string `json:"allergens"`
	IsAvailable        bool     `json:"is_available"`
}

type categoryResponse struct {
	ID    int32              `json:"id"`
	Name  string             `json:"name"`
	Slug  string             `json:"slug"`
	Items []menuItemResponse `json:"items"`
}

// toMenuItemResponse converts a DB model to a JSON-friendly response struct.
// This explicit mapping decouples the DB schema from the API contract:
// renaming a DB column won't silently change the JSON output.
func toMenuItemResponse(item generated.MenuItem) menuItemResponse {
	return menuItemResponse{
		ID:                 item.ID,
		CategoryID:         item.CategoryID,
		Name:               item.Name,
		Description:        item.Description,
		PriceSmall:         pgNumericToPtr(item.PriceSmall),
		PriceLarge:         pgNumericToPtr(item.PriceLarge),
		DiscountPriceSmall: pgNumericToPtr(item.DiscountPriceSmall),
		DiscountPriceLarge: pgNumericToPtr(item.DiscountPriceLarge),
		Allergens:          item.Allergens,
		IsAvailable:        item.IsAvailable,
	}
}

// GetMenu fetches all categories and their available items in a nested structure.
//
// Performance note: this runs one query for categories + one per category for
// items (N+1-ish). For a pizzeria with ~15 categories this is ~16 queries,
// which is acceptable — each is a simple indexed lookup. If the menu grows
// significantly (50+ categories), consider a single JOIN query with client-side
// grouping to reduce round-trips.
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
		// Only fetch items marked as 'available' — unavailable items are
		// hidden from customers but still visible in the admin panel.
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

// ---------------------------------------------------------------------------
// Admin Menu Categories Handlers
// ---------------------------------------------------------------------------

func (h *Handler) AdminGetCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.queries.GetCategories(r.Context())
	if err != nil {
		log.Printf("AdminGetCategories: %v", err)
		respondInternalError(w)
		return
	}
	respondData(w, http.StatusOK, categories)
}

func (h *Handler) AdminCreateCategory(w http.ResponseWriter, r *http.Request) {
	var params generated.CreateCategoryParams
	if !decodeJSON(w, r, &params) {
		return
	}

	if params.Name == "" || params.Slug == "" {
		respondBadRequest(w, "name and slug are required")
		return
	}

	category, err := h.queries.CreateCategory(r.Context(), params)
	if err != nil {
		log.Printf("AdminCreateCategory: %v", err)
		respondInternalError(w)
		return
	}

	respondData(w, http.StatusCreated, category)
}

func (h *Handler) AdminUpdateCategory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondBadRequest(w, "invalid category id")
		return
	}

	var params generated.UpdateCategoryParams
	if !decodeJSON(w, r, &params) {
		return
	}
	params.ID = int32(id)

	if params.Name == "" || params.Slug == "" {
		respondBadRequest(w, "name and slug are required")
		return
	}

	category, err := h.queries.UpdateCategory(r.Context(), params)
	if err != nil {
		log.Printf("AdminUpdateCategory: %v", err)
		respondInternalError(w)
		return
	}

	respondData(w, http.StatusOK, category)
}

func (h *Handler) AdminDeleteCategory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondBadRequest(w, "invalid category id")
		return
	}

	err = h.queries.DeleteCategory(r.Context(), int32(id))
	if err != nil {
		log.Printf("AdminDeleteCategory: %v", err)
		respondInternalError(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ---------------------------------------------------------------------------
// Admin Menu Items Handlers
// ---------------------------------------------------------------------------

// adminMenuItemRequest handles the input for creating/updating items.
// Prices are *float64 to distinguish "set to 0" from "not provided" (null).
// The JSON decoder leaves nil for missing fields, which is then converted
// to pgtype.Numeric{Valid: false} by ptrToPgNumeric.
type adminMenuItemRequest struct {
	CategoryID         int32    `json:"category_id"`
	Name               string   `json:"name"`
	Description        *string  `json:"description"`
	PriceSmall         *float64 `json:"price_small"`
	PriceLarge         *float64 `json:"price_large"`
	DiscountPriceSmall *float64 `json:"discount_price_small"`
	DiscountPriceLarge *float64 `json:"discount_price_large"`
	Allergens          []string `json:"allergens"`
	IsAvailable        bool     `json:"is_available"`
	SortOrder          int32    `json:"sort_order"`
}

func (h *Handler) AdminGetMenuItems(w http.ResponseWriter, r *http.Request) {
	items, err := h.queries.GetMenuItems(r.Context())
	if err != nil {
		log.Printf("AdminGetMenuItems: %v", err)
		respondInternalError(w)
		return
	}

	response := make([]menuItemResponse, 0, len(items))
	for _, item := range items {
		response = append(response, toMenuItemResponse(item))
	}

	respondData(w, http.StatusOK, response)
}

func (h *Handler) AdminCreateMenuItem(w http.ResponseWriter, r *http.Request) {
	var req adminMenuItemRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	if req.Name == "" {
		respondBadRequest(w, "Navn er obligatorisk")
		return
	}
	if req.CategoryID == 0 {
		log.Printf("AdminCreateMenuItem: category_id is required (got 0)")
		respondBadRequest(w, "Kategori er obligatorisk (received 0)")
		return
	}

	params := generated.CreateMenuItemParams{
		CategoryID:         req.CategoryID,
		Name:               req.Name,
		Description:        req.Description,
		PriceSmall:         ptrToPgNumeric(req.PriceSmall),
		PriceLarge:         ptrToPgNumeric(req.PriceLarge),
		DiscountPriceSmall: ptrToPgNumeric(req.DiscountPriceSmall),
		DiscountPriceLarge: ptrToPgNumeric(req.DiscountPriceLarge),
		Allergens:          req.Allergens,
		IsAvailable:        req.IsAvailable,
		SortOrder:          req.SortOrder,
	}

	item, err := h.queries.CreateMenuItem(r.Context(), params)
	if err != nil {
		log.Printf("ERROR AdminCreateMenuItem: %v", err)
		respondError(w, http.StatusInternalServerError, "Kunne ikke opprette produkt: "+err.Error())
		return
	}

	respondData(w, http.StatusCreated, toMenuItemResponse(item))
}

func (h *Handler) AdminUpdateMenuItem(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondBadRequest(w, "invalid menu item id")
		return
	}

	var req adminMenuItemRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	if req.Name == "" {
		respondBadRequest(w, "Navn er obligatorisk")
		return
	}
	if req.CategoryID == 0 {
		log.Printf("AdminUpdateMenuItem: category_id is required (got 0)")
		respondBadRequest(w, "Kategori er obligatorisk (received 0)")
		return
	}

	// Verify the menu item exists before attempting to update it.
	// If it doesn't exist, return 404 instead of letting sqlc return a 500.
	if _, err := h.queries.GetMenuItemByID(r.Context(), int32(id)); err != nil {
		log.Printf("AdminUpdateMenuItem: menu item %d not found: %v", id, err)
		respondError(w, http.StatusNotFound, "Menu item not found")
		return
	}

	params := generated.UpdateMenuItemParams{
		ID:                 int32(id),
		CategoryID:         req.CategoryID,
		Name:               req.Name,
		Description:        req.Description,
		PriceSmall:         ptrToPgNumeric(req.PriceSmall),
		PriceLarge:         ptrToPgNumeric(req.PriceLarge),
		DiscountPriceSmall: ptrToPgNumeric(req.DiscountPriceSmall),
		DiscountPriceLarge: ptrToPgNumeric(req.DiscountPriceLarge),
		Allergens:          req.Allergens,
		IsAvailable:        req.IsAvailable,
		SortOrder:          req.SortOrder,
	}

	item, err := h.queries.UpdateMenuItem(r.Context(), params)
	if err != nil {
		log.Printf("ERROR AdminUpdateMenuItem: %v", err)
		respondError(w, http.StatusInternalServerError, "Kunne ikke oppdatere produkt: "+err.Error())
		return
	}

	respondData(w, http.StatusOK, toMenuItemResponse(item))
}

func (h *Handler) AdminDeleteMenuItem(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondBadRequest(w, "invalid menu item id")
		return
	}

	err = h.queries.DeleteMenuItem(r.Context(), int32(id))
	if err != nil {
		log.Printf("AdminDeleteMenuItem: %v", err)
		respondInternalError(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ptrToPgNumeric converts a Go *float64 to pgtype.Numeric for sqlc-generated queries.
//
// pgx/sqlc uses pgtype.Numeric to handle PostgreSQL's NUMERIC type with
// arbitrary precision. We convert via string (FormatFloat) rather than
// directly assigning float64 to avoid floating-point representation issues:
// e.g. 19.99 → "19.99" (correct), not 19.990000000000002.
// Precision 2 ensures consistent decimal formatting (e.g. 100.00 not "100"),
// which matches PostgreSQL NUMERIC storage for currency values.
func ptrToPgNumeric(f *float64) pgtype.Numeric {
	if f == nil {
		return pgtype.Numeric{Valid: false}
	}
	n := pgtype.Numeric{}
	if err := n.Scan(strconv.FormatFloat(*f, 'f', 2, 64)); err != nil {
		log.Printf("ptrToPgNumeric: failed to scan value %v: %v", *f, err)
	}
	return n
}

// pgNumericToPtr converts a pgtype.Numeric back to a Go *float64.
// Returns nil for NULL database values — the JSON encoder then omits
// the field (omitempty) or renders it as null depending on the struct tag.
func pgNumericToPtr(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	f, err := n.Float64Value()
	if err != nil {
		log.Printf("pgNumericToPtr: failed to convert numeric: %v", err)
		return nil
	}
	if !f.Valid {
		return nil
	}
	return &f.Float64
}
