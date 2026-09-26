import { useState } from 'react'
import type { FormEvent } from 'react'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { formatearCOP } from '../../utils/moneda'

interface AperturaCajaFormProps {
  /** Nombre del cajero autenticado */
  nombreCajero: string
  onAbrir: (dineroInicial: number) => Promise<void>
}

function IconoCaja() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-blue, #41afe0)' }}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M12 12h.01" />
      <path d="M17 12h.01" />
      <path d="M7 12h.01" />
      <path d="M2 10h20" />
      <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function IconoUsuario() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-blue, #41afe0)' }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

/**
 * Formulario de apertura de caja (BD-03.2, RF-02.1/HU-02.1).
 * Diseño limpio y enfocado: muestra el usuario responsable y el campo de saldo caja apertura.
 */
export function AperturaCajaForm({ nombreCajero, onAbrir }: AperturaCajaFormProps) {
  const [dineroInicial, setDineroInicial] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const montoNumerico = Number(dineroInicial)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const monto = Number(dineroInicial)
    if (!Number.isFinite(monto) || monto < 0) {
      setError('El saldo caja apertura debe ser un número válido mayor o igual a cero.')
      return
    }

    const ok = await confirmar({
      titulo: 'Abrir caja',
      mensaje: `¿Confirmas abrir caja con un saldo inicial de ${formatearCOP(monto)}? Esta acción iniciará el turno en el sistema.`,
      textoConfirmar: 'Abrir caja',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onAbrir(monto)
      setDineroInicial('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la caja.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <GlassCard style={{ maxWidth: 440, width: '100%', margin: '20px auto', padding: '32px 28px', textAlign: 'center' }}>
      {/* Icono Decorativo */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(65, 175, 224, 0.12)',
          border: '1px solid rgba(65, 175, 224, 0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <IconoCaja />
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          margin: '0 0 10px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
        }}
      >
        Apertura de caja
      </h2>

      {/* Chip informativo: solo el nombre del usuario */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 16px',
          borderRadius: 999,
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          marginBottom: 24,
          fontSize: 13,
        }}
      >
        <IconoUsuario />
        <span style={{ color: 'var(--text-secondary)' }}>Usuario:</span>
        <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{nombreCajero}</strong>
      </div>

      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="saldo_caja_apertura"
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Saldo caja apertura
          </label>

          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--brand-blue)',
                pointerEvents: 'none',
              }}
            >
              $
            </span>
            <input
              id="saldo_caja_apertura"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={dineroInicial}
              onChange={(e) => setDineroInicial(e.target.value)}
              autoFocus
              required
              style={{
                width: '100%',
                minHeight: 46,
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: 12,
                padding: '10px 14px 10px 32px',
                color: 'var(--text-primary)',
                fontSize: 17,
                fontWeight: 700,
                fontFamily: 'var(--sans)',
                boxShadow: 'var(--input-shadow)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            />
          </div>

          {Number.isFinite(montoNumerico) && montoNumerico > 0 && (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                padding: '0 2px',
              }}
            >
              <span>Monto a ingresar:</span>
              <strong style={{ color: 'var(--brand-blue)', fontSize: 13 }}>
                {formatearCOP(montoNumerico)}
              </strong>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--red-text)' }}>
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" fullWidth size="lg" disabled={enviando}>
          {enviando ? 'Abriendo caja…' : 'Abrir caja →'}
        </Button>
      </form>
    </GlassCard>
  )
}
