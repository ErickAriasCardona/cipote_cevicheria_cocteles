import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  tint?: 'none' | 'red' | 'blue' | 'green' | 'navy'
  padding?: string | number
  radius?: string | number
  className?: string
  style?: CSSProperties
}

const TINT_GRADIENTS: Record<NonNullable<GlassCardProps['tint']>, string> = {
  none: '',
  red: 'linear-gradient(160deg, rgba(228, 41, 38, 0.24), rgba(228, 41, 38, 0.06)), ',
  blue: 'linear-gradient(160deg, rgba(65, 175, 224, 0.26), rgba(65, 175, 224, 0.08)), ',
  green: 'linear-gradient(160deg, rgba(46, 158, 91, 0.24), rgba(46, 158, 91, 0.06)), ',
  navy: 'linear-gradient(160deg, rgba(20, 40, 70, 0.28), rgba(65, 175, 224, 0.1)), ',
}

export function GlassCard({
  children,
  tint = 'none',
  padding = '28px 32px',
  radius = '24px',
  style,
  ...props
}: GlassCardProps) {
  const tintPrefix = TINT_GRADIENTS[tint]

  const baseStyle: CSSProperties = {
    background: `${tintPrefix}var(--sheen), var(--glass-bg)`,
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: '1px solid var(--glass-border)',
    borderRadius: radius,
    boxShadow: 'var(--glass-shadow)',
    padding,
    boxSizing: 'border-box',
    position: 'relative',
    ...style,
  }

  return (
    <div style={baseStyle} {...props}>
      {children}
    </div>
  )
}
