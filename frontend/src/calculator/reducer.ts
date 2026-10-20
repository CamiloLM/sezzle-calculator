import type { Action, BinaryOperation, CalculatorState, Continuation, Digit } from './types'

export const MAX_DIGITS = 12

export const initialState: CalculatorState = {
  display: '0',
  input: 'empty',
  left: null,
  pendingOp: null,
  lastOp: null,
  lastOperand: null,
  error: null,
  request: null,
}

export function calculatorReducer(state: CalculatorState, action: Action): CalculatorState {
  if (!accepts(state, action)) return state

  switch (action.type) {
    case 'digit':
      return inputDigit(state, action.digit)
    case 'decimal':
      return inputDecimal(state)
    case 'operator':
      return inputOperator(state, action.operation)
    case 'equals':
      return inputEquals(state)
    case 'sqrt':
      return inputSqrt(state)
    case 'percent':
      return state // Phase 2 (rule 18)
    case 'delete':
      return deleteLast(state)
    case 'clear':
      return initialState
    case 'resolved':
      return applyResult(state, action.result)
    case 'failed':
      return applyFailure(state, action.message)
    default:
      return assertNever(action)
  }
}

/** Busy: only the API answer gets through. Error: only a new number or AC. */
function accepts(state: CalculatorState, action: Action): boolean {
  if (state.request !== null) return action.type === 'resolved' || action.type === 'failed'
  if (state.error !== null) {
    return action.type === 'digit' || action.type === 'decimal' || action.type === 'clear'
  }
  return true
}

/** Begins a new number. Without a pending operator it is a brand-new calculation. */
function startNumber(state: CalculatorState, display: string): CalculatorState {
  const base = state.pendingOp === null ? initialState : state
  return { ...base, display, input: 'typing' }
}

function countDigits(display: string): number {
  return display.replace(/[^0-9]/g, '').length
}

function inputDigit(state: CalculatorState, digit: Digit): CalculatorState {
  if (state.input !== 'typing') return startNumber(state, digit)
  if (countDigits(state.display) >= MAX_DIGITS) return state
  if (state.display === '0') return { ...state, display: digit }
  if (state.display === '-0') return { ...state, display: `-${digit}` }
  return { ...state, display: state.display + digit }
}

function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.input !== 'typing') return startNumber(state, '0.')
  if (state.display.includes('.')) return state
  if (state.display === '-') return { ...state, display: '-0.' }
  return { ...state, display: `${state.display}.` }
}

function deleteLast(state: CalculatorState): CalculatorState {
  if (state.input !== 'typing') return state
  const display = state.display.slice(0, -1)
  return { ...state, display: display === '' ? '0' : display }
}

/** A lone '-' is the start of a negative number, not a number yet. */
function isLoneMinus(state: CalculatorState): boolean {
  return state.display === '-'
}

/** Asks the backend for `left pendingOp display`. Does nothing without a pending operator. */
function requestPendingOp(state: CalculatorState, then: Continuation): CalculatorState {
  if (state.pendingOp === null || state.left === null) return state
  return {
    ...state,
    request: { operation: state.pendingOp, a: state.left, b: Number(state.display), then },
  }
}

function inputOperator(state: CalculatorState, operation: BinaryOperation): CalculatorState {
  if (isLoneMinus(state)) return state
  if (state.input === 'empty') {
    if (state.pendingOp !== null) return { ...state, pendingOp: operation }
    return operation === 'subtract' ? startNumber(state, '-') : state
  }
  if (state.pendingOp === null) {
    return { ...state, left: Number(state.display), pendingOp: operation, input: 'empty' }
  }
  return requestPendingOp(state, { type: 'chain', nextOp: operation })
}

function inputEquals(state: CalculatorState): CalculatorState {
  if (isLoneMinus(state) || state.input === 'empty') return state
  return requestPendingOp(state, { type: 'equals' })
}

function inputSqrt(state: CalculatorState): CalculatorState {
  if (isLoneMinus(state) || state.input === 'empty') return state
  return {
    ...state,
    request: { operation: 'sqrt', a: Number(state.display), then: { type: 'operand' } },
  }
}

function applyResult(state: CalculatorState, result: number): CalculatorState {
  if (state.request === null) return state
  const display = String(result) // Step 4 replaces this with formatNumber
  const then = state.request.then
  switch (then.type) {
    case 'chain':
      return { ...state, request: null, display, input: 'empty', left: result, pendingOp: then.nextOp }
    case 'equals':
      return { ...state, request: null, display, input: 'value', left: null, pendingOp: null }
    case 'operand':
      return { ...state, request: null, display, input: 'value' }
  }
}

function applyFailure(state: CalculatorState, message: string): CalculatorState {
  if (state.request === null) return state
  return { ...initialState, error: message }
}

function assertNever(action: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(action)}`)
}
