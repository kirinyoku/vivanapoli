package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/kirinyoku/vivanapoli/backend/internal/config"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
	"golang.org/x/crypto/bcrypt"
)

func TestIntegration_Auth(t *testing.T) {
	pool, queries := setupTestDB(t)
	defer pool.Close()

	cfg := &config.Config{
		JWTSecret: "test-secret-key-very-long-and-secure",
	}

	h := New(queries, cfg)

	// Create test admin
	email := "admin_test@test.com"
	password := "securepassword123"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	
	_, err := queries.CreateAdmin(context.Background(), generated.CreateAdminParams{
		Email:        email,
		PasswordHash: string(hash),
	})
	if err != nil {
		t.Fatalf("Failed to create admin user: %v", err)
	}
	defer queries.DeleteAdmin(context.Background(), email)

	t.Run("Successful Login", func(t *testing.T) {
		payload := map[string]string{
			"email":    email,
			"password": password,
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/admin/login", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		h.Login(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
		}

		var resp map[string]any
		json.NewDecoder(rr.Body).Decode(&resp)
		
		data := resp["data"].(map[string]any)
		if data["token"] == "" {
			t.Error("expected JWT token in response, got empty string")
		}
		if data["email"] != email {
			t.Errorf("expected email %s, got %s", email, data["email"])
		}
	})

	t.Run("Wrong Password", func(t *testing.T) {
		payload := map[string]string{
			"email":    email,
			"password": "wrongpassword",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/admin/login", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		h.Login(rr, req)

		if rr.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401 for wrong password, got %d", rr.Code)
		}
	})
}
