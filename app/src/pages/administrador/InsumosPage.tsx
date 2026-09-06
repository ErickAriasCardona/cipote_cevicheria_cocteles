import { useCallback, useEffect, useState } from 'react'
import { InsumoForm } from '../../components/insumos/InsumoForm'
import { InsumoEditarModal } from '../../components/insumos/InsumoEditarModal'
import { InsumosTable } from '../../components/insumos/InsumosTable'
import { ConteoInventarioDiarioForm } from '../../components/insumos/ConteoInventarioDiarioForm'
import { useSession } from '../../hooks/useSession'
import { insumosService } from '../../services/insumosService'
import { movimientosInventarioService } from '../../services/movimientosInventarioService'
import type { ActualizarInsumoInput, CrearInsumoInput, Insumo } from '../../types/insumo'
import type { MovimientoInventario, RegistrarConteoInventarioInput } from '../../types/movimientoInventario'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

/**
 * Pantalla de gestión de insumos (BD-02.3, RF-04.1/HU-04.1 y RF-04.2/HU-04.2).
 */
export function InsumosPage() {
  const { usuario } = useSession()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [conteosRecientes, setConteosRecientes] = useState<MovimientoInventario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [insumoAEditar, setInsumoAEditar] = useState<Insumo | null>(null)

  const cargarInsumos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaInsumos, listaConteos] = await Promise.all([
        insumosService.listarInsumos(),
        movimientosInventarioService.listarConteosRecientes(30),
      ])
      setInsumos(listaInsumos)
      setConteosRecientes(listaConteos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el listado de insumos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarInsumos()
  }, [cargarInsumos])

  async function handleCrear(input: CrearInsumoInput) {
    await insumosService.crearInsumo(input)
    await cargarInsumos()
  }

  async function handleCambiarActivo(id: string, activo: boolean) {
    await insumosService.actualizarInsumo(id, { activo })
    await cargarInsumos()
  }

  async function handleActualizarStockMinimo(id: string, stockMinimo: number) {
    await insumosService.actualizarInsumo(id, { stockMinimo })
    await cargarInsumos()
  }

  async function handleGuardarEdicion(id: string, cambios: ActualizarInsumoInput) {
    await insumosService.actualizarInsumo(id, cambios)
    await cargarInsumos()
  }

  async function handleRegistrarConteo(input: RegistrarConteoInventarioInput) {
    if (!usuario) throw new Error('Sesión no resuelta; recarga la página e intenta de nuevo.')
    await movimientosInventarioService.registrarConteoInventario(input)
    await cargarInsumos()
  }

  const tiposPersonalizados = Array.from(
    new Set(insumos.map((i) => i.tipo).filter((t) => Boolean(t) && t !== 'vaso' && t !== 'otro')),
  )

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Gestión de Insumos
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Administra los ingredientes, vasos y el conteo de inventario diario general.
          </p>
        </div>

        <InsumoForm
          tiposPersonalizados={tiposPersonalizados}
          insumosExistentes={insumos}
          onCrear={handleCrear}
          onActualizar={handleGuardarEdicion}
        />

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        <GlassCard padding={20}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Insumos Registrados</h3>
          {cargando ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando insumos…</p>
          ) : (
            <InsumosTable
              insumos={insumos}
              onCambiarActivo={handleCambiarActivo}
              onActualizarStockMinimo={handleActualizarStockMinimo}
              onEditar={setInsumoAEditar}
            />
          )}
        </GlassCard>

        <InsumoEditarModal
          insumo={insumoAEditar}
          tiposPersonalizados={tiposPersonalizados}
          abierto={insumoAEditar !== null}
          onCerrar={() => setInsumoAEditar(null)}
          onGuardar={handleGuardarEdicion}
        />

        <GlassCard tint="blue" padding={22}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
              Control Diario de Inventario General (Apertura y Cierre)
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              Registra el conteo físico de inventario general por insumo (vasos, bolsas, ingredientes) tanto al inicio (apertura) como al final (cierre) de la jornada. El stock actual queda actualizado al valor contado.
            </p>
          </div>

          {!cargando && usuario && (
            <ConteoInventarioDiarioForm
              insumos={insumos}
              usuarioId={usuario.usuarioId}
              conteosRecientes={conteosRecientes}
              onRegistrar={handleRegistrarConteo}
            />
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
