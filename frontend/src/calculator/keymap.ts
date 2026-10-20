import type { Action, BinaryOperation, Digit } from './types'

const OPERATOR_KEYS: Record<string, BinaryOperation> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '^': 'power',
}

const OTHER_KEYS: Record<string, Action> = {
  '.': { type: 'decimal' },
  r: { type: 'sqrt' },
  '%': { type: 'percent' },
  Enter: { type: 'equals' },
  '=': { type: 'equals' },
  Backspace: { type: 'delete' },
  Escape: { type: 'clear' },
}

function isDigit(key: string): key is Digit {
  return key.length === 1 && key >= '0' && key <= '9'
}

/** Maps a `KeyboardEvent.key` to a calculator action, or null if the key is not used. */
export function actionForKey(key: string): Action | null {
  if (isDigit(key)) return { type: 'digit', digit: key }
  if (Object.hasOwn(OPERATOR_KEYS, key)) return { type: 'operator', operation: OPERATOR_KEYS[key] }
  if (Object.hasOwn(OTHER_KEYS, key)) return OTHER_KEYS[key]
  return null
}
