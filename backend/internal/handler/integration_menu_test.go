package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/kirinyoku/vivanapoli/backend/internal/config"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
)

func TestIntegration_MenuCRUD(t *testing.T) {
	pool, queries := setupTestDB(t)
	defer pool.Close()

	cfg := &config.Config{
		JWTSecret: "test-secret",
	}

	h := New(queries, cfg)

	t.Run("Category CRUD", func(t *testing.T) {
		// 1. Create
		uniqueSlug := fmt.Sprintf("crud-cat-%d", time.Now().UnixNano())
		catPayload := map[string]any{
			"name":       "CRUD Category",
			"slug":       uniqueSlug,
			"sort_order": 10,
		}
		body, _ := json.Marshal(catPayload)
		req := httptest.NewRequest("POST", "/api/admin/menu/categories", bytes.NewReader(body))
		rr := httptest.NewRecorder()
		h.AdminCreateCategory(rr, req)

		if rr.Code != http.StatusCreated {
			t.Fatalf("expected status 201, got %d. Body: %s", rr.Code, rr.Body.String())
		}

		var resp map[string]any
		json.NewDecoder(rr.Body).Decode(&resp)
		data := resp["data"].(map[string]any)
		catID := int32(data["id"].(float64))

		// 2. Update
		updatePayload := map[string]any{
			"name":       "Updated Category",
			"slug":       uniqueSlug + "-updated",
			"sort_order": 20,
		}
		body, _ = json.Marshal(updatePayload)
		req = httptest.NewRequest("PUT", fmt.Sprintf("/api/admin/menu/categories/%d", catID), bytes.NewReader(body))
		
		// Setup chi context for URL param
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", fmt.Sprintf("%d", catID))
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		
		rr = httptest.NewRecorder()
		h.AdminUpdateCategory(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
		}

		// 3. Delete
		req = httptest.NewRequest("DELETE", fmt.Sprintf("/api/admin/menu/categories/%d", catID), nil)
		rctx = chi.NewRouteContext()
		rctx.URLParams.Add("id", fmt.Sprintf("%d", catID))
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		
		rr = httptest.NewRecorder()
		h.AdminDeleteCategory(rr, req)

		if rr.Code != http.StatusNoContent {
			t.Errorf("expected status 204, got %d", rr.Code)
		}

		// Verify deletion
		var err error
		_, err = queries.GetCategoryByID(context.Background(), catID)
		if err == nil {
			t.Error("expected category to be deleted, but it still exists")
		}
	})

	t.Run("MenuItem CRUD", func(t *testing.T) {
		// Setup category first
		cat, err := queries.CreateCategory(context.Background(), generated.CreateCategoryParams{
			Name: "Item Test Cat",
			Slug: fmt.Sprintf("item-test-%d", time.Now().UnixNano()),
		})
		if err != nil {
			t.Fatalf("failed to setup category: %v", err)
		}
		defer queries.DeleteCategory(context.Background(), cat.ID)

		// 1. Create
		priceLarge := 199.50
		desc := "Test description"
		itemPayload := map[string]any{
			"category_id": cat.ID,
			"name":        "CRUD Item",
			"description": desc,
			"price_large": priceLarge,
			"is_available": true,
			"allergens":   []string{"G", "M"},
		}
		body, _ := json.Marshal(itemPayload)
		req := httptest.NewRequest("POST", "/api/admin/menu/items", bytes.NewReader(body))
		rr := httptest.NewRecorder()
		h.AdminCreateMenuItem(rr, req)

		if rr.Code != http.StatusCreated {
			t.Fatalf("expected status 201, got %d. Body: %s", rr.Code, rr.Body.String())
		}

		var resp map[string]any
		json.NewDecoder(rr.Body).Decode(&resp)
		data := resp["data"].(map[string]any)
		itemID := int32(data["id"].(float64))

		// 2. Update
		newName := "Updated Item Name"
		updatePayload := itemPayload
		updatePayload["name"] = newName
		body, _ = json.Marshal(updatePayload)
		req = httptest.NewRequest("PUT", fmt.Sprintf("/api/admin/menu/items/%d", itemID), bytes.NewReader(body))
		
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", fmt.Sprintf("%d", itemID))
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		
		rr = httptest.NewRecorder()
		h.AdminUpdateMenuItem(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
		}

		// 3. Delete
		req = httptest.NewRequest("DELETE", fmt.Sprintf("/api/admin/menu/items/%d", itemID), nil)
		rctx = chi.NewRouteContext()
		rctx.URLParams.Add("id", fmt.Sprintf("%d", itemID))
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		
		rr = httptest.NewRecorder()
		h.AdminDeleteMenuItem(rr, req)

		if rr.Code != http.StatusNoContent {
			t.Errorf("expected status 204, got %d", rr.Code)
		}

		// Verify deletion
		_, err = queries.GetMenuItemByID(context.Background(), itemID)
		if err == nil {
			t.Error("expected menu item to be deleted, but it still exists")
		}
	})

	t.Run("Cascade Delete Category", func(t *testing.T) {
		// 1. Create Category
		cat, err := queries.CreateCategory(context.Background(), generated.CreateCategoryParams{
			Name: "Cascade Test Cat",
			Slug: fmt.Sprintf("cascade-test-%d", time.Now().UnixNano()),
		})
		if err != nil {
			t.Fatalf("failed to setup category: %v", err)
		}

		// 2. Create Item in that category
		item, err := queries.CreateMenuItem(context.Background(), generated.CreateMenuItemParams{
			CategoryID: cat.ID,
			Name:       "Cascade Test Item",
			Allergens:  []string{},
		})
		if err != nil {
			t.Fatalf("failed to setup item: %v", err)
		}

		// 3. Delete Category
		req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/admin/menu/categories/%d", cat.ID), nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", fmt.Sprintf("%d", cat.ID))
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		
		rr := httptest.NewRecorder()
		h.AdminDeleteCategory(rr, req)

		if rr.Code != http.StatusNoContent {
			t.Errorf("expected status 204, got %d", rr.Code)
		}

		// 4. Verify Item is also gone
		_, err = queries.GetMenuItemByID(context.Background(), item.ID)
		if err == nil {
			t.Error("expected menu item to be deleted via cascade, but it still exists")
		}
	})
}

