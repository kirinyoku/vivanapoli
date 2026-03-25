package handler

import (
	"log"
	"net/http"
)

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
