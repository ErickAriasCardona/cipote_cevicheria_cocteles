import type { ButtonHTMLAttributes, CSSProperties, ReactNode, Ref } from 'react'

export type ButtonVariant =
  | 'primary'
  | 'blue'
  | 'secondary'
  | 'destructive'
  | 'activate'
  | 'dashed'
  | 'ghost'
  | 'manageActive'
  | 'manageInactive'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ref,
  style,
  disabled,
  ...props
}: ButtonProps) {
  let variantStyle: CSSProperties = {}

  switch (variant) {
    case 'primary':
      variantStyle = {
        background: 'linear-gradient(160deg, #f1544f, var(--brand-red) 45%, #c81e1e)',
        color: '#ffffff',
        border: 'none',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 10px 24px rgba(228, 41, 38, 0.35)',
        fontWeight: 700,
      }
      break
    case 'blue':
      variantStyle = {
        background: 'linear-gradient(160deg, #7cd3f5, var(--brand-blue) 45%, #2b8fc0)',
        color: '#ffffff',
        border: 'none',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 10px 24px rgba(65, 175, 224, 0.4)',
        fontWeight: 700,
      }
      break
    case 'secondary':
      variantStyle = {
        background: 'var(--input-bg)',
        border: '1px solid var(--input-border)',
        color: 'var(--text-primary)',
        boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
        fontWeight: 600,
      }
      break
    case 'destructive':
      variantStyle = {
        background:
          'var(--sheen), linear-gradient(160deg, rgba(228, 41, 38, 0.2), rgba(228, 41, 38, 0.08))',
        border: '1px solid rgba(228, 41, 38, 0.4)',
        color: 'var(--red-text)',
        boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
        fontWeight: 700,
      }
      break
    case 'activate':
      variantStyle = {
        background:
          'var(--sheen), linear-gradient(160deg, rgba(46, 158, 91, 0.22), rgba(46, 158, 91, 0.08))',
        border: '1px solid rgba(46, 158, 91, 0.4)',
        color: 'var(--green-text)',
        boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
        fontWeight: 700,
      }
      break
    case 'manageActive':
      variantStyle = {
        background:
          'var(--sheen), linear-gradient(160deg, rgba(65, 175, 224, 0.28), rgba(65, 175, 224, 0.1))',
        border: '1px solid rgba(65, 175, 224, 0.4)',
        color: 'var(--sec-active-color)',
        borderRadius: 9,
        fontWeight: 700,
      }
      break
    case 'manageInactive':
      variantStyle = {
        background: 'var(--input-bg)',
        border: '1px solid var(--input-border)',
        color: 'var(--text-primary)',
        boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
        borderRadius: 9,
        fontWeight: 600,
      }
      break
    case 'dashed':
      variantStyle = {
        background:
          'var(--sheen), linear-gradient(160deg, rgba(65, 175, 224, 0.14), rgba(65, 175, 224, 0.04))',
        border: '1px dashed rgba(65, 175, 224, 0.4)',
        color: 'var(--text-primary)',
        borderRadius: 12,
        fontWeight: 600,
      }
      break
    case 'ghost':
      variantStyle = {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        fontWeight: 600,
      }
      break
  }

  const sizeStyle: CSSProperties =
    size === 'sm'
      ? { padding: '7px 14px', fontSize: 12 }
      : size === 'lg'
        ? { padding: '16px 28px', fontSize: 16 }
        : { padding: '12px 22px', fontSize: 14 }

  const combinedStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: variantStyle.borderRadius ?? 999,
    fontFamily: 'var(--sans)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
    ...variantStyle,
    ...sizeStyle,
    ...style,
  }

  return (
    <button ref={ref} style={combinedStyle} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
