import type { Operation } from "../api/types";

// Exclude the unary operations
export type BinaryOperation = Exclude<Operation, 'sqrt' | 'percentage'>

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'


/**
 * What the display is currently showing:
 * - empty: waiting for a new number (initial state, after AC or after an operator)
 * - typing: the user in entering a number
 * - value: a computed result. A new number replaces it, an operator uses it as left operand
 */
export type InputMode = 'empty' | 'typing' | 'value'

// What to do with the result of the API
export type Continuation =
  | { type: 'chain'; nextOp: BinaryOperation } // The result chains to a new operation
  | { type: 'equals' } // show the result of the stacked operations
  | { type: 'operand' } // Computes the unary operations

// Calculation waiting to be sent to the backend.
export interface PendingRequest {
  operation: Operation
  a: number
  b?: number
  then: Continuation
}

export interface CalculatorState {
  display: string
  input: InputMode
  left: number | null
  pendingOp: BinaryOperation | null
  lastOp: BinaryOperation | null  // for repeated =
  lastOperand: number | null
  error: string | null
  request: PendingRequest | null
}

export type Action =
  | { type: 'digit'; digit: Digit }
  | { type: 'decimal' }
  | { type: 'operator'; operation: BinaryOperation }
  | { type: 'equals' }
  | { type: 'sqrt' }
  | { type: 'percent' }
  | { type: 'delete' }
  | { type: 'clear' }
  | { type: 'resolved'; result: number }
  | { type: 'failed'; message: string }