func TestIntegration_SettingsAndOrders(t *testing.T) {
	pool, queries := setupTestDB(t)
	defer pool.Close()

	cfg := &config.Config{
		JWTSecret: "test-secret",
	}

	h := New(queries, cfg)

	t.Run("Update Settings", func(t *testing.T) {
		payload := map[string]string{
			"phone":     "11223344",
			"address":   "New Test Address",
			"is_open":   "false",
			"open_time": "10:00",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", "/api/admin/settings", bytes.NewReader(body))
		rr := httptest.NewRecorder()
		h.AdminUpdateSettings(rr, req)

		if rr.Code != http.StatusNoContent {
			t.Errorf("expected status 204, got %d", rr.Code)
		}

		// Verify settings in DB
		settingsRows, _ := queries.GetAllSettings(context.Background())
		settingsMap := make(map[string]string)
		for _, row := range settingsRows {
			settingsMap[row.Key] = row.Value
		}

		if settingsMap["phone"] != "11223344" {
			t.Errorf("expected phone 11223344, got %s", settingsMap["phone"])
		}
		if settingsMap["is_open"] != "false" {
			t.Errorf("expected is_open false, got %s", settingsMap["is_open"])
		}
	})

	t.Run("Update Order Status", func(t *testing.T) {
		// 1. Create a dummy order
		order, err := queries.CreateOrder(context.Background(), generated.CreateOrderParams{
			CustomerName:  "Status Test User",
			CustomerPhone: "88888888",
			OrderType:     "pickup",
			Items:         []byte("[]"),
			TotalPrice:    ptrToPgNumeric(ptr(100.0)),
		})
		if err != nil {
			t.Fatalf("failed to create order: %v", err)
		}

		// 2. Update status to 'confirmed'
		payload := map[string]string{"status": "confirmed"}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", fmt.Sprintf("/api/admin/orders/%d/status", order.ID), bytes.NewReader(body))
		
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", fmt.Sprintf("%d", order.ID))
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		
		rr := httptest.NewRecorder()
		h.AdminUpdateOrderStatus(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
		}

		// Verify in DB
		updatedOrder, _ := queries.GetOrderByID(context.Background(), order.ID)
		if updatedOrder.OrderStatus != "confirmed" {
			t.Errorf("expected status confirmed, got %s", updatedOrder.OrderStatus)
		}
	})
}

func ptr[T any](v T) *T {
	return &v
}

