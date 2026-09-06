import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AperturaCajaForm } from '../../components/caja/AperturaCajaForm'
import { useSession } from '../../hooks/useSession'
import { cajaService } from '../../services/cajaService'
import type { TurnoCaja } from '../../types/turnoCaja'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'

/**
 * Panel del Cajero (BD-01.1, completado en BD-03 con apertura de caja; BD-04
 * agrega el enlace al POS de ventas; BD-05 agrega el enlace a estado de
 * transferencias; BD-06 agrega el enlace a cierre de caja).
 */
export function CajeroDashboardPage() {
  const { usuario } = useSession()
  const [turno, setTurno] = useState<TurnoCaja | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarTurno = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const turnoAbierto = await cajaService.obtenerTurnoAbierto()
      setTurno(turnoAbierto)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el estado de caja.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarTurno()
  }, [cargarTurno])

  async function handleAbrir(dineroInicial: number) {
    if (!usuario) throw new Error('Sesión no resuelta; recarga la página e intenta de nuevo.')
    await cajaService.abrirCaja(usuario.usuarioId, { dineroInicial })
    await cargarTurno()
  }

  const fmt = (n: number) =>
    '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' COP'

  return (
    <AppShell>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error && (
          <p role="alert" style={{ color: 'var(--red-text)', fontWeight: 600, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {cargando ? (
          <GlassCard style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: '36px 32px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Consultando estado de caja…</p>
          </GlassCard>
        ) : turno ? (
          <GlassCard style={{ maxWidth: 540, width: '100%', padding: '40px 40px', textAlign: 'center' }}>
            <h1
              style={{
                margin: '0 0 16px',
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '-0.3px',
                color: 'var(--text-primary)',
              }}
            >
              Panel Cajero
            </h1>

            <div style={{ marginBottom: 30 }}>
              <StatusPill variant="positive" dot>
                Caja Abierta
              </StatusPill>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 4px',
                borderBottom: '1px solid var(--hr-line)',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Dinero Inicial:</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {fmt(turno.dineroInicial)}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 4px',
                borderBottom: '1px solid var(--hr-line)',
                marginBottom: 28,
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Hora de Apertura:</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {new Date(turno.fechaApertura).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <Link to="/cajero/venta" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
              <Button variant="primary" fullWidth size="lg">
                Ir al POS de ventas →
              </Button>
            </Link>

            <Link
              to="/cajero/cierre"
              style={{ textDecoration: 'none', display: 'block', width: '100%', marginTop: 12 }}
            >
              <Button variant="secondary" fullWidth size="md">
                Cerrar caja →
              </Button>
            </Link>

            <div style={{ marginTop: 16 }}>
              <Link
                to="/cajero/transferencias"
                style={{
                  fontSize: 13,
                  color: 'var(--brand-blue)',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                Ver transferencias pendientes
              </Link>
            </div>
          </GlassCard>
        ) : usuario?.rol === 'cajero' ? (
          <AperturaCajaForm nombreCajero={usuario.nombreCompleto} onAbrir={handleAbrir} />
        ) : (
          <GlassCard style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: '36px 32px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay ninguna caja abierta actualmente.</p>
          </GlassCard>
        )}
      </div>
    </AppShell>
  )
}
