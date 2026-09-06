import { useCallback, useEffect, useState } from 'react'
import { VentasAdminTable } from '../../components/ventas/VentasAdminTable'
import { ventasService } from '../../services/ventasService'
import type { VentaConEstadoEliminacion } from '../../types/venta'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

/**
 * Pantalla de eliminación/restablecimiento de ventas (BD-07.2, RF-03.6/HU-03.6).
 */
export function VentasPage() {
  const [ventas, setVentas] = useState<VentaConEstadoEliminacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarVentas = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await ventasService.listarVentasAdministrador()
      setVentas(lista)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el listado de ventas.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarVentas()
  }, [cargarVentas])

  async function handleEliminar(ventaId: string) {
    setError(null)
    try {
      await ventasService.eliminarVenta(ventaId)
      await cargarVentas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la venta.')
    }
  }

  async function handleRestablecer(ventaId: string) {
    setError(null)
    try {
      await ventasService.restablecerVenta(ventaId)
      await cargarVentas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la venta.')
    }
  }

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Control de Ventas
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Supervisa las ventas registradas con capacidad de eliminación y restablecimiento auditado.
          </p>
        </div>

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        <GlassCard padding={20}>
          {cargando ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando ventas…</p>
          ) : (
            <VentasAdminTable ventas={ventas} onEliminar={handleEliminar} onRestablecer={handleRestablecer} />
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
