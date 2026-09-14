import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import type { ButtonVariant } from '../ui/Button'

export interface ConfirmDialogProps {
  abierto: boolean
  titulo?: string
  mensaje?: ReactNode
  contenido?: ReactNode
  textoConfirmar?: string
  textoCancelar?: string
  varianteConfirmar?: ButtonVariant
  anchoMaximo?: number | string
  onConfirmar: () => void
  onCancelar: () => void
}

/**
 * Formateador inteligente de mensajes de texto en modales.
 * Reconoce saltos de línea, numeraciones, viñetas, totales, devueltas y notas
 * para darles estructura visual limpia y aspecto de ticket/factura.
 */
function FormattedConfirmMessage({ text }: { text: string }) {
  if (!text) return null

  // Si no contiene saltos de línea ni viñetas, render simple y limpio
  if (!text.includes('\n') && !text.startsWith('*') && !text.startsWith('-') && !/^\d+\./.test(text)) {
    return (
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
        {text}
      </p>
    )
  }

  const rawLines = text.split('\n')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5 }}>
      {rawLines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} style={{ height: 6 }} />
        }

        // Título de sección (ej. DETALLE:, ÍTEMS:, EMPAQUES:, RESUMEN:)
        if (/^(detalle|items|adicionales|empaques|resumen|pago|forma de pago):?$/i.test(trimmed)) {
          return (
            <div
              key={idx}
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
                marginTop: 6,
                marginBottom: 2,
              }}
            >
              {trimmed.replace(/:$/, '')}
            </div>
          )
        }

        // Elemento numerado (ej. 1. 1x Coctel de Camarón...)
        const matchNum = trimmed.match(/^(\d+)[\.\)]\s*(.*)/)
        if (matchNum) {
          const [, num, itemRest] = matchNum
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                padding: '4px 0',
                borderBottom: '1px dashed var(--hr-line)',
              }}
            >
              <span style={{ fontWeight: 800, color: 'var(--brand-blue, #41afe0)', minWidth: 20 }}>
                {num}.
              </span>
              <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>
                {itemRest}
              </span>
            </div>
          )
        }

        // Viñeta (ej. * Domicilio: $3.000 o • Empaques: ...)
        const matchBullet = trimmed.match(/^(\*|-|•)\s*(.*)/)
        if (matchBullet) {
          const [, , bulletRest] = matchBullet
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                padding: '3px 0 3px 6px',
              }}
            >
              <span style={{ color: 'var(--brand-blue, #41afe0)', fontSize: 14, lineHeight: 1 }}>•</span>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{bulletRest}</span>
            </div>
          )
        }

        // Total a cobrar / TOTAL
        if (/^total(\s+a\s+cobrar)?:?/i.test(trimmed) || /total:\s*\$/i.test(trimmed)) {
          return (
            <div
              key={idx}
              style={{
                margin: '8px 0 4px',
                padding: '10px 14px',
                background: 'rgba(228, 41, 38, 0.08)',
                border: '1px solid rgba(228, 41, 38, 0.25)',
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13.5, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Total a cobrar:
              </span>
              <strong style={{ fontSize: 18, fontWeight: 800, color: '#e42926' }}>
                {trimmed.replace(/^total(\s+a\s+cobrar)?:?\s*/i, '')}
              </strong>
            </div>
          )
        }

        // Cambio / Devuelta
        if (/^(cambio|devuelta)/i.test(trimmed) || trimmed.includes('DEVUELTA')) {
          return (
            <div
              key={idx}
              style={{
                margin: '4px 0',
                padding: '8px 12px',
                background: 'rgba(46, 158, 91, 0.12)',
                border: '1px solid rgba(46, 158, 91, 0.35)',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-text, #2e9e5b)' }}>
                Cambio / Devuelta a entregar:
              </span>
              <strong style={{ fontSize: 17, fontWeight: 800, color: 'var(--green-text, #2e9e5b)' }}>
                {trimmed.replace(/^(cambio|devuelta)(\s+a\s+entregar)?:?\s*/i, '')}
              </strong>
            </div>
          )
        }

        // Advertencia / Nota operacional al pie
        if (/^(esta acci|nota|advertencia|atenci)/i.test(trimmed)) {
          return (
            <div
              key={idx}
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.4,
                color: 'var(--text-secondary)',
              }}
            >
              {trimmed}
            </div>
          )
        }

        // Pregunta inicial o párrafo de encabezado
        if (trimmed.startsWith('¿')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: 14.5,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              {trimmed}
            </div>
          )
        }

        // Fila normal
        return (
          <div key={idx} style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {trimmed}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Modal de confirmación accesible con acabado Liquid Glass (overlay + diálogo esmerilado).
 * Permite contenido enriquecido personalizado (ej. Factura POS) o texto con formateo inteligente.
 */
export function ConfirmDialog({
  abierto,
  titulo = 'Confirmar acción',
  mensaje,
  contenido,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  varianteConfirmar = 'primary',
  anchoMaximo,
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
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
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
          background: 'var(--modal-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--modal-border)',
          borderRadius: 20,
          padding: '26px 28px',
          maxWidth: anchoMaximo ?? 480,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--modal-shadow)',
          boxSizing: 'border-box',
        }}
      >
        <h2
          id="confirm-dialog-titulo"
          style={{
            marginTop: 0,
            marginBottom: 14,
            fontSize: 19,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {titulo}
        </h2>

        <div
          id="confirm-dialog-mensaje"
          style={{
            margin: '0 0 18px',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 150px)',
            paddingRight: 4,
          }}
        >
          {contenido ? (
            contenido
          ) : typeof mensaje === 'string' ? (
            <FormattedConfirmMessage text={mensaje} />
          ) : (
            mensaje
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            marginTop: 'auto',
            paddingTop: 14,
            borderTop: '1px solid var(--hr-line)',
          }}
        >
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
