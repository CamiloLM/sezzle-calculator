import { describe, expect, it } from 'vitest'
import { calculatorReducer, initialState, MAX_DIGITS } from './reducer'
import type { Action, BinaryOperation, CalculatorState, Digit, PendingRequest } from './types'

function isDigit(char: string): char is Digit {
  return char.length === 1 && char >= '0' && char <= '9'
}

const OPERATORS: Record<string, BinaryOperation> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '^': 'power',
}

/** Turns typed characters into actions: "12.5+3=" -> digits, decimal, operator, equals ('r' is √) */
function keys(input: string): Action[] {
  return [...input].map((char): Action => {
    if (isDigit(char)) return { type: 'digit', digit: char }
    if (char === '.') return { type: 'decimal' }
    if (char === '=') return { type: 'equals' }
    if (char === 'r') return { type: 'sqrt' }
    const operation = OPERATORS[char]
    if (operation) return { type: 'operator', operation }
    throw new Error(`keys(): unsupported character "${char}"`)
  })
}

function resolved(result: number): Action {
  return { type: 'resolved', result }
}

function run(actions: Action[], from: CalculatorState = initialState): CalculatorState {
  return actions.reduce(calculatorReducer, from)
}

const DEL: Action = { type: 'delete' }
const AC: Action = { type: 'clear' }

// States that later parts of the reducer produce, built by hand
const negativeStart: CalculatorState = { ...initialState, display: '-', input: 'typing' }
const afterOperator: CalculatorState = { ...initialState, display: '5', left: 5, pendingOp: 'add' }
const afterResult: CalculatorState = {
  ...initialState,
  display: '8',
  input: 'value',
  lastOp: 'add',
  lastOperand: 3,
}
const afterOperandResult: CalculatorState = {
  ...initialState,
  display: '4',
  input: 'value',
  left: 5,
  pendingOp: 'add',
}
const busy: CalculatorState = {
  ...initialState,
  display: '16',
  input: 'typing',
  request: { operation: 'sqrt', a: 16, then: { type: 'operand' } },
}
const failed: CalculatorState = { ...initialState, error: 'cannot divide by zero' }

describe('number entry', () => {
  it('starts at 0, waiting for a number', () => {
    expect(initialState.display).toBe('0')
    expect(initialState.input).toBe('empty')
  })

  it('appends typed digits', () => {
    const state = run(keys('123'))
    expect(state.display).toBe('123')
    expect(state.input).toBe('typing')
  })

  it('replaces a leading zero with the next digit', () => {
    expect(run(keys('05')).display).toBe('5')
  })

  it('keeps a single zero when zero is typed twice', () => {
    expect(run(keys('00')).display).toBe('0')
  })

  it(`ignores digits beyond the first ${MAX_DIGITS}`, () => {
    expect(run(keys('1234567890123')).display).toBe('123456789012')
  })

  it('counts only digits toward the limit, not the sign or the decimal point', () => {
    expect(run(keys('12345678901.23'), negativeStart).display).toBe('-12345678901.2')
  })

  it('turns a leading decimal point into 0.', () => {
    expect(run(keys('.7')).display).toBe('0.7')
  })

  it('allows only one decimal point per number', () => {
    expect(run(keys('1.5.2')).display).toBe('1.52')
  })

  it('replaces a negative zero with the next digit', () => {
    expect(run(keys('05'), negativeStart).display).toBe('-5')
  })

  it('turns a lone minus followed by a decimal point into -0.', () => {
    expect(run(keys('.'), negativeStart).display).toBe('-0.')
  })

  it('starts a new calculation when a digit follows a result', () => {
    expect(run(keys('7'), afterResult)).toEqual({ ...initialState, display: '7', input: 'typing' })
  })

  it('starts a new calculation when a decimal point follows a result', () => {
    expect(run(keys('.'), afterResult)).toEqual({ ...initialState, display: '0.', input: 'typing' })
  })

  it('keeps the left operand and pending operator when a digit follows an operator', () => {
    expect(run(keys('3'), afterOperator)).toEqual({ ...afterOperator, display: '3', input: 'typing' })
  })

  it('replaces a result used as an operand but keeps the pending operator', () => {
    expect(run(keys('9'), afterOperandResult)).toEqual({
      ...afterOperandResult,
      display: '9',
      input: 'typing',
    })
  })
})

