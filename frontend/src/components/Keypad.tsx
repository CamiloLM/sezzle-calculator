import type { Action, BinaryOperation } from '../calculator/types'
import { Key, type KeyVariant } from './Key'

interface KeyDefinition {
  label: string
  name?: string
  variant: KeyVariant
  action: Action
  className?: string
}

const digit = (d: Action & { type: 'digit' }): KeyDefinition => ({ label: d.digit, variant: 'digit', action: d })

const operator = (label: string, name: string, operation: BinaryOperation): KeyDefinition => ({
  label,
  name,
  variant: 'operator',
  action: { type: 'operator', operation },
})

// Listed row by row; CSS grid auto-placement fills the 4 x 6 layout.
const KEYS: KeyDefinition[] = [
  { label: 'AC', name: 'All clear', variant: 'action', action: { type: 'clear' }, className: 'col-span-2' },
  { label: 'DEL', name: 'Delete', variant: 'action', action: { type: 'delete' } },
  operator('÷', 'Divide', 'divide'),

  { label: '√', name: 'Square root', variant: 'action', action: { type: 'sqrt' } },
  operator('xʸ', 'Power', 'power'),
  { label: '%', name: 'Percent', variant: 'action', action: { type: 'percent' } },
  operator('×', 'Multiply', 'multiply'),

  digit({ type: 'digit', digit: '7' }),
  digit({ type: 'digit', digit: '8' }),
  digit({ type: 'digit', digit: '9' }),
  operator('−', 'Subtract', 'subtract'),

  digit({ type: 'digit', digit: '4' }),
  digit({ type: 'digit', digit: '5' }),
  digit({ type: 'digit', digit: '6' }),
  operator('+', 'Add', 'add'),

  digit({ type: 'digit', digit: '1' }),
  digit({ type: 'digit', digit: '2' }),
  digit({ type: 'digit', digit: '3' }),
  { label: '=', name: 'Equals', variant: 'equals', action: { type: 'equals' }, className: 'row-span-2' },

  { ...digit({ type: 'digit', digit: '0' }), className: 'col-span-2' },
  { label: '.', name: 'Decimal point', variant: 'digit', action: { type: 'decimal' } },
]

interface KeypadProps {
  pendingOp: BinaryOperation | null
  onAction: (action: Action) => void
}

export function Keypad({ pendingOp, onAction }: KeypadProps) {
  return (
    <div className="grid grid-cols-4 grid-rows-6 gap-2">
      {KEYS.map((key) => (
        <Key
          key={key.label}
          label={key.label}
          name={key.name}
          variant={key.variant}
          active={key.action.type === 'operator' && key.action.operation === pendingOp}
          className={key.className}
          onPress={() => onAction(key.action)}
        />
      ))}
    </div>
  )
}
