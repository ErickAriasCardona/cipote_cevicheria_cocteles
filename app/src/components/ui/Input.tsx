import type { CSSProperties, InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  small?: boolean
  containerStyle?: CSSProperties
}

export function Input({ label, error, small, id, style, containerStyle, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, ...containerStyle }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: small ? 12 : 13,
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          width: '100%',
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: small ? 9 : 12,
          padding: small ? '8px 10px' : '12px 14px',
          color: 'var(--text-primary)',
          fontSize: small ? 13 : 14.5,
          fontFamily: 'var(--sans)',
          boxShadow: 'var(--input-shadow)',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red-text)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
