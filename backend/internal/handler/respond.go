package handler

import (
	"encoding/json"
	"log"
	"net/http"
)

// respondJSON is the base helper for sending JSON responses.
// It is intentionally kept simple — no pretty-printing, no indentation.
// Production APIs should minimise response size; if human-readability
// is needed, pipe through a CLI tool like jq.
func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if data == nil {
		return
	}

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("respondJSON: failed to encode response: %v", err)
	}
}

// respondError sends a structured error response.
// The error key is used by the frontend to display user-facing messages.
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{
		"error": message,
	})
}

// respondData wraps the payload in a "data" object for consistent API structure.
// All successful responses follow { "data": ... } so the frontend can always
// destructure from a known key, regardless of the endpoint.
func respondData(w http.ResponseWriter, status int, data any) {
	respondJSON(w, status, map[string]any{
		"data": data,
	})
}

func respondBadRequest(w http.ResponseWriter, message string) {
	respondError(w, http.StatusBadRequest, message)
}

func respondUnauthorized(w http.ResponseWriter) {
	respondError(w, http.StatusUnauthorized, "unauthorized")
}

func respondNotFound(w http.ResponseWriter) {
	respondError(w, http.StatusNotFound, "not found")
}

func respondInternalError(w http.ResponseWriter) {
	respondError(w, http.StatusInternalServerError, "internal server error")
}

func respondNotImplemented(w http.ResponseWriter) {
	respondError(w, http.StatusNotImplemented, "not implemented")
}

// decodeJSON reads the request body into a destination struct.
// SECURITY: It limits the body size to 1MB and rejects unknown fields
// to prevent malicious payloads or accidental data binding.
//
// Why 1MB? A typical order payload is <2KB. 1MB provides ample margin
// while still preventing trivial memory exhaustion attacks.
// DisallowUnknownFields catches typos in field names early (e.g. "pricce"
// would silently be ignored by the default decoder).
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	// MaxBytesReader limits the number of bytes read from the request body.
	// This runs before decoding, so a 100MB payload is rejected at the
	// read level rather than consuming memory during JSON parsing.
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		respondBadRequest(w, "invalid request body")
		return false
	}

	return true
}
