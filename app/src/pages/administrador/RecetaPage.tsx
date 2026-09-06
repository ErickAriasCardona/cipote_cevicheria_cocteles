import { useCallback, useEffect, useState } from 'react'
import { RecetaForm } from '../../components/receta/RecetaForm'
import { RecetaTable } from '../../components/receta/RecetaTable'
import { insumosService } from '../../services/insumosService'
import { productosService } from '../../services/productosService'
import { recetaService } from '../../services/recetaService'
import type { Insumo } from '../../types/insumo'
import type { Producto } from '../../types/producto'
import type { CrearRecetaInput, ProductoReceta } from '../../types/productoReceta'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { Select } from '../../components/ui/Select'

/**
 * Configuración de receta evolutiva por producto (BD-02.4, RF-04.3/HU-04.3).
 */
export function RecetaPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [productoId, setProductoId] = useState('')
  const [reglas, setReglas] = useState<ProductoReceta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarCatalogos() {
      setCargando(true)
      setError(null)
      try {
        const [listaProductos, listaInsumos] = await Promise.all([
          productosService.listarProductos(),
          insumosService.listarInsumos(),
        ])
        setProductos(listaProductos)
        setInsumos(listaInsumos)
        setProductoId((actual) => actual || listaProductos[0]?.id || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los catálogos.')
      } finally {
        setCargando(false)
      }
    }
    cargarCatalogos()
  }, [])

  const cargarReceta = useCallback(async (idProducto: string) => {
    if (!idProducto) {
      setReglas([])
      return
    }
    try {
      const lista = await recetaService.listarRecetaPorProducto(idProducto)
      setReglas(lista)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la receta del producto.')
    }
  }, [])

  useEffect(() => {
    cargarReceta(productoId)
  }, [productoId, cargarReceta])

  async function handleCrear(input: CrearRecetaInput) {
    await recetaService.crearRegla(input)
    await cargarReceta(productoId)
  }

  async function handleActualizarCantidad(
    insumoId: string,
    condicion: ProductoReceta['condicion'],
    cantidad: number,
  ) {
    await recetaService.actualizarRegla(productoId, insumoId, condicion, { cantidad })
    await cargarReceta(productoId)
  }

  async function handleCambiarActivo(
    insumoId: string,
    condicion: ProductoReceta['condicion'],
    activo: boolean,
  ) {
    await recetaService.actualizarRegla(productoId, insumoId, condicion, { activo })
    await cargarReceta(productoId)
  }

  const productoActual = productos.find((p) => p.id === productoId)

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Recetas Evolutivas
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Configura las reglas de deducción de insumos por producto y condición de entrega.
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
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando catálogos…</p>
          </GlassCard>
        ) : productos.length === 0 ? (
          <GlassCard padding={20}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>
              Registra al menos un producto antes de configurar su receta.
            </p>
          </GlassCard>
        ) : (
          <>
            <GlassCard padding={18}>
              <div style={{ maxWidth: 360 }}>
                <Select
                  label="Seleccionar Producto"
                  id="producto_id"
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  options={productos.map((p) => ({ value: p.id, label: p.nombre }))}
                />
              </div>
            </GlassCard>

            <GlassCard padding={20}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
                Ingredientes en la Receta de "{productoActual?.nombre}"
              </h3>
              <RecetaTable
                reglas={reglas}
                insumos={insumos}
                onActualizarCantidad={handleActualizarCantidad}
                onCambiarActivo={handleCambiarActivo}
              />
            </GlassCard>

            <GlassCard tint="blue" padding={20}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
                  Agregar Ingrediente a "{productoActual?.nombre}"
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Define el insumo, la cantidad a descontar y bajo qué condición aplica.
                </p>
              </div>

              <RecetaForm productoId={productoId} insumos={insumos} onCrear={handleCrear} />
            </GlassCard>
          </>
        )}
      </div>
    </AppShell>
  )
}
