import { useCallback, useEffect, useState } from 'react'
import { InsumoCrearModal } from '../../components/insumos/InsumoCrearModal'
import { InsumoEditarModal } from '../../components/insumos/InsumoEditarModal'
import { InsumosTable } from '../../components/insumos/InsumosTable'
import { ConteoInventarioDiarioForm } from '../../components/insumos/ConteoInventarioDiarioForm'
import { KardexMovimientosTable } from '../../components/insumos/KardexMovimientosTable'
import { useSession } from '../../hooks/useSession'
import { insumosService } from '../../services/insumosService'
import { movimientosInventarioService } from '../../services/movimientosInventarioService'
import type { ActualizarInsumoInput, CrearInsumoInput, Insumo } from '../../types/insumo'
import type { MovimientoInventario, RegistrarConteoInventarioInput } from '../../types/movimientoInventario'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

import { ReestablecerInventarioModal } from '../../components/insumos/ReestablecerInventarioModal'

function IconoCatalogo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function IconoKardex() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconoAjusteStock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20v-6M6 20V10M18 20V4M6 10l-2-2m2 2 2-2M12 14l-2-2m2 2 2-2M18 4l-2 2m2-2 2 2" />
    </svg>
  )
}

/**
 * Pantalla de gestión de insumos (BD-02.3, RF-04.1/HU-04.1 y RF-04.2/HU-04.2).
 */
export function InsumosPage() {
  const { usuario } = useSession()
  const [pestanaActiva, setPestanaActiva] = useState<'catalogo' | 'kardex'>('catalogo')
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [conteosRecientes, setConteosRecientes] = useState<MovimientoInventario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [insumoAEditar, setInsumoAEditar] = useState<Insumo | null>(null)
  const [mostrarCrearInsumo, setMostrarCrearInsumo] = useState(false)
  const [mostrarReestablecerModal, setMostrarReestablecerModal] = useState(false)

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
            Administra el catálogo de insumos (ingredientes, vasos, bebidas y empaques), controla su stock
            mediante conteos físicos diarios y audita en el Kardex todos los ingresos, ventas y diferencias de turno.
          </p>
        </div>

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        {/* Pestañas de Navegación: Catálogo vs Kardex + Botón Reestablecer Inventario */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: '1px solid var(--hr-line)',
            paddingBottom: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setPestanaActiva('catalogo')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: pestanaActiva === 'catalogo'
                  ? '1px solid rgba(65, 175, 224, 0.4)'
                  : '1px solid transparent',
                background: pestanaActiva === 'catalogo'
                  ? 'rgba(65, 175, 224, 0.15)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: pestanaActiva === 'catalogo'
                  ? 'var(--brand-blue)'
                  : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <IconoCatalogo />
              Catálogo y Control General
            </button>
            <button
              type="button"
              onClick={() => setPestanaActiva('kardex')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: pestanaActiva === 'kardex'
                  ? '1px solid rgba(65, 175, 224, 0.4)'
                  : '1px solid transparent',
                background: pestanaActiva === 'kardex'
                  ? 'rgba(65, 175, 224, 0.15)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: pestanaActiva === 'kardex'
                  ? 'var(--brand-blue)'
                  : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <IconoKardex />
              Kardex y Auditoría de Movimientos
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarReestablecerModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(46, 158, 91, 0.4)',
              background: 'rgba(46, 158, 91, 0.14)',
              color: 'var(--green-text)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <IconoAjusteStock />
            Reestablecer Inventario del Día / Turno
          </button>
        </div>

        {pestanaActiva === 'catalogo' ? (
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
        ) : (
          <GlassCard padding={22}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
                Kardex y Auditoría de Movimientos
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                Rastreo y auditoría completa de todas las entradas, salidas por ventas (incluyendo bolsas y tapas), ingresos de vasos de cajeras en turno y diferencias calculadas al cierre de caja.
              </p>
            </div>
            <KardexMovimientosTable insumos={insumos} />
          </GlassCard>
        )}

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

        {usuario && (
          <ReestablecerInventarioModal
            usuarioId={usuario.usuarioId}
            abierto={mostrarReestablecerModal}
            onCerrar={() => setMostrarReestablecerModal(false)}
            onExito={cargarInsumos}
          />
        )}
      </div>
    </AppShell>
  )
}
