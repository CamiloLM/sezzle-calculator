import { useCalculator } from '../hooks/useCalculator'
import { Display } from './Display'
import { Keypad } from './Keypad'

export function Calculator() {
  const { state, dispatch, onKeyDown } = useCalculator()

  return (
    <section
      aria-label="Calculator"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-4 shadow-xl focus-visible:outline-4 focus-visible:outline-mint"
    >
      <Display display={state.display} pendingOp={state.pendingOp} error={state.error} busy={state.request !== null} />
      <Keypad pendingOp={state.pendingOp} onAction={dispatch} />
      <p className="text-center text-xs text-plum/70">Click the calculator or press Tab to use your keyboard.</p>
    </section>
  )
}
