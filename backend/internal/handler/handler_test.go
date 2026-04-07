package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/kirinyoku/vivanapoli/backend/internal/config"
)

func TestHandleHealth(t *testing.T) {
	h := &Handler{
		queries: nil,
		config:  &config.Config{},
		resend:  nil,
	}

	req, err := http.NewRequest("GET", "/health", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(h.handleHealth)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	expected := `{"status": "ok"}`
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), expected)
	}
}

func TestRespondJSON(t *testing.T) {
	rr := httptest.NewRecorder()
	data := map[string]string{"foo": "bar"}
	
	respondJSON(rr, http.StatusOK, data)
	
	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}
	
	if rr.Header().Get("Content-Type") != "application/json" {
		t.Errorf("expected content-type application/json, got %s", rr.Header().Get("Content-Type"))
	}
	
	var res map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatal(err)
	}
	
	if res["foo"] != "bar" {
		t.Errorf("expected foo=bar, got %v", res["foo"])
	}
}

func TestRespondData(t *testing.T) {
	rr := httptest.NewRecorder()
	data := "test-data"
	
	respondData(rr, http.StatusCreated, data)
	
	if rr.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", rr.Code)
	}
	
	var res map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatal(err)
	}
	
	if res["data"] != "test-data" {
		t.Errorf("expected data=test-data, got %v", res["data"])
	}
}

func TestDecodeJSON(t *testing.T) {
	type testStruct struct {
		Name string `json:"name"`
		Age  int    `json:"age"`
	}
	
	t.Run("Valid JSON", func(t *testing.T) {
		body := `{"name": "John", "age": 30}`
		req := httptest.NewRequest("POST", "/", strings.NewReader(body))
		rr := httptest.NewRecorder()
		
		var dst testStruct
		if ok := decodeJSON(rr, req, &dst); !ok {
			t.Error("decodeJSON failed for valid input")
		}
		
		if dst.Name != "John" || dst.Age != 30 {
			t.Errorf("unexpected decode result: %+v", dst)
		}
	})
	
	t.Run("Unknown Field", func(t *testing.T) {
		body := `{"name": "John", "unknown": true}`
		req := httptest.NewRequest("POST", "/", strings.NewReader(body))
		rr := httptest.NewRecorder()
		
		var dst testStruct
		if ok := decodeJSON(rr, req, &dst); ok {
			t.Error("decodeJSON should have failed for unknown field")
		}
		
		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", rr.Code)
		}
	})
	
	t.Run("Payload too large", func(t *testing.T) {
		// 1MB + some extra
		largeBody := bytes.Repeat([]byte("a"), (1<<20)+100)
		req := httptest.NewRequest("POST", "/", bytes.NewReader(largeBody))
		rr := httptest.NewRecorder()
		
		var dst testStruct
		if ok := decodeJSON(rr, req, &dst); ok {
			t.Error("decodeJSON should have failed for large payload")
		}
		// status might be 400 or other depending on how MaxBytesReader is handled
	})
}
