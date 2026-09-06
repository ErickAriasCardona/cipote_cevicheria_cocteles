import type { CSSProperties, ReactNode } from 'react'

export type StatusPillVariant = 'positive' | 'neutral' | 'destructive' | 'role'

export interface StatusPillProps {
  variant?: StatusPillVariant
  dot?: boolean
  children: ReactNode
  style?: CSSProperties
}

export function StatusPill({
  variant = 'positive',
  dot = false,
  children,
  style,
}: StatusPillProps) {
  let colorStyle: CSSProperties = {}

  switch (variant) {
    case 'positive':
      colorStyle = {
        color: 'var(--green-text)',
        border: '1px solid rgba(46, 158, 91, 0.3)',
        background:
          'var(--sheen), linear-gradient(160deg, rgba(46, 158, 91, 0.2), rgba(46, 158, 91, 0.06))',
      }
      break
    case 'neutral':
      colorStyle = {
        color: 'var(--text-secondary)',
        border: '1px solid rgba(120, 120, 130, 0.22)',
        background:
          'var(--sheen), linear-gradient(160deg, rgba(120, 120, 130, 0.16), rgba(120, 120, 130, 0.05))',
      }
      break
    case 'destructive':
      colorStyle = {
        color: 'var(--red-text)',
        border: '1px solid rgba(228, 41, 38, 0.3)',
        background:
          'var(--sheen), linear-gradient(160deg, rgba(228, 41, 38, 0.2), rgba(228, 41, 38, 0.06))',
      }
      break
    case 'role':
      colorStyle = {
        color: 'var(--sec-active-color)',
        border: '1px solid rgba(65, 175, 224, 0.35)',
        background:
          'var(--sheen), linear-gradient(160deg, rgba(65, 175, 224, 0.34), rgba(65, 175, 224, 0.14))',
      }
      break
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 700,
        boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
        lineHeight: 1,
        ...colorStyle,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background:
              variant === 'positive'
                ? 'var(--brand-green)'
                : variant === 'destructive'
                  ? 'var(--brand-red)'
                  : 'var(--brand-blue)',
            boxShadow:
              variant === 'positive'
                ? 'var(--green-dot-shadow)'
                : 'none',
          }}
        />
      )}
      {children}
    </span>
  )
}
