import type { BinaryOperation } from '../calculator/types'

interface DisplayProps {
  display: string
  pendingOp: BinaryOperation | null
  error: string | null
  busy: boolean
}

const OPERATOR_SYMBOLS: Record<BinaryOperation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
}

/** Smaller text for long numbers so they fit on narrow screens. */
function sizeFor(text: string): string {
  if (text.length <= 10) return 'text-4xl'
  if (text.length <= 14) return 'text-3xl'
  return 'text-2xl'
}

export function Display({ display, pendingOp, error, busy }: DisplayProps) {
  // The reducer uses ASCII "-"; show the typographic minus sign instead.
  const value = display.replaceAll('-', '−')

  return (
    <div className="flex min-h-28 flex-col justify-between rounded-2xl bg-plum p-4 text-white">
      <div className="flex h-5 justify-between text-sm">
        <span className="font-semibold text-mint">{pendingOp ? OPERATOR_SYMBOLS[pendingOp] : ''}</span>
        {busy && <span className="animate-pulse text-peach">Calculating…</span>}
      </div>
      <output
        aria-live="polite"
        className={`block text-right break-all tabular-nums ${error ? 'text-lg text-pink' : sizeFor(value)}`}
      >
        {error ?? value}
      </output>
    </div>
  )
}
