import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CategoriaGastoForm } from '../../components/gastos/CategoriaGastoForm'
import { CategoriasGastoTable } from '../../components/gastos/CategoriasGastoTable'
import { GastoForm } from '../../components/gastos/GastoForm'
import { GastosTable } from '../../components/gastos/GastosTable'
import { useSession } from '../../hooks/useSession'
import { categoriasGastoService } from '../../services/categoriasGastoService'
import { gastosService } from '../../services/gastosService'
import type { CategoriaGasto, CrearCategoriaGastoInput } from '../../types/categoriaGasto'
import type { CrearGastoInput, EstadoPagoGasto, Gasto, GastoHistorialEdicion, OrigenGasto } from '../../types/gasto'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { IconoCruz } from '../../components/ui/IconosFormas'
import { formatearCOP } from '../../utils/moneda'

export function GastosPage() {
  const { usuario } = useSession()
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroOrigen, setFiltroOrigen] = useState<'todos' | OrigenGasto>('todos')
  const [filtroEstadoPago, setFiltroEstadoPago] = useState<'todos' | EstadoPagoGasto>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')

  // Modal de Edición
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null)
  const [editMonto, setEditMonto] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editCategoriaId, setEditCategoriaId] = useState('')
  const [editOrigen, setEditOrigen] = useState<OrigenGasto>('administracion')
  const [editEstadoPago, setEditEstadoPago] = useState<EstadoPagoGasto>('pagado')
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null)

  // Modal de Historial de Auditoría
  const [gastoHistorial, setGastoHistorial] = useState<Gasto | null>(null)
  const [historialItems, setHistorialItems] = useState<GastoHistorialEdicion[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaCategorias, listaGastos] = await Promise.all([
        categoriasGastoService.listarCategorias(),
        gastosService.listarGastos({
          fechaInicio: filtroFechaInicio || undefined,
          fechaFin: filtroFechaFin || undefined,
          origen: filtroOrigen,
          estadoPago: filtroEstadoPago,
          categoriaId: filtroCategoria || undefined,
        }),
      ])
      setCategorias(listaCategorias)
      setGastos(listaGastos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información de gastos.')
    } finally {
      setCargando(false)
    }
  }, [filtroFechaInicio, filtroFechaFin, filtroOrigen, filtroEstadoPago, filtroCategoria])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  async function handleCrearCategoria(input: CrearCategoriaGastoInput) {
    if (!usuario) throw new Error('Sesión no resuelta; recarga la página e intenta de nuevo.')
    await categoriasGastoService.crearCategoria(input, usuario.usuarioId)
    await cargarDatos()
  }

  async function handleCambiarActivoCategoria(id: string, activo: boolean) {
    await categoriasGastoService.actualizarCategoria(id, { activo })
    await cargarDatos()
  }

  async function handleRegistrarGasto(input: CrearGastoInput) {
    if (!usuario) throw new Error('Sesión no resuelta; recarga la página e intenta de nuevo.')
    await gastosService.crearGasto(input, usuario.usuarioId)
    await cargarDatos()
  }

  function handleEditar(gasto: Gasto) {
    setGastoEditando(gasto)
    setEditMonto(String(gasto.monto))
    setEditDescripcion(gasto.descripcion)
    setEditCategoriaId(gasto.categoriaId)
    setEditOrigen(gasto.origen)
    setEditEstadoPago(gasto.estadoPago ?? 'pagado')
    setErrorEdicion(null)
  }

  async function handleGuardarEdicion(e: FormEvent) {
    e.preventDefault()
    if (!gastoEditando) return
    setErrorEdicion(null)

    const montoNum = Math.round(Number(editMonto))
    if (!editDescripcion.trim()) {
      setErrorEdicion('La descripción no puede estar vacía.')
      return
    }
    if (!Number.isInteger(montoNum) || montoNum <= 0) {
      setErrorEdicion('El monto debe ser mayor a cero.')
      return
    }

    setGuardandoEdicion(true)
    try {
      await gastosService.actualizarGasto(gastoEditando.id, {
        categoriaId: editCategoriaId,
        descripcion: editDescripcion.trim(),
        monto: montoNum,
        origen: editOrigen,
        estadoPago: editEstadoPago,
      })
      setGastoEditando(null)
      await cargarDatos()
    } catch (err) {
      setErrorEdicion(err instanceof Error ? err.message : 'No se pudo actualizar el gasto.')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  async function handleVerHistorial(gasto: Gasto) {
    setGastoHistorial(gasto)
    setCargandoHistorial(true)
    try {
      const items = await gastosService.obtenerHistorialGasto(gasto.id)
      setHistorialItems(items)
    } catch (err) {
      console.error(err)
    } finally {
      setCargandoHistorial(false)
    }
  }

  const categoriasActivas = categorias.filter((categoria) => categoria.activo)

  // Totales acumulados
  const totalGeneral = useMemo(() => gastos.reduce((acc, g) => acc + g.monto, 0), [gastos])
  const totalCaja = useMemo(
    () => gastos.filter((g) => g.origen === 'caja').reduce((acc, g) => acc + g.monto, 0),
    [gastos],
  )
  const totalAdmin = useMemo(
    () => gastos.filter((g) => g.origen === 'administracion').reduce((acc, g) => acc + g.monto, 0),
    [gastos],
  )
  const totalNoPagado = useMemo(
    () => gastos.filter((g) => g.estadoPago === 'no_pagado').reduce((acc, g) => acc + g.monto, 0),
    [gastos],
  )
  const conteoNoPagados = useMemo(
    () => gastos.filter((g) => g.estadoPago === 'no_pagado').length,
    [gastos],
  )

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Control y Gestión de Gastos
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Supervisa gastos de caja de los turnos y gastos operativos de administración con auditoría completa.
          </p>
        </div>

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        {/* Métricas / Resumen de Gastos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <GlassCard padding="20px">
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total General de Gastos
            </span>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
              {formatearCOP(totalGeneral)}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              {gastos.length} gasto(s) listados
            </span>
          </GlassCard>

          <GlassCard padding="20px">
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-text)', textTransform: 'uppercase' }}>
              Caja Menor (Turnos)
            </span>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--amber-text)', marginTop: 4 }}>
              {formatearCOP(totalCaja)}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              Retirados del cajón de ventas
            </span>
          </GlassCard>

          <GlassCard padding="20px">
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase' }}>
              Administración
            </span>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-blue)', marginTop: 4 }}>
              {formatearCOP(totalAdmin)}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              Compras y egresos generales
            </span>
          </GlassCard>

          <GlassCard padding="20px" tint={totalNoPagado > 0 ? 'red' : undefined}>
            <span style={{ fontSize: 12, fontWeight: 700, color: totalNoPagado > 0 ? '#ef4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Cuentas Pendientes (Por Pagar)
            </span>
            <div style={{ fontSize: 26, fontWeight: 800, color: totalNoPagado > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: 4 }}>
              {formatearCOP(totalNoPagado)}
            </div>
            <span style={{ fontSize: 11.5, color: totalNoPagado > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
              {conteoNoPagados} gasto(s) sin desembolsar
            </span>
          </GlassCard>
        </div>

        {/* Sección en 2 Columnas: Catálogo de Categorías (Col 1) y Registro de Gastos (Col 2) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {/* Columna 1: Catálogo de Categorías */}
          <div style={{ flex: '1 1 420px', minWidth: 320 }}>
            <GlassCard padding={20} style={{ height: '100%', boxSizing: 'border-box' }}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
                  Catálogo de Categorías de Gasto
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Clasificaciones para compras, insumos, servicios, nómina o arriendos.
                </p>
              </div>

              <CategoriaGastoForm onCrear={handleCrearCategoria} />

              {cargando ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando categorías…</p>
              ) : (
                <CategoriasGastoTable
                  categorias={categorias}
                  onCambiarActivo={handleCambiarActivoCategoria}
                />
              )}
            </GlassCard>
          </div>

          {/* Columna 2: Registro de Gastos */}
          <div style={{ flex: '1 1 420px', minWidth: 320 }}>
            <GlassCard tint="blue" padding={20} style={{ height: '100%', boxSizing: 'border-box' }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
                  Registro de Gastos
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Ingresa los desembolsos de dinero vinculándolos a su origen (Caja o Administración).
                </p>
              </div>

              {!cargando && (
                <GastoForm categoriasActivas={categoriasActivas} onRegistrar={handleRegistrarGasto} />
              )}
            </GlassCard>
          </div>
        </div>

        {/* Historial y Auditoría de Gastos (Ancho Completo) */}
        <GlassCard padding={20}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
              Historial y Auditoría de Gastos
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Consulta, filtra y audita los desembolsos registrados por caja y administración con trazabilidad de ediciones.
            </p>
          </div>

          {/* Barra de Filtros */}
          <div
            style={{
              marginBottom: 16,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'var(--input-bg)',
              border: '1px solid var(--card-border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Fuente / Origen
              </label>
              <select
                value={filtroOrigen}
                onChange={(e) => setFiltroOrigen(e.target.value as 'todos' | OrigenGasto)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="todos">Todas las fuentes</option>
                <option value="caja">Caja Menor (Turnos)</option>
                <option value="administracion">Administración (Caja General)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Estado de Pago
              </label>
              <select
                value={filtroEstadoPago}
                onChange={(e) => setFiltroEstadoPago(e.target.value as 'todos' | EstadoPagoGasto)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="todos">Todos los estados</option>
                <option value="pagado">Solo Pagados</option>
                <option value="no_pagado">Solo Pendientes (Por Pagar)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {cargando ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando gastos…</p>
          ) : (
            <GastosTable
              gastos={gastos}
              onEditar={handleEditar}
              onVerHistorial={handleVerHistorial}
            />
          )}
        </GlassCard>
      </div>

      {/* Modal de Edición de Gasto para Administrador */}
      {gastoEditando && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--modal-overlay)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setGastoEditando(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--modal-bg)',
              border: '1px solid var(--modal-border)',
              borderRadius: 20,
              padding: '28px 24px',
              boxShadow: 'var(--modal-shadow)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                Editar Gasto
              </h2>
              <button
                type="button"
                onClick={() => setGastoEditando(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <IconoCruz size={18} strokeWidth={2.4} />
              </button>
            </div>

            {errorEdicion && (
              <p role="alert" style={{ color: 'var(--red-text)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                {errorEdicion}
              </p>
            )}

            <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Select
                  id="edit_admin_origen"
                  label="Fuente de Pago"
                  value={editOrigen}
                  onChange={(e) => setEditOrigen(e.target.value as OrigenGasto)}
                  required
                >
                  <option value="caja">Caja Menor (Turno POS)</option>
                  <option value="administracion">Administrativa (Caja General)</option>
                </Select>

                <Select
                  id="edit_admin_estado_pago"
                  label="Estado de Pago"
                  value={editEstadoPago}
                  onChange={(e) => setEditEstadoPago(e.target.value as EstadoPagoGasto)}
                  required
                >
                  <option value="pagado">Pagado (Desembolsado)</option>
                  <option value="no_pagado">No Pagado (Pendiente)</option>
                </Select>
              </div>

              <Select
                id="edit_admin_categoria"
                label="Categoría"
                value={editCategoriaId}
                onChange={(e) => setEditCategoriaId(e.target.value)}
                required
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </Select>

              <Input
                id="edit_admin_monto"
                type="number"
                min="1"
                step="1"
                label="Monto"
                value={editMonto}
                onChange={(e) => setEditMonto(e.target.value)}
                required
              />

              <Textarea
                id="edit_admin_descripcion"
                label="Descripción"
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                required
              />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button type="button" variant="secondary" onClick={() => setGastoEditando(null)} disabled={guardandoEdicion}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={guardandoEdicion}>
                  {guardandoEdicion ? 'Guardando…' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Historial de Auditoría (Exclusivo Administrador) */}
      {gastoHistorial && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--modal-overlay)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setGastoHistorial(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 580,
              background: 'var(--modal-bg)',
              border: '1px solid var(--modal-border)',
              borderRadius: 20,
              padding: '28px 24px',
              boxShadow: 'var(--modal-shadow)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Historial de Auditoría de Edición
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Gasto: &quot;{gastoHistorial.descripcion}&quot; • Actual: {formatearCOP(gastoHistorial.monto)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGastoHistorial(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <IconoCruz size={18} strokeWidth={2.4} />
              </button>
            </div>

            {cargandoHistorial ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando historial…</p>
            ) : historialItems.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, padding: '16px 0', margin: 0 }}>
                Este gasto no registra ediciones previas (se mantiene con sus valores originales de registro).
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {historialItems.map((h, idx) => (
                  <div
                    key={h.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--hr-line)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--brand-blue)' }}>
                        Edición #{historialItems.length - idx}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {new Date(h.createdAt).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                      <div style={{ padding: '8px', background: 'rgba(228, 41, 38, 0.06)', borderRadius: 8 }}>
                        <div style={{ fontWeight: 700, color: 'var(--red-text)', marginBottom: 2 }}>
                          Valor Anterior:
                        </div>
                        <div>Monto: <strong>{formatearCOP(h.montoAnterior)}</strong></div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{h.descripcionAnterior}</div>
                      </div>

                      <div style={{ padding: '8px', background: 'rgba(46, 158, 91, 0.06)', borderRadius: 8 }}>
                        <div style={{ fontWeight: 700, color: 'var(--green-text)', marginBottom: 2 }}>
                          Valor Modificado:
                        </div>
                        <div>Monto: <strong>{formatearCOP(h.montoNuevo)}</strong></div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{h.descripcionNueva}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
