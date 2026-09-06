import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CierreCajaForm } from '../../components/caja/CierreCajaForm'
import { ResultadoCierre } from '../../components/caja/ResultadoCierre'
import { cajaService } from '../../services/cajaService'
import { ventasService } from '../../services/ventasService'
import { transferenciasService } from '../../services/transferenciasService'
import type { TransferenciaTurno } from '../../services/transferenciasService'
import type { TurnoCaja } from '../../types/turnoCaja'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type { CerrarCajaInput, CerrarCajaResultado } from '../../types/cierreCaja'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

/**
 * Pantalla de cierre de caja (BD-06.3/06.4/06.5, RF-02.2/02.3 + RF-04.4).
 */
export function CierreCajaPage() {
  const [turno, setTurno] = useState<TurnoCaja | null>(null)
  const [tamanosVaso, setTamanosVaso] = useState<TamanoVaso[]>([])
  const [transferenciasTurno, setTransferenciasTurno] = useState<TransferenciaTurno[]>([])
  const [resultado, setResultado] = useState<CerrarCajaResultado | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [turnoAbierto, listaTamanosVaso] = await Promise.all([
        cajaService.obtenerTurnoAbierto(),
        ventasService.listarTamanosVasoActivos(),
      ])
      setTurno(turnoAbierto)
      setTamanosVaso(listaTamanosVaso)

      if (turnoAbierto) {
        try {
          const transfs = await transferenciasService.listarTransferenciasTurno(turnoAbierto.id)
          setTransferenciasTurno(transfs)
        } catch {
          // Si falla lectura de transferencias no bloquea el cierre
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el cierre de caja.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  async function handleCerrar(input: CerrarCajaInput) {
    const resultadoCierre = await cajaService.cerrarCaja(input)
    setResultado(resultadoCierre)
    setTurno(null)
  }

  return (
    <AppShell>
      {error && (
        <p role="alert" style={{ color: 'var(--red-text)', fontWeight: 600, marginBottom: 16 }}>
          {error}
        </p>
      )}

      {cargando ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px 32px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cargando cierre de caja…</p>
        </GlassCard>
      ) : resultado ? (
        <ResultadoCierre resultado={resultado} tamanosVaso={tamanosVaso} />
      ) : !turno ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px 32px', maxWidth: 540, margin: '20px auto' }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px', color: 'var(--text-primary)' }}>Sin turno abierto</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            No tienes un turno de caja abierto para realizar el cierre.
          </p>
          <Link to="/cajero" style={{ textDecoration: 'none' }}>
            <span style={{ color: 'var(--brand-blue)', fontWeight: 700, textDecoration: 'underline' }}>
              Volver al panel de caja →
            </span>
          </Link>
        </GlassCard>
      ) : (
        <CierreCajaForm
          tamanosVaso={tamanosVaso}
          transferencias={transferenciasTurno}
          onCerrar={handleCerrar}
        />
      )}
    </AppShell>
  )
}
