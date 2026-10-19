package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func post(body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	NewRouter().ServeHTTP(rec, req)
	return rec
}

func TestCalculateHandler(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantBody   string
	}{
		{"add", `{"operation":"add","a":2,"b":3}`, 200, `{"result":5}`},
		{"sqrt without b", `{"operation":"sqrt","a":16}`, 200, `{"result":4}`},
		{"divide by zero", `{"operation":"divide","a":1,"b":0}`, 400, `{"error":"cannot divide by zero"}`},
		{"missing a", `{"operation":"add","b":1}`, 400, `{"error":"the field 'a' is necessary"}`},
		{"missing b", `{"operation":"add","a":1}`, 400, `{"error":"the field 'b' is necessary"}`},
		{"bad json", `not json`, 400, `{"error":"JSON is invalid"}`},
		{"unknown op", `{"operation":"foo","a":1,"b":1}`, 400, `{"error":"unknown operation"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := post(tt.body)
			if rec.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if got := strings.TrimSpace(rec.Body.String()); got != tt.wantBody {
				t.Errorf("body = %s, want %s", got, tt.wantBody)
			}
		})
	}
}
