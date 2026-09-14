import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Producto } from '../../types/producto'
import type { ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { promocionesService } from '../../services/promocionesService'
import { storageService } from '../../services/storageService'
import { IconoCruz, IconoPlus } from '../ui/IconosFormas'

interface ComponenteRow {
  idTemp: string
  productoId: string
  tamanoVasoId: string | null
  cantidad: number
}

interface PromocionCrearModalProps {
  abierto: boolean
  productos: Producto[]
  tamanos: TamanoVaso[]
  precios: ProductoTamanoPrecio[]
  onCerrar: () => void
  onPromocionCreada: () => void
}

export function PromocionCrearModal({
  abierto,
  productos,
  tamanos,
  precios,
  onCerrar,
  onPromocionCreada,
}: PromocionCrearModalProps) {
  const cerrarRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState<string>('')
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [componentes, setComponentes] = useState<ComponenteRow[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Productos activos disponibles para agregar al combo
  const productosActivos = useMemo(() => productos.filter((p) => p.activo), [productos])

  // Obtener tamaños configurados para un producto específico
  const obtenerTamanosDeProducto = useCallback(
    (prodId: string): TamanoVaso[] => {
      const ptps = precios.filter((p) => p.productoId === prodId && p.activo)
      if (ptps.length === 0) return []
      const idsTamanos = new Set(ptps.map((p) => p.tamanoVasoId))
      return tamanos.filter((t) => idsTamanos.has(t.id))
    },
    [precios, tamanos]
  )

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (!abierto) return
    cerrarRef.current?.focus()

    setNombre('')
    setPrecio('')
    setImagenFile(null)
    setImagenPreview(null)
    setError(null)

    // Agregar un producto por defecto si hay disponibles
    const activos = productos.filter((p) => p.activo)
    if (activos.length > 0) {
      const primerProd = activos[0]
      const ptps = precios.filter((p) => p.productoId === primerProd.id && p.activo)
      const idsTamanos = new Set(ptps.map((p) => p.tamanoVasoId))
      const tamanosPrimer = tamanos.filter((t) => idsTamanos.has(t.id))
      setComponentes([
        {
          idTemp: Math.random().toString(36).substring(2, 9),
          productoId: primerProd.id,
          tamanoVasoId: tamanosPrimer.length > 0 ? tamanosPrimer[0].id : null,
          cantidad: 1,
        },
      ])
    } else {
      setComponentes([])
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrar()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // Solo reacciona a la apertura del modal o a onCerrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, onCerrar])

  function handleAgregarComponente() {
    if (productosActivos.length === 0) return
    const prod = productosActivos[0]
    const tams = obtenerTamanosDeProducto(prod.id)
    setComponentes((prev) => [
      ...prev,
      {
        idTemp: Math.random().toString(36).substring(2, 9),
        productoId: prod.id,
        tamanoVasoId: tams.length > 0 ? tams[0].id : null,
        cantidad: 1,
      },
    ])
  }

  function handleEliminarComponente(idTemp: string) {
    setComponentes((prev) => prev.filter((c) => c.idTemp !== idTemp))
  }

  function handleCambiarProducto(idTemp: string, nuevoProductoId: string) {
    const tams = obtenerTamanosDeProducto(nuevoProductoId)
    setComponentes((prev) =>
      prev.map((c) =>
        c.idTemp === idTemp
          ? {
              ...c,
              productoId: nuevoProductoId,
              tamanoVasoId: tams.length > 0 ? tams[0].id : null,
            }
          : c
      )
    )
  }

  function handleCambiarTamano(idTemp: string, tamanoVasoId: string | null) {
    setComponentes((prev) =>
      prev.map((c) => (c.idTemp === idTemp ? { ...c, tamanoVasoId } : c))
    )
  }

  function handleCambiarCantidad(idTemp: string, cantidad: number) {
    setComponentes((prev) =>
      prev.map((c) => (c.idTemp === idTemp ? { ...c, cantidad: Math.max(1, cantidad) } : c))
    )
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagenFile(file)
    const preview = URL.createObjectURL(file)
    setImagenPreview(preview)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('Por favor ingresa un nombre para la promoción o combo.')
      return
    }

    const numPrecio = Number(precio)
    if (isNaN(numPrecio) || numPrecio <= 0) {
      setError('El precio debe ser un número mayor a 0.')
      return
    }

    if (componentes.length === 0) {
      setError('Debes incluir al menos un producto en la promoción.')
      return
    }

    for (const comp of componentes) {
      const prod = productosActivos.find((p) => p.id === comp.productoId)
      const tams = obtenerTamanosDeProducto(comp.productoId)
      if (tams.length > 0 && !comp.tamanoVasoId) {
        setError(`Por favor selecciona el tamaño para "${prod?.nombre || 'el producto'}".`)
        return
      }
    }

    setGuardando(true)
    try {
      let imagenUrl: string | null = null

      if (imagenFile) {
        imagenUrl = await storageService.subirImagenCatalogo(imagenFile, 'promociones')
      }

      await promocionesService.crearPromocion({
        nombre: nombre.trim(),
        precio: numPrecio,
        imagenUrl,
        componentes: componentes.map((c) => ({
          productoId: c.productoId,
          tamanoVasoId: c.tamanoVasoId,
          cantidad: c.cantidad,
        })),
      })

      onPromocionCreada()
      onCerrar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la promoción.')
    } finally {
      setGuardando(false)
    }
  }

  if (!abierto) return null

  return (
    <div
      role="presentation"
      onClick={onCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '36px 16px',
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-crear-promocion-titulo"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'fadeInUp 0.18s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button ref={cerrarRef} type="button" variant="secondary" size="sm" onClick={onCerrar}>
            <IconoCruz size={13} style={{ marginRight: 6 }} /> Cerrar
          </Button>
        </div>

        <GlassCard
          padding="28px 28px"
          radius={24}
          style={{
            background: 'var(--modal-bg)',
            border: '1px solid var(--modal-border)',
            boxShadow: 'var(--modal-shadow)',
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <h2
              id="modal-crear-promocion-titulo"
              style={{
                margin: '0 0 6px',
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Nueva Promoción o Combo
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
              Agrupa varios productos de la carta para crear una oferta atractiva con precio y foto propios.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Fila: Nombre y Precio */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: 'var(--text-primary)',
                  }}
                >
                  Nombre de la Promoción *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Combo Pareja Cipote"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: 'var(--text-primary)',
                  }}
                >
                  Precio del Combo (COP) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  placeholder="Ej: 38000"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Selector de Foto */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: 'var(--text-primary)',
                }}
              >
                Foto de la Promoción (Opcional)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1.5px dashed var(--input-border)',
                  background: 'var(--input-bg)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#1a1f2c',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {imagenPreview ? (
                    <img
                      src={imagenPreview}
                      alt="Vista previa"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--text-secondary)">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                    {imagenFile ? imagenFile.name : 'Haz clic para seleccionar una foto'}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    PNG, JPG o WEBP. También podrás cargarla o cambiarla más tarde haciendo clic en la tarjeta.
                  </span>
                </div>
              </div>
            </div>

            {/* Listado dinámico de componentes */}
            <div
              style={{
                marginTop: 6,
                padding: '16px',
                borderRadius: 16,
                background: 'rgba(15, 20, 30, 0.03)',
                border: '1px solid rgba(15, 20, 30, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Productos incluidos en la Promoción
                  </h3>
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Selecciona los productos y cantidades que componen este combo.
                  </span>
                </div>

                <Button
                  type="button"
                  variant="blue"
                  size="sm"
                  onClick={handleAgregarComponente}
                >
                  <IconoPlus size={14} style={{ marginRight: 6 }} /> Agregar Producto
                </Button>
              </div>

              {componentes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                  No has agregado productos. Haz clic en "+ Agregar Producto".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {componentes.map((comp, idx) => {
                    const tamanosDisponibles = obtenerTamanosDeProducto(comp.productoId)

                    return (
                      <div
                        key={comp.idTemp}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 12,
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-blue, #41afe0)', minWidth: 20 }}>
                          #{idx + 1}
                        </span>

                        {/* Cantidad */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Cant:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={comp.cantidad}
                            onChange={(e) => handleCambiarCantidad(comp.idTemp, Number(e.target.value))}
                            style={{
                              width: 54,
                              padding: '6px 8px',
                              borderRadius: 8,
                              border: '1px solid var(--input-border)',
                              background: 'var(--bg-card, #fff)',
                              color: 'var(--text-primary)',
                              fontSize: 13,
                              fontWeight: 700,
                              textAlign: 'center',
                              outline: 'none',
                            }}
                          />
                        </div>

                        {/* Selector de Producto */}
                        <div style={{ flex: '1 1 180px' }}>
                          <select
                            value={comp.productoId}
                            onChange={(e) => handleCambiarProducto(comp.idTemp, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: 8,
                              border: '1px solid var(--input-border)',
                              background: 'var(--bg-card, #fff)',
                              color: 'var(--text-primary)',
                              fontSize: 13,
                              fontWeight: 600,
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {productosActivos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} ({p.categoria})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selector de Tamaño si aplica */}
                        <div style={{ minWidth: 120 }}>
                          {tamanosDisponibles.length > 0 ? (
                            <select
                              value={comp.tamanoVasoId || ''}
                              onChange={(e) => handleCambiarTamano(comp.idTemp, e.target.value || null)}
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                borderRadius: 8,
                                border: '1px solid var(--input-border)',
                                background: 'var(--bg-card, #fff)',
                                color: 'var(--text-primary)',
                                fontSize: 12.5,
                                fontWeight: 600,
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {tamanosDisponibles.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.etiqueta} {t.onzas ? `(${t.onzas}oz)` : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--text-faint)',
                                display: 'inline-block',
                                padding: '6px 8px',
                              }}
                            >
                              Estándar
                            </span>
                          )}
                        </div>

                        {/* Botón Eliminar fila */}
                        <button
                          type="button"
                          onClick={() => handleEliminarComponente(comp.idTemp)}
                          title="Quitar producto de la promoción"
                          aria-label="Quitar producto de la promoción"
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(228, 41, 38, 0.1)',
                            color: '#e42926',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconoCruz size={13} strokeWidth={2.4} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(228, 41, 38, 0.1)',
                  color: '#e42926',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {/* Acciones de pie */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button type="button" variant="secondary" onClick={onCerrar} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={guardando}>
                {guardando ? 'Creando promoción...' : 'Crear Promoción'}
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
