import { describe, expect, it } from 'vitest'
import { formatNumber } from './format'

describe('formatNumber', () => {
  it.each<[string, number, string]>([
    ['hides floating point noise', 0.30000000000000004, '0.3'],
    ['keeps integers as they are', 10, '10'],
    ['keeps the sign of negative numbers', -2.5, '-2.5'],
    ['rounds to 12 significant digits', 2 / 3, '0.666666666667'],
    ['shows 12-digit integers in full', 123456789012, '123456789012'],
    ['uses exponent notation from 1e12', 1e12, '1e+12'],
    ['uses exponent notation for large numbers', 1.5e20, '1.5e+20'],
    ['uses exponent notation below 1e-6', 1e-7, '1e-7'],
    ['shows negative zero as 0', -0, '0'],
  ])('%s', (_name, input, expected) => {
    expect(formatNumber(input)).toBe(expected)
  })
})
