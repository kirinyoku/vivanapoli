package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kirinyoku/vivanapoli/backend/internal/config"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
)

func setupTestDB(t *testing.T) (*pgxpool.Pool, *generated.Queries) {
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		t.Skip("Skipping integration test: DB_URL not set")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		t.Fatalf("Failed to connect to test DB: %v", err)
	}

	queries := generated.New(pool)
	return pool, queries
}

func parseNumeric(s string) pgtype.Numeric {
	var n pgtype.Numeric
	n.Scan(s)
	return n
}

func TestIntegration_OrderCreation(t *testing.T) {
	pool, queries := setupTestDB(t)
	defer pool.Close()

	cfg := &config.Config{
		JWTSecret:      "test-secret",
		ResendApiKey:   "re_test", 
		OrderEmailTo:   "to@test.com",
		OrderEmailFrom: "from@test.com",
	}

	h := New(queries, cfg)
	
	// Mock shop to be open during tests
	queries.UpsertSetting(context.Background(), generated.UpsertSettingParams{Key: "is_open", Value: "true"})
	queries.UpsertSetting(context.Background(), generated.UpsertSettingParams{Key: "open_time", Value: "00:00"})
	queries.UpsertSetting(context.Background(), generated.UpsertSettingParams{Key: "close_time", Value: "23:59"})

	// Prepare test data
	category, err := queries.CreateCategory(context.Background(), generated.CreateCategoryParams{
		Name:      "Test Category",
		Slug:      fmt.Sprintf("test-category-%d", time.Now().UnixNano()),
		SortOrder: 0,
	})
	if err != nil {
		t.Fatalf("Failed to create test category: %v", err)
	}
	defer queries.DeleteCategory(context.Background(), category.ID)

	description := "Delicious test pizza"
	itemParams := generated.CreateMenuItemParams{
		CategoryID:  category.ID,
		Name:        "Test Pizza",
		Description: &description,
		PriceSmall:  parseNumeric("100.00"),
		PriceLarge:  parseNumeric("150.00"),
		Allergens:   []string{"gluten"},
		IsAvailable: true,
		SortOrder:   0,
	}
	item, err := queries.CreateMenuItem(context.Background(), itemParams)
	if err != nil {
		t.Fatalf("Failed to create test menu item: %v", err)
	}
	defer queries.DeleteMenuItem(context.Background(), item.ID)

	t.Run("Create Order Successfully", func(t *testing.T) {
		orderPayload := map[string]any{
			"customer_name":    "Test User",
			"customer_phone":   "12345678",
			"customer_address": "Test Street 1",
			"order_type":       "delivery",
			"items": []map[string]any{
				{
					"menu_item_id": item.ID,
					"quantity":     2,
					"size":         "large",
				},
			},
			"comment": "Please deliver quickly",
		}

		body, _ := json.Marshal(orderPayload)
		req := httptest.NewRequest("POST", "/api/orders", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		h.CreateOrder(rr, req)

		if rr.Code != http.StatusCreated {
			t.Errorf("expected status 201, got %d. Body: %s", rr.Code, rr.Body.String())
		}

		var resp map[string]any
		json.NewDecoder(rr.Body).Decode(&resp)
		
		data := resp["data"].(map[string]any)
		if data["customer_name"] != "Test User" {
			t.Errorf("expected customer name 'Test User', got '%v'", data["customer_name"])
		}
		
		// Total price should be 2 * 150 = 300
		totalPrice := fmt.Sprintf("%v", data["total_price"])
		if totalPrice != "300" && totalPrice != "300.00" {
			t.Errorf("expected total price '300.00', got '%v'", totalPrice)
		}
	})

	t.Run("Reject Order When Shop Is Manually Closed", func(t *testing.T) {
		// Close shop manually
		_, err := queries.UpsertSetting(context.Background(), generated.UpsertSettingParams{
			Key:   "is_open",
			Value: "false",
		})
		if err != nil {
			t.Fatalf("Failed to close shop: %v", err)
		}
		defer queries.UpsertSetting(context.Background(), generated.UpsertSettingParams{
			Key:   "is_open",
			Value: "true",
		})

		orderPayload := map[string]any{
			"customer_name":    "Test User",
			"customer_phone":   "12345678",
			"customer_address": "Test Street 1",
			"order_type":       "delivery",
			"items": []map[string]any{
				{
					"menu_item_id": item.ID,
					"quantity":     1,
					"size":         "large",
				},
			},
		}

		body, _ := json.Marshal(orderPayload)
		req := httptest.NewRequest("POST", "/api/orders", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		h.CreateOrder(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected status 400 for closed shop, got %d. Body: %s", rr.Code, rr.Body.String())
		}
		
		if !strings.Contains(rr.Body.String(), "closed") {
			t.Errorf("expected error message to contain 'closed', got %s", rr.Body.String())
		}
	})

	t.Run("Invalid Phone Number (Short)", func(t *testing.T) {
		orderPayload := map[string]any{
			"customer_name":    "Test User",
			"customer_phone":   "123", // Too short
			"customer_address": "Test Street 1",
			"order_type":       "delivery",
			"items": []map[string]any{
				{
					"menu_item_id": item.ID,
					"quantity":     1,
					"size":         "large",
				},
			},
		}

		body, _ := json.Marshal(orderPayload)
		req := httptest.NewRequest("POST", "/api/orders", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		h.CreateOrder(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected status 400 for invalid phone, got %d", rr.Code)
		}
	})
}
