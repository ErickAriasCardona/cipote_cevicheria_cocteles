import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TransferenciasList } from '../../components/transferencias/TransferenciasList'
import { cajaService } from '../../services/cajaService'
import { transferenciasService } from '../../services/transferenciasService'
import type { EstadoTransferencia } from '../../types/ventaPago'
import type { TransferenciaTurno } from '../../services/transferenciasService'
import type { TurnoCaja } from '../../types/turnoCaja'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

/**
 * Pantalla de estado de transferencias (BD-05.2, RF-03.5/HU-03.5).
 */
export function TransferenciasPage() {
  const [turno, setTurno] = useState<TurnoCaja | null>(null)
  const [transferencias, setTransferencias] = useState<TransferenciaTurno[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const turnoAbierto = await cajaService.obtenerTurnoAbierto()
      setTurno(turnoAbierto)
      if (turnoAbierto) {
        const lista = await transferenciasService.listarTransferenciasTurno(turnoAbierto.id)
        setTransferencias(lista)
      } else {
        setTransferencias([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el listado de transferencias.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  async function handleCambiarEstado(pagoId: string, nuevoEstado: EstadoTransferencia) {
    setError(null)
    try {
      await transferenciasService.actualizarEstadoTransferencia(pagoId, nuevoEstado)
      await cargarDatos()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo actualizar el estado de la transferencia.',
      )
    }
  }

  return (
    <AppShell>
      <GlassCard padding="32px 36px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            Transferencias del turno
          </h1>
          <Link
            to="/cajero"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--brand-blue)',
              textDecoration: 'underline',
            }}
          >
            ← Volver al panel de caja
          </Link>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--red-text)', fontWeight: 600, marginBottom: 16 }}>
            {error}
          </p>
        )}

        {cargando ? (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando transferencias…</p>
        ) : !turno ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            No tienes un turno de caja abierto.{' '}
            <Link to="/cajero" style={{ color: 'var(--brand-blue)', fontWeight: 700 }}>
              Abre caja
            </Link>{' '}
            para ver sus transferencias.
          </p>
        ) : (
          <TransferenciasList transferencias={transferencias} onCambiarEstado={handleCambiarEstado} />
        )}
      </GlassCard>
    </AppShell>
  )
}
