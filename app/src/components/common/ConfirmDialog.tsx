import { useEffect, useRef } from 'react'
import { Button } from '../ui/Button'
import type { ButtonVariant } from '../ui/Button'

export interface ConfirmDialogProps {
  abierto: boolean
  titulo?: string
  mensaje: string
  textoConfirmar?: string
  textoCancelar?: string
  varianteConfirmar?: ButtonVariant
  onConfirmar: () => void
  onCancelar: () => void
}

/**
 * Modal de confirmación accesible con acabado Liquid Glass (overlay + diálogo esmerilado).
 */
export function ConfirmDialog({
  abierto,
  titulo = 'Confirmar acción',
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  varianteConfirmar = 'primary',
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const cancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierto) return

    cancelarRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancelar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [abierto, onCancelar])

  if (!abierto) return null

  return (
    <div
      role="presentation"
      onClick={onCancelar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-titulo"
        aria-describedby="confirm-dialog-mensaje"
        onClick={(event) => event.stopPropagation()}
        style={{
          background: 'var(--sheen), var(--glass-bg)',
          backdropFilter: 'blur(28px) saturate(150%)',
          WebkitBackdropFilter: 'blur(28px) saturate(150%)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 20,
          padding: '30px 32px',
          maxWidth: 440,
          width: '100%',
          boxShadow: 'inset 0 1px 0 var(--pill-highlight), 0 30px 70px rgba(0, 0, 0, 0.4)',
          boxSizing: 'border-box',
        }}
      >
        <h2
          id="confirm-dialog-titulo"
          style={{
            marginTop: 0,
            marginBottom: 12,
            fontSize: 19,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {titulo}
        </h2>
        <p
          id="confirm-dialog-mensaje"
          style={{
            margin: '0 0 24px',
            fontSize: 14.5,
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
          }}
        >
          {mensaje}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button
            type="button"
            ref={cancelarRef}
            variant="secondary"
            onClick={onCancelar}
          >
            {textoCancelar}
          </Button>
          <Button
            type="button"
            variant={varianteConfirmar}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  )
}
