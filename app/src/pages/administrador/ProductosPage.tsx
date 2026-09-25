import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProductoForm } from '../../components/productos/ProductoForm'
import { ProductosTable } from '../../components/productos/ProductosTable'
import { productoTamanoPrecioService } from '../../services/productoTamanoPrecioService'
import { productosService } from '../../services/productosService'
import { ventasService } from '../../services/ventasService'
import { insumosService } from '../../services/insumosService'
import { tamanoVasoService } from '../../services/tamanoVasoService'
import type { CrearProductoInput, Producto } from '../../types/producto'
import type {
  ComboTamanoPrecioInput,
  NuevoTamanoPrecioInput,
  ProductoTamanoPrecio,
} from '../../types/productoTamanoPrecio'
import type { TamanoVaso, CategoriaTamanoVaso } from '../../types/tamanoVaso'
import type { Insumo } from '../../types/insumo'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { ProductoBloqueadoModal } from '../../components/productos/ProductoBloqueadoModal'

/**
 * Pantalla de gestión de productos y precios por tamaño (BD-02.2, RF-03.1/HU-03.1).
 */
export function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [tamanosVaso, setTamanosVaso] = useState<TamanoVaso[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [precios, setPrecios] = useState<ProductoTamanoPrecio[]>([])
  const [productoExpandidoId, setProductoExpandidoId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productoBloqueado, setProductoBloqueado] = useState<{
    producto: Producto
    motivo: 'ventas' | 'promocion' | 'otro'
    mensajeDetalle?: string
  } | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaProductos, listaTamanosVaso, listaPrecios, listaInsumos] = await Promise.all([
        productosService.listarProductos(),
        ventasService.listarTamanosVasoActivos(),
        productoTamanoPrecioService.listarTodos(),
        insumosService.listarInsumos(),
      ])
      setProductos(listaProductos)
      setTamanosVaso(listaTamanosVaso)
      setPrecios(listaPrecios)
      setInsumos(listaInsumos)
      setProductoExpandidoId((actual) => {
        if (actual && listaProductos.some((p) => p.id === actual)) return actual
        // Abrir "E2E Vulcano Coctel" si existe para mostrarlo como ejemplo
        const vulcano = listaProductos.find((p) => p.nombre.toLowerCase().includes('vulcano'))
        return vulcano?.id || null
      })
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

  function handleToggleEditar(id: string) {
    setProductoExpandidoId((actual) => (actual === id ? null : id))
  }

  async function handleCrear(input: CrearProductoInput, tamanos: NuevoTamanoPrecioInput[]) {
    const nuevo = await productosService.crearProducto(input)
    if (input.categoria !== 'otro' && input.categoria !== 'adicionales') {
      // input.categoria ya está acotado a 'ceviche' | 'granizado' | 'bebida'
      // en esta rama (el branch 'otro' y 'adicionales' no mandan tamaños, ver ProductoForm).
      const categoria = input.categoria as CategoriaTamanoVaso
      for (const tamano of tamanos) {
        const tamanoVaso = await tamanoVasoService.resolverOCrear({
          categoria,
          tipoUnidad: tamano.tipoUnidad,
          valorUnidad: tamano.valorUnidad,
        })
        await productoTamanoPrecioService.crear({
          productoId: nuevo.id,
          tamanoVasoId: tamanoVaso.id,
          precio: tamano.precio,
        })
      }
    }
    setProductoExpandidoId(nuevo.id)
    await cargarDatos()
  }

  async function handleCambiarActivoProducto(id: string, activo: boolean) {
    await productosService.actualizarProducto(id, { activo })
    await cargarDatos()
  }

  async function handleToggleEnCartaProducto(id: string, enCarta: boolean) {
    await productosService.actualizarProducto(id, { enCarta })
    await cargarDatos()
  }

  async function handleEliminarProducto(id: string, _nombre: string) {
    setError(null)
    const prod = productos.find((p) => p.id === id) || null
    try {
      await productosService.eliminarProducto(id)
      if (productoExpandidoId === id) {
        setProductoExpandidoId(null)
      }
      await cargarDatos()
    } catch (err: unknown) {
      const errObj = err as { codigo?: string; motivo?: 'ventas' | 'promocion'; message?: string }
      if (errObj?.codigo === '23503' && prod) {
        setProductoBloqueado({
          producto: prod,
          motivo: errObj.motivo || 'ventas',
          mensajeDetalle: errObj.message,
        })
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto.')
      }
    }
  }

  async function handleDesactivarDesdeModal(producto: Producto) {
    await handleCambiarActivoProducto(producto.id, false)
  }

  async function handleCrearTamanoPrecio(input: ComboTamanoPrecioInput) {
    const producto = productos.find((p) => p.id === input.productoId)
    if (!producto || producto.categoria === 'otro' || producto.categoria === 'adicionales') return
    const tamanoVaso = await tamanoVasoService.resolverOCrear({
      categoria: producto.categoria as CategoriaTamanoVaso,
      tipoUnidad: input.tipoUnidad,
      valorUnidad: input.valorUnidad,
    })
    await productoTamanoPrecioService.crear({
      productoId: input.productoId,
      tamanoVasoId: tamanoVaso.id,
      precio: input.precio,
    })
    await cargarDatos()
  }

  async function handleActualizarPrecioTamano(tamanoVasoId: string, precio: number) {
    if (!productoExpandidoId) return
    await productoTamanoPrecioService.actualizar(productoExpandidoId, tamanoVasoId, { precio })
    await cargarDatos()
  }

  async function handleCambiarActivoTamano(tamanoVasoId: string, activo: boolean) {
    if (!productoExpandidoId) return
    await productoTamanoPrecioService.actualizar(productoExpandidoId, tamanoVasoId, { activo })
    await cargarDatos()
  }

  async function handleEliminarTamanoPrecio(tamanoVasoId: string, _etiqueta: string) {
    if (!productoExpandidoId) return
    setError(null)
    try {
      await productoTamanoPrecioService.eliminar(productoExpandidoId, tamanoVasoId)
      await cargarDatos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la presentación.')
    }
  }

  async function handleActualizarOtro(productoId: string, precio: number, descripcion: string) {
    await productosService.actualizarProducto(productoId, {
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
          <div className="productos-layout-grid">
            {/* Columna Izquierda: Formulario Nuevo Producto */}
            <div>
              <ProductoForm
                insumos={insumos}
                productos={productos}
                precios={precios}
                tamanosVaso={tamanosVaso}
                onCrear={handleCrear}
              />
            </div>

            {/* Columna Derecha: Catálogo de Productos con Amplitud Optimizada */}
            <GlassCard padding={22}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Catálogo de Productos</h3>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
              <ProductosTable
                productos={productos}
                conteoTamanosActivos={conteoTamanosActivos}
                productoExpandidoId={productoExpandidoId}
                onToggleEditar={handleToggleEditar}
                onCambiarActivo={handleCambiarActivoProducto}
                onToggleEnCarta={handleToggleEnCartaProducto}
                onEliminar={handleEliminarProducto}
                precios={precios}
                tamanosVaso={tamanosVaso}
                insumos={insumos}
                onCrearTamanoPrecio={handleCrearTamanoPrecio}
                onActualizarPrecioTamano={handleActualizarPrecioTamano}
                onCambiarActivoTamano={handleCambiarActivoTamano}
                onEliminarTamanoPrecio={handleEliminarTamanoPrecio}
                onActualizarOtro={handleActualizarOtro}
              />
            </GlassCard>
          </div>
        )}

        <ProductoBloqueadoModal
          abierto={productoBloqueado !== null}
          producto={productoBloqueado?.producto ?? null}
          motivo={productoBloqueado?.motivo ?? 'ventas'}
          mensajeDetalle={productoBloqueado?.mensajeDetalle}
          onDesactivar={handleDesactivarDesdeModal}
          onCerrar={() => setProductoBloqueado(null)}
        />
      </div>
    </AppShell>
  )
}
