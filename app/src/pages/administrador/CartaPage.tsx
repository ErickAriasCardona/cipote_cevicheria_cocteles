import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { ProductoCartaAdminCard } from '../../components/carta/ProductoCartaAdminCard'
import { PromocionCard } from '../../components/carta/PromocionCard'
import { PromocionCrearModal } from '../../components/carta/PromocionCrearModal'
import { productosService } from '../../services/productosService'
import { ventasService } from '../../services/ventasService'
import { productoTamanoPrecioService } from '../../services/productoTamanoPrecioService'
import { promocionesService } from '../../services/promocionesService'
import type { Producto } from '../../types/producto'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type { ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { PromocionConDetalle } from '../../types/promocion'
import { IconoCruz, IconoPlus } from '../../components/ui/IconosFormas'

export function CartaPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [tamanosVaso, setTamanosVaso] = useState<TamanoVaso[]>([])
  const [precios, setPrecios] = useState<ProductoTamanoPrecio[]>([])
  const [promociones, setPromociones] = useState<PromocionConDetalle[]>([])

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  // Filtros de productos
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState<string>('')

  // Modal de nueva promoción
  const [modalPromoAbierto, setModalPromoAbierto] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaProductos, listaTamanos, listaPrecios, listaPromos] = await Promise.all([
        productosService.listarProductos(),
        ventasService.listarTamanosVasoActivos(),
        productoTamanoPrecioService.listarTodos(),
        promocionesService.listarPromociones(),
      ])
      setProductos(listaProductos)
      setTamanosVaso(listaTamanos)
      setPrecios(listaPrecios)
      setPromociones(listaPromos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de la carta.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  function mostrarExito(msj: string) {
    setMensajeExito(msj)
    setTimeout(() => {
      setMensajeExito((prev) => (prev === msj ? null : prev))
    }, 4000)
  }

  // Filtrado de productos activos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (!p.activo) return false
      if (categoriaFiltro !== 'todos' && p.categoria !== categoriaFiltro) return false
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const coincideNombre = p.nombre.toLowerCase().includes(q)
        const coincideDesc = p.descripcion?.toLowerCase().includes(q)
        if (!coincideNombre && !coincideDesc) return false
      }
      return true
    })
  }, [productos, categoriaFiltro, busqueda])

  // Conteos por categoría
  const conteos = useMemo(() => {
    const activos = productos.filter((p) => p.activo)
    return {
      todos: activos.length,
      ceviche: activos.filter((p) => p.categoria === 'ceviche').length,
      granizado: activos.filter((p) => p.categoria === 'granizado').length,
      bebida: activos.filter((p) => p.categoria === 'bebida').length,
      otro: activos.filter((p) => p.categoria === 'otro').length,
    }
  }, [productos])

  function handleImagenProductoActualizada(prodId: string, nuevaUrl: string) {
    setProductos((prev) =>
      prev.map((p) => (p.id === prodId ? { ...p, imagenUrl: nuevaUrl } : p))
    )
    mostrarExito('¡Imagen del producto actualizada con éxito!')
  }

  async function handleToggleEnCartaProducto(prodId: string, nuevoEstado: boolean) {
    try {
      await productosService.actualizarProducto(prodId, { enCarta: nuevoEstado })
      setProductos((prev) =>
        prev.map((p) => (p.id === prodId ? { ...p, enCarta: nuevoEstado } : p))
      )
      mostrarExito(
        nuevoEstado
          ? '¡Producto activado en la carta pública!'
          : '¡Producto ocultado de la carta pública!'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar visibilidad en la carta.')
    }
  }

  function handlePromocionActualizada() {
    cargarDatos()
    mostrarExito('Promoción actualizada con éxito.')
  }

  function handlePromocionEliminada() {
    cargarDatos()
    mostrarExito('Promoción eliminada con éxito.')
  }

  function handlePromocionCreada() {
    cargarDatos()
    mostrarExito('¡Nueva promoción creada con éxito!')
  }

  return (
    <AppShell rol="administrador">
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Encabezado del módulo */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.5px',
                }}
              >
                Carta y Promociones
              </h1>
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--brand-red), #ff6b6b)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Catálogo Digital
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
              Configura los productos activos en la carta, sube sus fotografías y arma promociones y combos especiales.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setModalPromoAbierto(true)}
            >
              <IconoPlus size={15} style={{ marginRight: 6 }} /> Nueva Promoción
            </Button>
          </div>
        </div>

        {/* Mensajes de retroalimentación */}
        {mensajeExito && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 14,
              background: 'rgba(46, 158, 91, 0.12)',
              border: '1px solid rgba(46, 158, 91, 0.3)',
              color: '#1a7a40',
              fontWeight: 700,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <span>{mensajeExito}</span>
            <button
              type="button"
              onClick={() => setMensajeExito(null)}
              aria-label="Cerrar notificación"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#1a7a40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
            >
              <IconoCruz size={14} strokeWidth={2.4} />
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 14,
              background: 'rgba(228, 41, 38, 0.12)',
              border: '1px solid rgba(228, 41, 38, 0.3)',
              color: '#c81e1e',
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            {error}
          </div>
        )}

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <div
              style={{
                width: 38,
                height: 38,
                border: '3px solid rgba(65, 175, 224, 0.2)',
                borderTopColor: 'var(--brand-blue, #41afe0)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Cargando catálogo de carta y promociones...</span>
          </div>
        ) : (
          /* Cuadrícula Principal de 2 Columnas */
          <div className="carta-layout-grid">
            {/* COLUMNA 1: PRODUCTOS DE LA CARTA */}
            <GlassCard padding="24px 22px" radius={24} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Encabezado Columna 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Productos de la Carta
                    </h2>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(65, 175, 224, 0.14)',
                        color: 'var(--brand-blue, #41afe0)',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {productosFiltrados.length}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Clic en la foto para cambiarla
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Productos activos en el catálogo con los mismos estilos de la sección "Nuestros favoritos".
                </p>
              </div>

              {/* Filtros de Categoría y Buscador */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { key: 'todos', label: 'Todos', count: conteos.todos },
                    { key: 'ceviche', label: 'Ceviches', count: conteos.ceviche },
                    { key: 'granizado', label: 'Granizados', count: conteos.granizado },
                    { key: 'bebida', label: 'Bebidas', count: conteos.bebida },
                    { key: 'otro', label: 'Otros', count: conteos.otro },
                  ].map((tab) => {
                    const active = categoriaFiltro === tab.key
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setCategoriaFiltro(tab.key)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 999,
                          border: active ? '1px solid var(--brand-blue, #41afe0)' : '1px solid var(--input-border)',
                          background: active
                            ? 'linear-gradient(160deg, rgba(65,175,224,0.35), rgba(65,175,224,0.12))'
                            : 'var(--input-bg)',
                          color: active ? '#0d3a52' : 'var(--text-secondary)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{tab.label}</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 5px',
                            borderRadius: 999,
                            background: active ? 'rgba(65,175,224,0.3)' : 'rgba(15,20,30,0.06)',
                          }}
                        >
                          {tab.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Grid de Productos con estilo "Nuestros favoritos" */}
              {productosFiltrados.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: 13.5,
                  }}
                >
                  No se encontraron productos activos con los filtros seleccionados.
                </div>
              ) : (
                <div className="carta-productos-grid">
                  {productosFiltrados.map((prod) => (
                    <ProductoCartaAdminCard
                      key={prod.id}
                      producto={prod}
                      precios={precios}
                      tamanos={tamanosVaso}
                      onImagenActualizada={handleImagenProductoActualizada}
                      onToggleEnCarta={handleToggleEnCartaProducto}
                    />
                  ))}
                </div>
              )}
            </GlassCard>

            {/* COLUMNA 2: PROMOCIONES Y COMBOS */}
            <GlassCard padding="24px 22px" radius={24} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Encabezado Columna 2 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Promociones y Combos
                    </h2>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(228, 41, 38, 0.14)',
                        color: 'var(--brand-red, #e42926)',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {promociones.length}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    Combos con el estilo de "Nuestra receta insignia", vinculando múltiples productos.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="blue"
                  size="sm"
                  onClick={() => setModalPromoAbierto(true)}
                >
                  <IconoPlus size={14} style={{ marginRight: 6 }} /> Nueva Promoción
                </Button>
              </div>

              {/* Listado de Promociones */}
              {promociones.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: 13.5,
                    border: '1.5px dashed var(--input-border)',
                    borderRadius: 18,
                    background: 'var(--input-bg)',
                  }}
                >
                  <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Aún no hay promociones creadas.</p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setModalPromoAbierto(true)}
                  >
                    Crear tu primera promoción
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {promociones.map((promo) => (
                    <PromocionCard
                      key={promo.id}
                      promocion={promo}
                      onActualizada={handlePromocionActualizada}
                      onEliminada={handlePromocionEliminada}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>

      {/* Modal para Crear Promoción */}
      <PromocionCrearModal
        abierto={modalPromoAbierto}
        productos={productos}
        tamanos={tamanosVaso}
        precios={precios}
        onCerrar={() => setModalPromoAbierto(false)}
        onPromocionCreada={handlePromocionCreada}
      />
    </AppShell>
  )
}
