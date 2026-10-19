// Package api exposes the calculator to HTTP protocol. Routing, handlers, and responses
package api

import (
	"encoding/json"
	"net/http"

	"github.com/CamiloLM/sezzle-calculator/backend/internal/calculator"
)

type calculateRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b"`
}

type calculateResponse struct {
	Result float64 `json:"result"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorResponse{Error: msg})
}

func CalculateHandler(w http.ResponseWriter, r *http.Request) {
	var req calculateRequest

	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	dec.DisallowUnknownFields()

	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "JSON is invalid")
		return
	}

	if req.Operation == "" {
		writeError(w, http.StatusBadRequest, "the field 'operation' is necessary")
		return
	}

	if req.A == nil {
		writeError(w, http.StatusBadRequest, "the field 'a' is necessary")
		return
	}

	var b float64
	if req.Operation != "sqrt" {
		if req.B == nil {
			writeError(w, http.StatusBadRequest, "the field 'b' is necessary")
			return
		}
		b = *req.B
	}

	result, err := calculator.Calculate(req.Operation, *req.A, b)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, calculateResponse{Result: result})
}
