import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  rounded?: boolean
  label?: string
  children?: ReactNode
}

export function Chip({
  active = false,
  rounded = false,
  label,
  children,
  style,
  ...props
}: ChipProps) {
  const baseStyle: CSSProperties = {
    flex: 1,
    padding: '9px 14px',
    borderRadius: rounded ? 999 : 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
    textAlign: 'center',
    transition: 'all 0.15s ease',
    border: active ? '1px solid var(--opt-active-border)' : '1px solid var(--opt-inactive-border)',
    background: active ? 'var(--opt-active-bg)' : 'var(--opt-inactive-bg)',
    color: active ? 'var(--opt-active-color)' : 'var(--opt-inactive-color)',
    boxShadow: active ? 'var(--opt-active-shadow)' : 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    ...style,
  }

  return (
    <button type="button" style={baseStyle} {...props}>
      {children ?? label}
    </button>
  )
}
