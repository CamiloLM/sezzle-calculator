const SIGNIFICANT_DIGITS = 12
const MAX_PLAIN = 1e12
const MIN_PLAIN = 1e-6

/** Turns an API result into display text: 12 significant digits, exponent notation outside [1e-6, 1e12). */
export function formatNumber(n: number): string {
  if (n === 0) return '0' // also catches -0
  const rounded = Number(n.toPrecision(SIGNIFICANT_DIGITS))
  const size = Math.abs(rounded)
  if (size >= MAX_PLAIN || size < MIN_PLAIN) return rounded.toExponential()
  return String(rounded)
}
