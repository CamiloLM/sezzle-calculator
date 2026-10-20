import { formatNumber } from './format'
import type { Action, BinaryOperation, CalculatorState, Digit } from './types'

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
      return inputPercent(state)
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

/** Asks the backend for `left pendingOp display`, then chains `nextOp`. */
function requestChain(state: CalculatorState, nextOp: BinaryOperation): CalculatorState {
  if (state.pendingOp === null || state.left === null) return state
  return {
    ...state,
    request: {
      operation: state.pendingOp,
      a: state.left,
      b: Number(state.display),
      then: { type: 'chain', nextOp },
    },
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
  return requestChain(state, operation)
}

function inputEquals(state: CalculatorState): CalculatorState {
  if (isLoneMinus(state)) return state
  if (state.pendingOp !== null && state.left !== null) {
    return requestEquals(state, state.pendingOp, state.left)
  }
  if (state.input === 'value' && state.lastOp !== null && state.lastOperand !== null) {
    return repeatEquals(state, state.lastOp, state.lastOperand)
  }
  return state
}

/**
 * `left operation display`, remembered for a repeated equals. Right after an operator
 * the display still shows the left number, so `5 × =` is 5 × 5.
 */
function requestEquals(state: CalculatorState, operation: BinaryOperation, left: number): CalculatorState {
  const b = Number(state.display)
  return {
    ...state,
    lastOp: operation,
    lastOperand: b,
    request: { operation, a: left, b, then: { type: 'equals' } },
  }
}

/** `display lastOp lastOperand`: 5 × 2 = = is 10 × 2. */
function repeatEquals(state: CalculatorState, operation: BinaryOperation, b: number): CalculatorState {
  return {
    ...state,
    request: { operation, a: Number(state.display), b, then: { type: 'equals' } },
  }
}

/** After + or − it is a percent of the left operand (200 + 10 % is 200 + 20), otherwise display / 100. */
function inputPercent(state: CalculatorState): CalculatorState {
  if (isLoneMinus(state) || state.input === 'empty') return state
  const value = Number(state.display)
  const ofLeft = state.pendingOp === 'add' || state.pendingOp === 'subtract'
  const [a, b] = ofLeft && state.left !== null ? [state.left, value] : [value, 1]
  return {
    ...state,
    request: { operation: 'percentage', a, b, then: { type: 'operand' } },
  }
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
  const display = formatNumber(result)
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
