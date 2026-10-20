// Types for the calculator backend endpoint

// Operations names as the backend accepts them
export type Operation =
  | 'add'
  | 'substract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percentage'

// Request body. 'b' is not required only by 'sqrt'
export interface CalculateRequest {
  operation: Operation
  a: number
  b?: number
}

// Success response body
export interface CalculateSucces {
  result: number
}

// Error response body
export interface CalculateFailure {
  error: string
}
