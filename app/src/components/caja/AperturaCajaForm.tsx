import { useState } from 'react'
import type { FormEvent } from 'react'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface AperturaCajaFormProps {
  /** Nombre del cajero autenticado, solo para mostrar (HU-02.1 CA-02: el
   * cajero se asocia automáticamente al usuario autenticado, no es un campo
   * elegible). */
  nombreCajero: string
  onAbrir: (dineroInicial: number) => Promise<void>
}

/**
 * Formulario de apertura de caja (BD-03.2, RF-02.1/HU-02.1). Cada envío crea
 * un turno real en `turnos_caja` vía `cajaService.abrirCaja`.
 */
export function AperturaCajaForm({ nombreCajero, onAbrir }: AperturaCajaFormProps) {
  const [dineroInicial, setDineroInicial] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const monto = Number(dineroInicial)
    if (!Number.isFinite(monto) || monto < 0) {
      setError('El dinero inicial debe ser un número no negativo.')
      return
    }

    const ok = await confirmar({
      titulo: 'Abrir caja',
      mensaje: `¿Confirmas abrir caja con un dinero inicial de $${monto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}? Esta acción inicia un turno y no se puede deshacer desde aquí.`,
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
    <GlassCard style={{ maxWidth: 500, margin: '20px auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
        Apertura de caja
      </h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: 12,
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>Cajero responsable:</span>
        <strong style={{ color: 'var(--text-primary)' }}>{nombreCajero}</strong>
      </div>

      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <Input
          id="dinero_inicial"
          label="Dinero inicial en caja (COP)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={dineroInicial}
          onChange={(e) => setDineroInicial(e.target.value)}
          required
        />

        {error && (
          <p role="alert" style={{ margin: '8px 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--red-text)' }}>
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" fullWidth size="lg" disabled={enviando} style={{ marginTop: 8 }}>
          {enviando ? 'Abriendo caja…' : 'Abrir caja'}
        </Button>
      </form>
    </GlassCard>
  )
}
