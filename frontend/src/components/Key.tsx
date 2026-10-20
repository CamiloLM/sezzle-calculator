export type KeyVariant = 'digit' | 'operator' | 'action' | 'equals'

interface KeyProps {
  label: string
  /** Accessible name when the label is a symbol (e.g. "÷" is read as "Divide"). */
  name?: string
  variant: KeyVariant
  /** Highlights the operator that is waiting for its second operand. */
  active?: boolean
  /** Extra classes, used for grid spans. */
  className?: string
  onPress: () => void
}

const VARIANT_CLASSES: Record<KeyVariant, string> = {
  digit: 'bg-plum/5 hover:bg-plum/10',
  operator: 'bg-mint hover:brightness-95',
  action: 'bg-peach hover:brightness-95',
  equals: 'bg-lilac hover:brightness-95',
}

export function Key({ label, name, variant, active = false, className = '', onPress }: KeyProps) {
  const colors = active ? 'bg-plum text-mint' : `${VARIANT_CLASSES[variant]} text-plum`
  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={variant === 'operator' ? active : undefined}
      onClick={onPress}
      className={`min-h-14 rounded-2xl text-xl font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum active:scale-95 ${colors} ${className}`}
    >
      {label}
    </button>
  )
}
