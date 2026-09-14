import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { IconoCruz } from '../../components/ui/IconosFormas'
import { IngresoVasosModal } from '../../components/caja/IngresoVasosModal'
import { useSession } from '../../hooks/useSession'
import { cajaService } from '../../services/cajaService'
import { categoriasGastoService } from '../../services/categoriasGastoService'
import { gastosService } from '../../services/gastosService'
import type { CategoriaGasto } from '../../types/categoriaGasto'
import type { Gasto } from '../../types/gasto'
import type { TurnoCaja } from '../../types/turnoCaja'
import { formatearCOP } from '../../utils/moneda'

export function CajeroGastosPage() {
  const { usuario } = useSession()
  const [turno, setTurno] = useState<TurnoCaja | null>(null)
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  // Formulario de nuevo gasto
  const [categoriaId, setCategoriaId] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // Modal de edición de gasto
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null)
  const [editMonto, setEditMonto] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editCategoriaId, setEditCategoriaId] = useState('')
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null)

  // Modal de ingreso de vasos
  const [modalVasosAbierto, setModalVasosAbierto] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [turnoAbierto, listaCategorias] = await Promise.all([
        cajaService.obtenerTurnoAbierto(),
        categoriasGastoService.listarCategorias(),
      ])
      setTurno(turnoAbierto)
      setCategorias(listaCategorias.filter((c) => c.activo))
      if (listaCategorias.length > 0 && !categoriaId) {
        setCategoriaId(listaCategorias[0].id)
      }

      if (turnoAbierto) {
        const listaGastos = await gastosService.listarGastosTurno(turnoAbierto.id)
        setGastos(listaGastos)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos de gastos.')
    } finally {
      setCargando(false)
    }
  }, [categoriaId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const totalGastosTurno = useMemo(
    () => gastos.reduce((sum, g) => sum + g.monto, 0),
    [gastos],
  )

  async function handleCrearGasto(e: FormEvent) {
    e.preventDefault()
    if (!turno || !usuario) return
    setError(null)
    setExito(null)

    const montoNum = Math.round(Number(monto))
    if (!categoriaId) {
      setError('Selecciona una categoría para el gasto.')
      return
    }
    if (!descripcion.trim()) {
      setError('Ingresa una descripción del gasto.')
      return
    }
    if (!Number.isInteger(montoNum) || montoNum <= 0) {
      setError('El monto debe ser un valor entero mayor a cero.')
      return
    }

    setGuardando(true)
    try {
      await gastosService.crearGasto(
        {
          categoriaId,
          descripcion: descripcion.trim(),
          monto: montoNum,
          origen: 'caja',
          turnoId: turno.id,
        },
        usuario.usuarioId,
      )
      setExito('Gasto de caja registrado correctamente.')
      setMonto('')
      setDescripcion('')
      const actualizados = await gastosService.listarGastosTurno(turno.id)
      setGastos(actualizados)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el gasto.')
    } finally {
      setGuardando(false)
    }
  }

  function abrirEdicion(gasto: Gasto) {
    setGastoEditando(gasto)
    setEditMonto(String(gasto.monto))
    setEditDescripcion(gasto.descripcion)
    setEditCategoriaId(gasto.categoriaId)
    setErrorEdicion(null)
  }

  async function handleGuardarEdicion(e: FormEvent) {
    e.preventDefault()
    if (!gastoEditando || !turno) return
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
      })
      setGastoEditando(null)
      const actualizados = await gastosService.listarGastosTurno(turno.id)
      setGastos(actualizados)
      setExito('Gasto actualizado correctamente. Se registró en el historial de auditoría.')
    } catch (err) {
      setErrorEdicion(err instanceof Error ? err.message : 'No se pudo actualizar el gasto.')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
        {/* Cabecera y Botón de Ingreso de Vasos */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.4px',
              }}
            >
              Gastos de Turno (Caja)
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>
              Registra compras inmediatas o gastos menores realizados con dinero en efectivo de la caja.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setModalVasosAbierto(true)}
          >
            + Ingreso de Vasos para Venta
          </Button>
        </div>

        {cargando ? (
          <GlassCard style={{ textAlign: 'center', padding: '40px 32px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cargando gastos del turno…</p>
          </GlassCard>
        ) : !turno ? (
          <GlassCard style={{ textAlign: 'center', padding: '40px 32px', maxWidth: 540, margin: '20px auto' }}>
            <h2 style={{ fontSize: 20, margin: '0 0 12px', color: 'var(--text-primary)' }}>Turno no abierto</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              No tienes un turno de caja abierto. Debes abrir caja para registrar gastos de turno.
            </p>
            <Link to="/cajero" style={{ textDecoration: 'none' }}>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 700, textDecoration: 'underline' }}>
                Ir al panel de caja para abrir turno →
              </span>
            </Link>
          </GlassCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Tarjeta de Resumen y Formulario */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 24,
              }}
            >
              {/* Formulario de Registro */}
              <GlassCard padding="28px">
                <h2 style={{ margin: '0 0 18px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Registrar Nuevo Gasto de Caja
                </h2>

                {error && (
                  <p role="alert" style={{ color: 'var(--red-text)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                    {error}
                  </p>
                )}
                {exito && (
                  <p style={{ color: 'var(--green-text)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                    {exito}
                  </p>
                )}

                <form onSubmit={handleCrearGasto} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Select
                    id="gasto_categoria"
                    label="Categoría del Gasto"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    required
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </Select>

                  <Input
                    id="gasto_monto"
                    type="number"
                    min="1"
                    step="1"
                    label="Monto en efectivo retirado de caja"
                    placeholder="Ej: 15000"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                  />

                  <Textarea
                    id="gasto_descripcion"
                    label="Descripción del gasto / qué se compró"
                    placeholder="Ej: Compra de limones urgentes en la plaza, hielo adicional, etc."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={guardando}
                    style={{ marginTop: 6 }}
                  >
                    {guardando ? 'Registrando gasto…' : 'Registrar Gasto'}
                  </Button>
                </form>
              </GlassCard>

              {/* Resumen Informativo */}
              <GlassCard padding="28px" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}
                  >
                    Total Gastos en este Turno
                  </span>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: totalGastosTurno > 0 ? 'var(--amber-text)' : 'var(--text-primary)',
                      marginTop: 4,
                      marginBottom: 12,
                    }}
                  >
                    {formatearCOP(totalGastosTurno)}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Este monto se deduce automáticamente del dinero en efectivo que debes entregar al momento de realizar el <strong>cierre de caja</strong>.
                  </p>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: 'rgba(56, 126, 245, 0.08)',
                    border: '1px solid rgba(56, 126, 245, 0.25)',
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong style={{ color: 'var(--brand-blue)', display: 'block', marginBottom: 4 }}>
                    Reglas de auditoría:
                  </strong>
                  Puedes editar la descripción, categoría o monto si te equivocaste al digitarlo. Toda modificación genera un registro histórico para revisión del Administrador. La cajera no puede eliminar gastos.
                </div>
              </GlassCard>
            </div>

            {/* Listado de Gastos del Turno */}
            <GlassCard padding="28px">
              <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                Gastos Realizados en este Turno ({gastos.length})
              </h2>

              {gastos.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: 0 }}>
                  No se han registrado gastos de caja durante el turno actual.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--hr-line)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 700 }}>Hora</th>
                        <th style={{ padding: '10px 12px', fontWeight: 700 }}>Categoría</th>
                        <th style={{ padding: '10px 12px', fontWeight: 700 }}>Descripción</th>
                        <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Monto</th>
                        <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map((g) => (
                        <tr
                          key={g.id}
                          style={{
                            borderBottom: '1px solid var(--hr-line)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                            {new Date(g.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                background: 'rgba(56, 126, 245, 0.15)',
                                color: 'var(--brand-blue)',
                              }}
                            >
                              {g.categoriaNombre}
                            </span>
                          </td>
                          <td style={{ padding: '12px 12px' }}>{g.descripcion}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--amber-text)' }}>
                            {formatearCOP(g.monto)}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => abrirEdicion(g)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid var(--card-border)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                              }}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>

      {/* Modal de Edición de Gasto */}
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
                Editar Gasto de Turno
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
              <Select
                id="edit_categoria"
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
                id="edit_monto"
                type="number"
                min="1"
                step="1"
                label="Monto"
                value={editMonto}
                onChange={(e) => setEditMonto(e.target.value)}
                required
              />

              <Textarea
                id="edit_descripcion"
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

      {/* Modal de Ingreso de Vasos */}
      {usuario && (
        <IngresoVasosModal
          usuarioId={usuario.usuarioId}
          abierto={modalVasosAbierto}
          onCerrar={() => setModalVasosAbierto(false)}
        />
      )}
    </AppShell>
  )
}
