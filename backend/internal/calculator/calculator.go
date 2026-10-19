// Package calculator implements the basic logic of arithmetic operations
package calculator

import (
	"errors"
	"math"
)

var (
	ErrDivisionByZero  = errors.New("cannot divide by zero")
	ErrNegativeSqrt    = errors.New("cannot take the square root of a negative number")
	ErrUnkownOperation = errors.New("unknown operation")
	ErrInvalidResult   = errors.New("result is not defined")
)

func Calculate(op string, a, b float64) (float64, error) {
	var result float64

	switch op {
	case "add":
		result = a + b
	case "subtract":
		result = a - b
	case "multiply":
		result = a * b
	case "divide":
		if b == 0 {
			return 0, ErrDivisionByZero
		}
		result = a / b
	case "power":
		result = math.Pow(a, b)
	case "sqrt":
		if a < 0 {
			return 0, ErrNegativeSqrt
		}
		result = math.Sqrt(a)
	case "percentage":
		result = a * b / 100
	default:
		return 0, ErrUnkownOperation
	}

	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrInvalidResult
	}

	return result, nil
}
