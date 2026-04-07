package handler

import (
	"log"
	"net/http"

	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
)

// GetSettings fetches all restaurant configuration from the 'settings' table.
// It transforms the DB rows (key/value pairs) into a flat JSON object for the frontend.
func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rows, err := h.queries.GetAllSettings(ctx)
	if err != nil {
		log.Printf("GetSettings: failed to get settings: %v", err)
		respondInternalError(w)
		return
	}

	settings := make(map[string]string, len(rows))
	for _, row := range rows {
		settings[row.Key] = row.Value
	}

	respondData(w, http.StatusOK, settings)
}

// AdminUpdateSettings performs a batch upsert of the settings.
// Useful for updating hours, phone numbers, or addresses in one go.
func (h *Handler) AdminUpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req map[string]string
	if !decodeJSON(w, r, &req) {
		return
	}

	// Iterates through the map and updates each setting in the DB.
	for key, value := range req {
		_, err := h.queries.UpsertSetting(r.Context(), generated.UpsertSettingParams{
			Key:   key,
			Value: value,
		})
		if err != nil {
			log.Printf("AdminUpdateSettings: failed to upsert %s: %v", key, err)
			respondInternalError(w)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}
