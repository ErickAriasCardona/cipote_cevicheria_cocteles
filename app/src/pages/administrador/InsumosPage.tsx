import { useCallback, useEffect, useState } from 'react'
import { InsumoCrearModal } from '../../components/insumos/InsumoCrearModal'
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
  const [mostrarCrearInsumo, setMostrarCrearInsumo] = useState(false)

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

  async function handleEliminarInsumo(id: string, _nombre: string) {
    setError(null)
    try {
      await insumosService.eliminarInsumo(id)
      if (insumoAEditar?.id === id) {
        setInsumoAEditar(null)
      }
      await cargarInsumos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el insumo.')
    }
  }

  async function handleRegistrarConteo(input: RegistrarConteoInventarioInput) {
    if (!usuario) throw new Error('Sesión no resuelta; recarga la página e intenta de nuevo.')
    await movimientosInventarioService.registrarConteoInventario(input)
    await cargarInsumos()
  }

  const tiposPersonalizados = Array.from(
    new Set(insumos.map((i) => i.tipo).filter((t) => Boolean(t) && t !== 'vaso' && t !== 'otro')),
  )

  const tiposUnidadPersonalizados = Array.from(
    new Set(insumos.map((i) => i.tipoUnidad).filter((t) => Boolean(t))),
  )

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Gestión de Inventario
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Administra el catálogo de insumos (ingredientes, vasos, bebidas y empaques) y controla su stock
            mediante el conteo físico diario de apertura y cierre de jornada.
          </p>
        </div>

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        {/* Ticket 2026-09-12 (rediseño InsumosPage): 2 columnas lado a lado en
        pantallas anchas, apiladas en angostas. Se usa flexbox con flex-basis
        + flexWrap: 'wrap' (en vez de CSS Grid con @media) para no tener
        que tocar index.css: cuando el ancho disponible cae por debajo de
        ~900px (340 + 560 + gap 20), ya no caben ambas columnas en su base y el
        navegador las apila automáticamente en filas separadas. minWidth 320
        evita que se aplasten en el punto justo antes de apilarse. Proporción
        340/560 (Erick pidió más espacio para la tabla de Insumos Registrados). */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: '1 1 340px', minWidth: 320 }}>
            <GlassCard tint="blue" padding={22}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
                  Control Diario de Inventario General 
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

          <div style={{ flex: '1 1 560px', minWidth: 320 }}>
            <GlassCard padding={20}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Insumos Registrados</h3>
                <button
                  type="button"
                  onClick={() => setMostrarCrearInsumo(true)}
                  title="Agregar insumo"
                  style={{
                    background: 'rgba(65, 175, 224, 0.12)',
                    border: '1px solid rgba(65, 175, 224, 0.3)',
                    color: 'var(--brand-blue)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 8,
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  + Agregar insumo
                </button>
              </div>
              {cargando ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando insumos…</p>
              ) : (
                <InsumosTable
                  insumos={insumos}
                  onCambiarActivo={handleCambiarActivo}
                  onActualizarStockMinimo={handleActualizarStockMinimo}
                  onEditar={setInsumoAEditar}
                  onEliminar={handleEliminarInsumo}
                />
              )}
            </GlassCard>
          </div>
        </div>

        <InsumoCrearModal
          abierto={mostrarCrearInsumo}
          tiposPersonalizados={tiposPersonalizados}
          tiposUnidadPersonalizados={tiposUnidadPersonalizados}
          insumosExistentes={insumos}
          onCerrar={() => setMostrarCrearInsumo(false)}
          onCrear={handleCrear}
          onActualizar={handleGuardarEdicion}
        />

        <InsumoEditarModal
          insumo={insumoAEditar}
          tiposPersonalizados={tiposPersonalizados}
          tiposUnidadPersonalizados={tiposUnidadPersonalizados}
          abierto={insumoAEditar !== null}
          onCerrar={() => setInsumoAEditar(null)}
          onGuardar={handleGuardarEdicion}
        />
      </div>
    </AppShell>
  )
}
