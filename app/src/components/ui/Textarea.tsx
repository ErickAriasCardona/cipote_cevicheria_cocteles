import type { TextareaHTMLAttributes } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, id, style, ...props }: TextareaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        style={{
          width: '100%',
          minHeight: 64,
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: 12,
          padding: '12px 14px',
          color: 'var(--text-primary)',
          fontSize: 14,
          fontFamily: 'var(--sans)',
          boxShadow: 'var(--input-shadow)',
          outline: 'none',
          boxSizing: 'border-box',
          resize: 'vertical',
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
