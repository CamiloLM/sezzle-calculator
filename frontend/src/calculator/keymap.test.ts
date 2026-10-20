import { describe, expect, it } from 'vitest'
import { actionForKey } from './keymap'
import type { Action } from './types'

describe('actionForKey', () => {
  it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const)('maps %s to a digit', (key) => {
    expect(actionForKey(key)).toEqual({ type: 'digit', digit: key })
  })

  it.each<[string, Action]>([
    ['.', { type: 'decimal' }],
    ['+', { type: 'operator', operation: 'add' }],
    ['-', { type: 'operator', operation: 'subtract' }],
    ['*', { type: 'operator', operation: 'multiply' }],
    ['/', { type: 'operator', operation: 'divide' }],
    ['^', { type: 'operator', operation: 'power' }],
    ['r', { type: 'sqrt' }],
    ['%', { type: 'percent' }],
    ['Enter', { type: 'equals' }],
    ['=', { type: 'equals' }],
    ['Backspace', { type: 'delete' }],
    ['Escape', { type: 'clear' }],
  ])('maps %s', (key, expected) => {
    expect(actionForKey(key)).toEqual(expected)
  })

  it.each(['a', 'Tab', ' ', 'R'])('returns null for the unmapped key %j', (key) => {
    expect(actionForKey(key)).toBeNull()
  })
})
