import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProductoForm } from '../../components/productos/ProductoForm'
import { ProductoTamanoPrecioForm } from '../../components/productos/ProductoTamanoPrecioForm'
import { ProductoTamanoPrecioTable } from '../../components/productos/ProductoTamanoPrecioTable'
import { ProductosTable } from '../../components/productos/ProductosTable'
import { productoTamanoPrecioService } from '../../services/productoTamanoPrecioService'
import { productosService } from '../../services/productosService'
import { ventasService } from '../../services/ventasService'
import type { CrearProductoInput, Producto } from '../../types/producto'
import type {
  CrearProductoTamanoPrecioInput,
  NuevoTamanoPrecioInput,
  ProductoTamanoPrecio,
} from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

/**
 * Pantalla de gestión de productos y precios por tamaño (BD-02.2, RF-03.1/HU-03.1).
 */
export function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [tamanosVaso, setTamanosVaso] = useState<TamanoVaso[]>([])
  const [precios, setPrecios] = useState<ProductoTamanoPrecio[]>([])
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaProductos, listaTamanosVaso, listaPrecios] = await Promise.all([
        productosService.listarProductos(),
        ventasService.listarTamanosVasoActivos(),
        productoTamanoPrecioService.listarTodos(),
      ])
      setProductos(listaProductos)
      setTamanosVaso(listaTamanosVaso)
      setPrecios(listaPrecios)
      setProductoSeleccionadoId((actual) => actual || listaProductos[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el listado de productos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const conteoTamanosActivos = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const fila of precios) {
      if (!fila.activo) continue
      mapa.set(fila.productoId, (mapa.get(fila.productoId) ?? 0) + 1)
    }
    return mapa
  }, [precios])

  const filasProductoSeleccionado = useMemo(
    () => precios.filter((fila) => fila.productoId === productoSeleccionadoId),
    [precios, productoSeleccionadoId],
  )

  const productoSeleccionado = productos.find((p) => p.id === productoSeleccionadoId)

  const tamanosDisponiblesParaAgregar = useMemo(() => {
    if (!productoSeleccionado || productoSeleccionado.categoria === 'otro') return []
    const tipoRequerido = productoSeleccionado.categoria === 'bebida' ? 'bebida' : 'vaso'
    return tamanosVaso
      .filter((t) => t.tipo === tipoRequerido)
      .filter((tamano) => !filasProductoSeleccionado.some((fila) => fila.tamanoVasoId === tamano.id))
  }, [productoSeleccionado, tamanosVaso, filasProductoSeleccionado])

  async function handleCrear(input: CrearProductoInput, tamanos: NuevoTamanoPrecioInput[]) {
    const nuevo = await productosService.crearProducto(input)
    if (input.categoria !== 'otro') {
      for (const tamano of tamanos) {
        await productoTamanoPrecioService.crear({
          productoId: nuevo.id,
          tamanoVasoId: tamano.tamanoVasoId,
          precio: tamano.precio,
        })
      }
    }
    setProductoSeleccionadoId(nuevo.id)
    await cargarDatos()
  }

  async function handleCambiarActivoProducto(id: string, activo: boolean) {
    await productosService.actualizarProducto(id, { activo })
    await cargarDatos()
  }

  async function handleCrearTamanoPrecio(input: CrearProductoTamanoPrecioInput) {
    await productoTamanoPrecioService.crear(input)
    await cargarDatos()
  }

  async function handleActualizarPrecioTamano(tamanoVasoId: string, precio: number) {
    if (!productoSeleccionadoId) return
    await productoTamanoPrecioService.actualizar(productoSeleccionadoId, tamanoVasoId, { precio })
    await cargarDatos()
  }

  async function handleCambiarActivoTamano(tamanoVasoId: string, activo: boolean) {
    if (!productoSeleccionadoId) return
    await productoTamanoPrecioService.actualizar(productoSeleccionadoId, tamanoVasoId, { activo })
    await cargarDatos()
  }

  async function handleActualizarOtro(precio: number, descripcion: string) {
    if (!productoSeleccionadoId) return
    await productosService.actualizarProducto(productoSeleccionadoId, {
      precio,
      descripcion: descripcion.trim() || null,
    })
    await cargarDatos()
  }

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Gestión de Productos
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Configura el catálogo de ceviches, bebidas y otros productos, junto con sus precios y presentaciones.
          </p>
        </div>

        <ProductoForm tamanosVaso={tamanosVaso} onCrear={handleCrear} />

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        {cargando ? (
          <GlassCard padding={20}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando productos…</p>
          </GlassCard>
        ) : (
          <>
            <GlassCard padding={20}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Catálogo de Productos</h3>
              <ProductosTable
                productos={productos}
                conteoTamanosActivos={conteoTamanosActivos}
                productoSeleccionadoId={productoSeleccionadoId}
                onSeleccionar={setProductoSeleccionadoId}
                onCambiarActivo={handleCambiarActivoProducto}
              />
            </GlassCard>

            {productoSeleccionado && productoSeleccionado.categoria === 'otro' ? (
              <DetalleProductoOtro
                key={productoSeleccionado.id}
                producto={productoSeleccionado}
                onGuardar={handleActualizarOtro}
              />
            ) : productoSeleccionado ? (
              <GlassCard tint="blue" padding={20}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
                    {productoSeleccionado.categoria === 'bebida'
                      ? `Presentaciones y Precios de "${productoSeleccionado.nombre}"`
                      : `Tamaños y Precios de "${productoSeleccionado.nombre}"`}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    {productoSeleccionado.categoria === 'bebida'
                      ? 'Configura las presentaciones en mililitros disponibles para esta bebida.'
                      : 'Configura los precios específicos para cada tamaño de vaso disponible.'}
                  </p>
                </div>

                <ProductoTamanoPrecioTable
                  filas={filasProductoSeleccionado}
                  tamanosVaso={tamanosVaso}
                  onActualizarPrecio={handleActualizarPrecioTamano}
                  onCambiarActivo={handleCambiarActivoTamano}
                />

                <ProductoTamanoPrecioForm
                  productoId={productoSeleccionado.id}
                  nombreProducto={productoSeleccionado.nombre}
                  tamanosDisponibles={tamanosDisponiblesParaAgregar}
                  onCrear={handleCrearTamanoPrecio}
                />
              </GlassCard>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  )
}

function DetalleProductoOtro({
  producto,
  onGuardar,
}: {
  producto: Producto
  onGuardar: (precio: number, descripcion: string) => Promise<void>
}) {
  const [precio, setPrecio] = useState(String(producto.precio ?? ''))
  const [descripcion, setDescripcion] = useState(producto.descripcion ?? '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const precioNum = Number(precio)
  const precioValido = Number.isFinite(precioNum) && precioNum > 0
  const hayCambios =
    precioValido && (precioNum !== producto.precio || (descripcion.trim() || null) !== producto.descripcion)

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
    <GlassCard tint="none" padding={20} style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>
          Detalles de "{producto.nombre}" (Categoría: Otros)
        </h3>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          Este producto se vende por unidad con precio directo, sin requerir vasos ni mililitros.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
        <div style={{ width: 160 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 6,
            }}
          >
            Precio de venta ($)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'var(--sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            required
          />
        </div>

        <div style={{ flex: '1 1 240px' }}>
          <label
            style={{
              display: 'block',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 6,
            }}
          >
            Descripción
          </label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del producto..."
            style={{
              width: '100%',
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'var(--sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={guardando || !hayCambios}
          style={{
            background: hayCambios ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: hayCambios ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>

        {mensaje && (
          <span style={{ width: '100%', fontSize: 12.5, fontWeight: 600, color: 'var(--brand-green)' }}>
            {mensaje}
          </span>
        )}
      </form>
    </GlassCard>
  )
}
