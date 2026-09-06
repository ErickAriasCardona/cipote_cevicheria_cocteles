import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  small?: boolean
  options?: SelectOption[]
}

export function Select({ label, error, small, id, options, children, style, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
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
      <select
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
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red-text)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
