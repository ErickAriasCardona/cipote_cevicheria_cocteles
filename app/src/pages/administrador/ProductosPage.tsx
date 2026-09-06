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

  const tamanosDisponiblesParaAgregar = useMemo(
    () =>
      tamanosVaso.filter(
        (tamano) => !filasProductoSeleccionado.some((fila) => fila.tamanoVasoId === tamano.id),
      ),
    [tamanosVaso, filasProductoSeleccionado],
  )

  const productoSeleccionado = productos.find((p) => p.id === productoSeleccionadoId)

  async function handleCrear(input: CrearProductoInput, tamanos: NuevoTamanoPrecioInput[]) {
    const nuevo = await productosService.crearProducto(input)
    for (const tamano of tamanos) {
      await productoTamanoPrecioService.crear({
        productoId: nuevo.id,
        tamanoVasoId: tamano.tamanoVasoId,
        precio: tamano.precio,
      })
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

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Gestión de Productos
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Configura el catálogo de cócteles y ceviches, junto con sus precios por tamaño.
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

            {productoSeleccionado && (
              <GlassCard tint="blue" padding={20}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
                    Tamaños y Precios de "{productoSeleccionado.nombre}"
                  </h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    Configura los precios específicos para cada tamaño de vaso disponible.
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
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