describe('delete', () => {
  it('removes the last character while typing', () => {
    expect(run([...keys('123'), DEL]).display).toBe('12')
  })

  it('shows 0 when the last character is deleted', () => {
    expect(run([...keys('7'), DEL]).display).toBe('0')
  })

  it('does nothing on a result', () => {
    expect(calculatorReducer(afterResult, DEL)).toBe(afterResult)
  })

  it('does nothing right after an operator', () => {
    expect(calculatorReducer(afterOperator, DEL)).toBe(afterOperator)
  })
})

describe('all clear', () => {
  it('returns the initial state', () => {
    expect(run([...keys('12'), AC])).toBe(initialState)
    expect(calculatorReducer(afterOperator, AC)).toBe(initialState)
  })
})

describe('while a request is pending', () => {
  it.each<[string, Action]>([
    ['a digit', { type: 'digit', digit: '1' }],
    ['a decimal point', { type: 'decimal' }],
    ['an operator', { type: 'operator', operation: 'add' }],
    ['equals', { type: 'equals' }],
    ['square root', { type: 'sqrt' }],
    ['delete', DEL],
    ['all clear', AC],
  ])('ignores %s', (_name, action) => {
    expect(calculatorReducer(busy, action)).toBe(busy)
  })
})

describe('after an error', () => {
  it('a digit clears the error and starts a new number', () => {
    expect(run(keys('7'), failed)).toEqual({ ...initialState, display: '7', input: 'typing' })
  })

  it('a decimal point clears the error and shows 0.', () => {
    expect(run(keys('.'), failed)).toEqual({ ...initialState, display: '0.', input: 'typing' })
  })

  it('all clear returns the initial state', () => {
    expect(calculatorReducer(failed, AC)).toBe(initialState)
  })

  it.each<[string, Action]>([
    ['delete', DEL],
    ['plus', { type: 'operator', operation: 'add' }],
    ['minus', { type: 'operator', operation: 'subtract' }],
    ['equals', { type: 'equals' }],
    ['square root', { type: 'sqrt' }],
    ['percent', { type: 'percent' }],
  ])('ignores %s', (_name, action) => {
    expect(calculatorReducer(failed, action)).toBe(failed)
  })
})

describe('operators', () => {
  it('ignores an operator other than minus when there is no number yet', () => {
    expect(run(keys('+'))).toBe(initialState)
  })

  it('starts a negative number when minus is pressed with no number yet', () => {
    expect(run(keys('-'))).toEqual({ ...initialState, display: '-', input: 'typing' })
  })

  it('lets digits follow the minus sign', () => {
    expect(run(keys('-5')).display).toBe('-5')
  })

  it('stores the number as the left operand when an operator follows it', () => {
    expect(run(keys('5+'))).toEqual({ ...initialState, display: '5', left: 5, pendingOp: 'add' })
  })

  it('uses a result as the left operand when an operator follows it', () => {
    expect(run(keys('*'), afterResult)).toMatchObject({ left: 8, pendingOp: 'multiply', input: 'empty' })
  })

  it('replaces the pending operator when another operator follows it', () => {
    const state = run(keys('5*+'))
    expect(state.pendingOp).toBe('add')
    expect(state.request).toBeNull()
  })

  it('treats minus right after an operator as a replacement, not a sign', () => {
    expect(run(keys('5*-')).pendingOp).toBe('subtract')
  })

  it('requests the pending calculation and chains the new operator after a second number', () => {
    const state = run(keys('5+3*'))
    expect(state.request).toEqual({
      operation: 'add',
      a: 5,
      b: 3,
      then: { type: 'chain', nextOp: 'multiply' },
    })
  })

  it('reads a negative first operand from the display', () => {
    expect(run(keys('-5+3=')).request).toMatchObject({ operation: 'add', a: -5, b: 3 })
  })

  it.each([['+'], ['-'], ['*'], ['='], ['r']])('ignores %s on a lone minus sign', (key) => {
    expect(run(keys(key), negativeStart)).toBe(negativeStart)
  })
})

