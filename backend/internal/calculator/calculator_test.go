package calculator

import (
	"errors"
	"testing"
)

func TestCalculate(t *testing.T) {
	tests := []struct {
		name    string
		op      string
		a, b    float64
		want    float64
		wantErr error
	}{
		{"add", "add", 2, 3, 5, nil},
		{"subtract", "subtract", 2, 3, -1, nil},
		{"multiply", "multiply", 4, 3, 12, nil},
		{"divide", "divide", 10, 4, 2.5, nil},
		{"divide by zero", "divide", 1, 0, 0, ErrDivisionByZero},
		{"power", "power", 2, 10, 1024, nil},
		{"power overflow", "power", 10, 1000, 0, ErrInvalidResult},
		{"sqrt", "sqrt", 9, 0, 3, nil},
		{"sqrt negative", "sqrt", -1, 0, 0, ErrNegativeSqrt},
		{"percentage", "percentage", 200, 15, 30, nil},
		{"unknown op", "modulo", 1, 2, 0, ErrUnkownOperation},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.op, tt.a, tt.b)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("error = %v, want %v", err, tt.wantErr)
			}
			if err == nil && got != tt.want {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}
