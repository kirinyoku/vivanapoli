package handler

import (
	"encoding/json"
	"log"
	"net/http"
)

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

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{
		"error": message,
	})
}

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

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		respondBadRequest(w, "invalid request body")
		return false
	}

	return true
}