describe('equals', () => {
  it('requests the pending calculation after a second number', () => {
    expect(run(keys('5+3=')).request).toEqual({
      operation: 'add',
      a: 5,
      b: 3,
      then: { type: 'equals' },
    })
  })

  it.each([[''], ['5'], ['5+']])('does nothing after "%s"', (typed) => {
    const state = run(keys(typed))
    expect(calculatorReducer(state, { type: 'equals' })).toBe(state)
  })
})

describe('square root', () => {
  it('is ignored when there is no number yet', () => {
    expect(run(keys('r'))).toBe(initialState)
  })

  it('is ignored right after an operator', () => {
    const state = run(keys('5+'))
    expect(calculatorReducer(state, { type: 'sqrt' })).toBe(state)
  })

  it('requests the square root of the display without a b operand', () => {
    const request = run(keys('16r')).request
    expect(request).toStrictEqual({ operation: 'sqrt', a: 16, then: { type: 'operand' } })
  })

  it('keeps the left operand and pending operator', () => {
    expect(run(keys('5+16r'))).toMatchObject({ left: 5, pendingOp: 'add' })
  })
})

describe('results', () => {
  it('a chain result becomes the left operand of the next operator', () => {
    expect(run([...keys('5+3*'), resolved(8)])).toEqual({
      ...initialState,
      display: '8',
      left: 8,
      pendingOp: 'multiply',
    })
  })

  it('an equals result is shown and ends the calculation', () => {
    expect(run([...keys('5+3='), resolved(8)])).toEqual({
      ...initialState,
      display: '8',
      input: 'value',
    })
  })

  it('an operand result replaces the display and keeps the pending operator', () => {
    expect(run([...keys('5+16r'), resolved(4)])).toEqual({
      ...initialState,
      display: '4',
      input: 'value',
      left: 5,
      pendingOp: 'add',
    })
  })

  it('an operand result is used as the second number by equals', () => {
    expect(run([...keys('5+16r'), resolved(4), ...keys('=')]).request).toMatchObject({
      operation: 'add',
      a: 5,
      b: 4,
    })
  })

  it('ignores a result when no request is pending', () => {
    expect(calculatorReducer(initialState, resolved(8))).toBe(initialState)
  })

  it('ignores a failure when no request is pending', () => {
    const state = run(keys('5'))
    expect(calculatorReducer(state, { type: 'failed', message: 'boom' })).toBe(state)
  })

  it('a failure resets the calculator and shows the error', () => {
    const state = run([...keys('8/0='), { type: 'failed', message: 'cannot divide by zero' }])
    expect(state).toEqual({ ...initialState, error: 'cannot divide by zero' })
  })

  it('evaluates 1 + 2 + 3 - 2 × 5 = left to right as 20', () => {
    const steps: [string, PendingRequest, number][] = [
      ['1+2+', { operation: 'add', a: 1, b: 2, then: { type: 'chain', nextOp: 'add' } }, 3],
      ['3-', { operation: 'add', a: 3, b: 3, then: { type: 'chain', nextOp: 'subtract' } }, 6],
      ['2*', { operation: 'subtract', a: 6, b: 2, then: { type: 'chain', nextOp: 'multiply' } }, 4],
      ['5=', { operation: 'multiply', a: 4, b: 5, then: { type: 'equals' } }, 20],
    ]
    let state = initialState
    for (const [typed, request, result] of steps) {
      state = run(keys(typed), state)
      expect(state.request).toEqual(request)
      state = calculatorReducer(state, resolved(result))
    }
    expect(state.display).toBe('20')
    expect(state.input).toBe('value')
  })
})
