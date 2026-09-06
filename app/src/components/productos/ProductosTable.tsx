import { Fragment, useState } from 'react'
import type { Producto } from '../../types/producto'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type {
  CrearProductoTamanoPrecioInput,
  ProductoTamanoPrecio,
} from '../../types/productoTamanoPrecio'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { StatusPill } from '../ui/StatusPill'
import { ProductoTamanoPrecioForm } from './ProductoTamanoPrecioForm'
import { ProductoTamanoPrecioTable } from './ProductoTamanoPrecioTable'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface ProductosTableProps {
  productos: Producto[]
  conteoTamanosActivos: Map<string, number>
  productoExpandidoId: string | null
  onToggleEditar: (id: string) => void
  onCambiarActivo: (id: string, activo: boolean) => void
  onEliminar: (id: string, nombre: string) => Promise<void>
  precios: ProductoTamanoPrecio[]
  tamanosVaso: TamanoVaso[]
  onCrearTamanoPrecio: (input: CrearProductoTamanoPrecioInput) => Promise<void>
  onActualizarPrecioTamano: (tamanoVasoId: string, precio: number) => Promise<void>
  onCambiarActivoTamano: (tamanoVasoId: string, activo: boolean) => Promise<void>
  onEliminarTamanoPrecio: (tamanoVasoId: string, etiqueta: string) => Promise<void>
  onActualizarOtro: (productoId: string, precio: number, descripcion: string) => Promise<void>
}

interface FilaProductoProps {
  producto: Producto
  tamanosActivos: number
  expandido: boolean
  onToggleEditar: (id: string) => void
  onCambiarActivo: ProductosTableProps['onCambiarActivo']
  onEliminar: ProductosTableProps['onEliminar']
}

function etiquetaCategoria(categoria: Producto['categoria']): { texto: string; color: string; bg: string } {
  switch (categoria) {
    case 'ceviche':
      return { texto: 'Ceviche/Cóctel', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' }
    case 'granizado':
      return { texto: 'Granizado', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' }
    case 'bebida':
      return { texto: 'Bebida', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' }
    case 'otro':
    default:
      return { texto: 'Otro', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
  }
}

function IconoEditar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconoPower({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function IconoTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function FilaProducto({
  producto,
  tamanosActivos,
  expandido,
  onToggleEditar,
  onCambiarActivo,
  onEliminar,
}: FilaProductoProps) {
  const { confirmar } = useConfirmacion()
  const catInfo = etiquetaCategoria(producto.categoria)

  async function handleCambiarActivo() {
    const siguienteActivo = !producto.activo
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Activar producto' : 'Desactivar producto',
      mensaje: siguienteActivo
        ? `¿Confirmas activar el producto "${producto.nombre}"? Volverá a estar disponible para venta.`
        : `¿Confirmas desactivar el producto "${producto.nombre}"? Ya no estará disponible para venta en el POS.`,
      textoConfirmar: siguienteActivo ? 'Activar' : 'Desactivar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(producto.id, siguienteActivo)
  }

  async function handleEliminar() {
    const ok = await confirmar({
      titulo: 'Eliminar producto',
      mensaje: `¿Confirmas eliminar permanentemente el producto "${producto.nombre}"? Si ya tiene ventas registradas, la base de datos lo protegerá para no alterar el historial contable.`,
      textoConfirmar: 'Eliminar',
      varianteConfirmar: 'destructive',
    })
    if (!ok) return
    await onEliminar(producto.id, producto.nombre)
  }

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--hr-line)',
        background: expandido ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
        transition: 'background 0.2s ease',
      }}
    >
      <td style={{ padding: '12px 8px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
          {producto.nombre}
        </div>
        {producto.descripcion && (
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
            {producto.descripcion}
          </div>
        )}
      </td>
      <td style={{ padding: '12px 8px', width: 135, whiteSpace: 'nowrap' }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            color: catInfo.color,
            backgroundColor: catInfo.bg,
            display: 'inline-block',
            whiteSpace: 'nowrap',
          }}
        >
          {catInfo.texto}
        </span>
      </td>
      <td style={{ padding: '12px 8px', width: 110, whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-primary)' }}>
        {producto.categoria === 'otro' ? (
          <strong style={{ color: 'var(--brand-green)', fontSize: 13.5 }}>
            {producto.precio !== null
              ? `$${producto.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
              : '—'}
          </strong>
        ) : (
          <StatusPill variant={tamanosActivos > 0 ? 'positive' : 'neutral'}>
            {tamanosActivos > 0 ? `${tamanosActivos} pres.` : 'Sin tamaños'}
          </StatusPill>
        )}
      </td>
      <td style={{ padding: '12px 8px', width: 105, whiteSpace: 'nowrap' }}>
        <button
          type="button"
          className={`btn-estado-toggle ${producto.activo ? 'activo' : 'inactivo'}`}
          onClick={handleCambiarActivo}
          title={producto.activo ? 'Desactivar producto (apagar)' : 'Activar producto (encender)'}
        >
          <IconoPower size={13} />
          <span>{producto.activo ? 'Activo' : 'Inactivo'}</span>
        </button>
      </td>
      <td style={{ padding: '12px 8px', width: 85, whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* 1. Botón Editar / Desplegable (Lápiz) */}
          <button
            type="button"
            title={
              expandido
                ? 'Ocultar tamaños y precios'
                : producto.categoria === 'otro'
                ? 'Editar detalles y precio directo'
                : 'Editar / Configurar tamaños y precios'
            }
            onClick={() => onToggleEditar(producto.id)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: expandido
                ? '1px solid var(--brand-blue)'
                : '1px solid var(--input-border)',
              background: expandido ? 'rgba(59, 130, 246, 0.25)' : 'var(--input-bg)',
              color: expandido ? 'var(--brand-blue)' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: expandido ? '0 0 0 2px rgba(59, 130, 246, 0.25)' : 'none',
            }}
          >
            <IconoEditar />
          </button>

          {/* 2. Botón Eliminar (Trash) */}
          <button
            type="button"
            title="Eliminar producto"
            onClick={handleEliminar}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <IconoTrash />
          </button>
        </div>
      </td>
    </tr>
  )
}

function DetalleProductoOtroInline({
  producto,
  onGuardar,
  onEliminar,
  onCerrar,
}: {
  producto: Producto
  onGuardar: (precio: number, descripcion: string) => Promise<void>
  onEliminar: () => void
  onCerrar: () => void
}) {
  const [precio, setPrecio] = useState(String(producto.precio ?? ''))
  const [descripcion, setDescripcion] = useState(producto.descripcion ?? '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const precioNum = Number(precio)
  const precioValido = Number.isFinite(precioNum) && precioNum > 0
  const hayCambios =
    precioValido &&
    (precioNum !== producto.precio || (descripcion.trim() || null) !== producto.descripcion)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!precioValido) return
    setGuardando(true)
    setMensaje(null)
    try {
      await onGuardar(precioNum, descripcion)
      setMensaje('✓ Cambios guardados correctamente.')
    } catch {
      setMensaje('Error al guardar los cambios.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'var(--tabs-wrap-bg)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h4 style={{ margin: '0 0 3px', fontSize: 15.5, fontWeight: 700, color: '#f59e0b' }}>
            Detalles de "{producto.nombre}" (Categoría: Otros)
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
            Este producto se vende por unidad con precio directo, sin requerir vasos ni mililitros.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Botón Eliminar Producto para Administrador */}
          <button
            type="button"
            onClick={onEliminar}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <IconoTrash />
            <span>Eliminar producto</span>
          </button>

          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: 'none',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Ocultar</span> ✕
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}
      >
        <div style={{ width: 160 }}>
          <Input
            label="Precio unitario ($)"
            id={`precio_${producto.id}`}
            type="number"
            min="0.01"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </div>
        <div style={{ flex: '1 1 240px' }}>
          <Input
            label="Descripción (opcional)"
            id={`desc_${producto.id}`}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: 4 patacones crocantes con salsa"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={guardando || !hayCambios}
          style={{ height: 42, borderRadius: 10 }}
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>

      {mensaje && (
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12.5,
            color: mensaje.startsWith('✓') ? 'var(--brand-green)' : 'var(--brand-red)',
            fontWeight: 600,
          }}
        >
          {mensaje}
        </p>
      )}
    </div>
  )
}

function obtenerTamanosDisponibles(
  producto: Producto,
  precios: ProductoTamanoPrecio[],
  tamanosVaso: TamanoVaso[],
): TamanoVaso[] {
  if (producto.categoria === 'otro') return []
  const filasProducto = precios.filter((p) => p.productoId === producto.id)
  return tamanosVaso
    .filter((t) => {
      if (producto.categoria === 'bebida') return t.tipo === 'bebida' || t.categoria === 'bebida'
      if (producto.categoria === 'granizado') return t.categoria === 'granizado'
      if (producto.categoria === 'ceviche') return t.categoria === 'ceviche' || (!t.categoria && t.tipo === 'vaso')
      return false
    })
    .filter((tamano) => !filasProducto.some((fila) => fila.tamanoVasoId === tamano.id))
}

export function ProductosTable({
  productos,
  conteoTamanosActivos,
  productoExpandidoId,
  onToggleEditar,
  onCambiarActivo,
  onEliminar,
  precios,
  tamanosVaso,
  onCrearTamanoPrecio,
  onActualizarPrecioTamano,
  onCambiarActivoTamano,
  onEliminarTamanoPrecio,
  onActualizarOtro,
}: ProductosTableProps) {
  const { confirmar } = useConfirmacion()

  async function handleConfirmarEliminar(producto: Producto) {
    const ok = await confirmar({
      titulo: 'Eliminar producto',
      mensaje: `¿Confirmas eliminar permanentemente el producto "${producto.nombre}"? Si ya tiene ventas registradas, la base de datos lo protegerá para no alterar el historial contable.`,
      textoConfirmar: 'Eliminar',
      varianteConfirmar: 'destructive',
    })
    if (!ok) return
    await onEliminar(producto.id, producto.nombre)
  }

  if (productos.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '16px 0', fontSize: 13.5 }}>
        Todavía no hay productos registrados.
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr
            style={{
              borderBottom: '2px solid var(--hr-line)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: 'var(--text-faint)',
            }}
          >
            <th style={{ padding: '8px 8px' }}>Nombre</th>
            <th style={{ padding: '8px 8px', width: 135 }}>Categoría</th>
            <th style={{ padding: '8px 8px', width: 110 }}>Presentaciones</th>
            <th style={{ padding: '8px 8px', width: 105 }}>Estado</th>
            <th style={{ padding: '8px 8px', width: 85 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => {
            const expandido = producto.id === productoExpandidoId
            const filasProducto = precios.filter((p) => p.productoId === producto.id)
            const tamanosDisponibles = obtenerTamanosDisponibles(producto, precios, tamanosVaso)
            const catInfo = etiquetaCategoria(producto.categoria)

            return (
              <Fragment key={producto.id}>
                <FilaProducto
                  producto={producto}
                  tamanosActivos={conteoTamanosActivos.get(producto.id) ?? 0}
                  expandido={expandido}
                  onToggleEditar={onToggleEditar}
                  onCambiarActivo={onCambiarActivo}
                  onEliminar={onEliminar}
                />

                {expandido && (
                  <tr key={`${producto.id}-desplegable`}>
                    <td
                      colSpan={5}
                      style={{
                        padding: '16px 8px',
                        background: 'rgba(65, 175, 224, 0.04)',
                        borderBottom: '2px solid var(--hr-line)',
                      }}
                    >
                      {producto.categoria === 'otro' ? (
                        <DetalleProductoOtroInline
                          producto={producto}
                          onGuardar={(precio, desc) => onActualizarOtro(producto.id, precio, desc)}
                          onEliminar={() => handleConfirmarEliminar(producto)}
                          onCerrar={() => onToggleEditar(producto.id)}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            background: 'var(--tabs-wrap-bg)',
                            border: '1px solid rgba(65, 175, 224, 0.35)',
                            borderRadius: 14,
                            padding: '18px 20px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          {/* Cabecera del desplegable con título, botón eliminar producto y cerrar */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 12,
                              paddingBottom: 12,
                              borderBottom: '1px solid var(--hr-line)',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    color: catInfo.color,
                                    backgroundColor: catInfo.bg,
                                  }}
                                >
                                  {catInfo.texto}
                                </span>
                                <h4
                                  style={{
                                    margin: 0,
                                    fontSize: 16,
                                    fontWeight: 800,
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  {producto.categoria === 'bebida'
                                    ? `Presentaciones y Precios: ${producto.nombre}`
                                    : `Tamaños y Precios: ${producto.nombre}`}
                                </h4>
                              </div>
                              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                                {producto.categoria === 'bebida'
                                  ? 'Configura las presentaciones en mililitros y sus precios de venta.'
                                  : producto.categoria === 'granizado'
                                  ? 'Configura los precios específicos para cada tamaño de vaso de granizado.'
                                  : 'Configura los precios específicos para cada tamaño de vaso disponible.'}
                              </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {/* Botón Eliminar Producto para Administrador */}
                              <button
                                type="button"
                                onClick={() => handleConfirmarEliminar(producto)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  color: '#ef4444',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                title={`Eliminar el producto "${producto.nombre}"`}
                              >
                                <IconoTrash />
                                <span>Eliminar producto</span>
                              </button>

                              {/* Botón Ocultar / Cerrar */}
                              <button
                                type="button"
                                onClick={() => onToggleEditar(producto.id)}
                                style={{
                                  background: 'var(--input-bg)',
                                  border: '1px solid var(--border-soft)',
                                  borderRadius: 8,
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <span>Ocultar</span> ✕
                              </button>
                            </div>
                          </div>

                          {/* SECCIÓN EN UNA SOLA COLUMNA: Flujo vertical ordenado y sin cortes */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* 1. Listado de Presentaciones Configuradas */}
                            <div
                              style={{
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--hr-line)',
                                borderRadius: 12,
                                padding: '16px 18px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 10,
                                  flexWrap: 'wrap',
                                  gap: 8,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <h5
                                    style={{
                                      margin: 0,
                                      fontSize: 13.5,
                                      fontWeight: 700,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    Presentaciones configuradas
                                  </h5>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: 999,
                                      background:
                                        filasProducto.length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--input-bg)',
                                      color: filasProducto.length > 0 ? '#10b981' : 'var(--text-secondary)',
                                    }}
                                  >
                                    {filasProducto.length} {filasProducto.length === 1 ? 'tamaño' : 'tamaños'}
                                  </span>
                                </div>
                                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                                  Modifica precios de venta o desactiva presentaciones individuales
                                </span>
                              </div>
                              <ProductoTamanoPrecioTable
                                filas={filasProducto}
                                tamanosVaso={tamanosVaso}
                                onActualizarPrecio={onActualizarPrecioTamano}
                                onCambiarActivo={onCambiarActivoTamano}
                                onEliminar={onEliminarTamanoPrecio}
                              />
                            </div>

                            {/* 2. Formulario Agregar Presentación */}
                            <div
                              style={{
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--hr-line)',
                                borderRadius: 12,
                                padding: '16px 18px',
                              }}
                            >
                              <ProductoTamanoPrecioForm
                                productoId={producto.id}
                                nombreProducto={producto.nombre}
                                tamanosDisponibles={tamanosDisponibles}
                                onCrear={onCrearTamanoPrecio}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
