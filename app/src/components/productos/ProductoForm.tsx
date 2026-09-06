import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CategoriaProducto, CrearProductoInput } from '../../types/producto'
import type { NuevoTamanoPrecioInput } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Chip } from '../ui/Chip'

interface ProductoFormProps {
  tamanosVaso: TamanoVaso[]
  onCrear: (input: CrearProductoInput, tamanos: NuevoTamanoPrecioInput[]) => Promise<void>
}

export function ProductoForm({ tamanosVaso, onCrear }: ProductoFormProps) {
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState<CategoriaProducto>('ceviche')
  const [descripcion, setDescripcion] = useState('')
  const [precioDirecto, setPrecioDirecto] = useState('')
  const [tamanos, setTamanos] = useState<NuevoTamanoPrecioInput[]>([])
  const [tamanoVasoId, setTamanoVasoId] = useState('')
  const [precioBorrador, setPrecioBorrador] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const tamanosFiltradosPorTipo = tamanosVaso.filter((t) => {
    if (categoria === 'bebida') return t.tipo === 'bebida' || t.categoria === 'bebida'
    if (categoria === 'granizado') return t.categoria === 'granizado'
    if (categoria === 'ceviche') return t.categoria === 'ceviche' || (!t.categoria && t.tipo === 'vaso')
    return false
  })
  const tamanosDisponibles = tamanosFiltradosPorTipo.filter(
    (tamano) => !tamanos.some((fila) => fila.tamanoVasoId === tamano.id),
  )

  const precioBorradorNumerico = Number(precioBorrador)
  const precioDirectoNumerico = Number(precioDirecto)

  function handleCambiarCategoria(nuevaCategoria: CategoriaProducto) {
    setCategoria(nuevaCategoria)
    setTamanos([])
    setPrecioBorrador('')
    setError(null)
    const primeros = tamanosVaso.filter((t) => {
      if (nuevaCategoria === 'bebida') return t.tipo === 'bebida' || t.categoria === 'bebida'
      if (nuevaCategoria === 'granizado') return t.categoria === 'granizado'
      if (nuevaCategoria === 'ceviche') return t.categoria === 'ceviche' || (!t.categoria && t.tipo === 'vaso')
      return false
    })
    setTamanoVasoId(primeros[0]?.id ?? '')
  }

  function handleAgregarTamano() {
    setError(null)
    const idParaAgregar = tamanoVasoId || tamanosDisponibles[0]?.id
    if (!idParaAgregar) return
    if (!Number.isFinite(precioBorradorNumerico) || precioBorradorNumerico <= 0) {
      setError('El precio del tamaño a agregar debe ser un número mayor que cero.')
      return
    }
    setTamanos((actual) => [...actual, { tamanoVasoId: idParaAgregar, precio: precioBorradorNumerico }])
    setPrecioBorrador('')
    const siguienteDisponible = tamanosDisponibles.find((tamano) => tamano.id !== idParaAgregar)
    setTamanoVasoId(siguienteDisponible?.id ?? '')
  }

  function handleQuitarTamano(idAQuitar: string) {
    setTamanos((actual) => actual.filter((fila) => fila.tamanoVasoId !== idAQuitar))
  }

  function etiquetaTamano(idTamano: string): string {
    const tamano = tamanosVaso.find((t) => t.id === idTamano)
    return tamano ? tamano.etiqueta : idTamano
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (categoria === 'otro') {
      if (!Number.isFinite(precioDirectoNumerico) || precioDirectoNumerico <= 0) {
        setError('Ingresa un precio de venta válido mayor que cero para este producto.')
        return
      }

      const ok = await confirmar({
        titulo: 'Crear producto',
        mensaje: `¿Confirmas crear el producto "${nombre}" en categoría "Otros" con precio $${precioDirectoNumerico.toLocaleString('es-CO', { minimumFractionDigits: 2 })}?`,
        textoConfirmar: 'Crear producto',
      })
      if (!ok) return

      setEnviando(true)
      try {
        await onCrear(
          {
            nombre: nombre.trim(),
            categoria,
            descripcion: descripcion.trim() || null,
            precio: precioDirectoNumerico,
          },
          [],
        )
        setNombre('')
        setDescripcion('')
        setPrecioDirecto('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear el producto.')
      } finally {
        setEnviando(false)
      }
      return
    }

    // Para 'ceviche' o 'bebida'
    if (tamanos.length === 0) {
      setError(
        `Agrega al menos una presentación/tamaño con su precio antes de guardar el ${categoria === 'bebida' ? 'bebida' : 'producto'}.`,
      )
      return
    }

    const ok = await confirmar({
      titulo: 'Crear producto',
      mensaje: `¿Confirmas crear el producto "${nombre}" (${categoria}) con ${tamanos.length} tamaño(s) configurado(s)?`,
      textoConfirmar: 'Crear producto',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onCrear(
        {
          nombre: nombre.trim(),
          categoria,
          descripcion: descripcion.trim() || null,
        },
        tamanos,
      )
      setNombre('')
      setDescripcion('')
      setTamanos([])
      setPrecioBorrador('')
      const primeros = tamanosVaso.filter((t) => {
        if (categoria === 'bebida') return t.tipo === 'bebida' || t.categoria === 'bebida'
        if (categoria === 'granizado') return t.categoria === 'granizado'
        if (categoria === 'ceviche') return t.categoria === 'ceviche' || (!t.categoria && t.tipo === 'vaso')
        return false
      })
      setTamanoVasoId(primeros[0]?.id ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el producto.')
    } finally {
      setEnviando(false)
    }
  }

  const botonDeshabilitado =
    enviando ||
    !nombre.trim() ||
    (categoria === 'otro'
      ? !precioDirecto || precioDirectoNumerico <= 0
      : tamanos.length === 0)

  return (
    <GlassCard padding={22}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700 }}>Nuevo Producto</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          {/* COLUMNA 1: Categoría, Nombre y Descripción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Categoría del producto */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                Categoría del producto
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip
                  active={categoria === 'ceviche'}
                  onClick={() => handleCambiarCategoria('ceviche')}
                >
                  Ceviches y Cócteles (oz)
                </Chip>
                <Chip
                  active={categoria === 'granizado'}
                  onClick={() => handleCambiarCategoria('granizado')}
                >
                  Granizados (oz)
                </Chip>
                <Chip
                  active={categoria === 'bebida'}
                  onClick={() => handleCambiarCategoria('bebida')}
                >
                  Bebidas (ml)
                </Chip>
                <Chip
                  active={categoria === 'otro'}
                  onClick={() => handleCambiarCategoria('otro')}
                >
                  Otros (precio directo)
                </Chip>
              </div>
            </div>

            {/* Nombre del producto */}
            <Input
              label="Nombre del producto"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={
                categoria === 'ceviche'
                  ? 'Ej: Ceviche de Camarón, Mixto...'
                  : categoria === 'granizado'
                  ? 'Ej: Granizado de Café, Limón, Maracuyá...'
                  : categoria === 'bebida'
                  ? 'Ej: Limonada Natural, Cerveza...'
                  : 'Ej: Porción de Galletas, Empanada...'
              }
              required
            />

            {/* Descripción (opcional) */}
            <Input
              label="Descripción (opcional)"
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción o detalle para caja"
            />
          </div>

          {/* COLUMNA 2: Tamaños de Vaso y Precios + Botón Crear Producto */}
          <div
            style={{
              background: 'var(--input-bg)',
              border: '1px dashed var(--input-border)',
              borderRadius: 14,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {categoria === 'otro' ? (
              <>
                <div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Precio de Venta Directo
                  </span>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                    Los productos en categoría "Otros" no usan vasos ni mililitros, se venden por unidad con este precio fijo.
                  </p>
                </div>

                <Input
                  label="Precio unitario ($)"
                  id="precio_directo"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={precioDirecto}
                  onChange={(e) => setPrecioDirecto(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {categoria === 'bebida'
                      ? 'Presentaciones y Precios (Mililitros)'
                      : categoria === 'granizado'
                      ? 'Tamaños de Vaso y Precios (Granizados)'
                      : 'Tamaños de Vaso y Precios (Onzas)'}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                    {tamanos.length} configurado(s)
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {categoria === 'bebida'
                    ? 'Agrega las presentaciones en mililitros disponibles para esta bebida.'
                    : categoria === 'granizado'
                    ? 'Agrega los tamaños de vaso disponibles para este granizado.'
                    : 'Agrega los tamaños de vaso disponibles para este ceviche o cóctel.'}
                </p>

                {tamanosDisponibles.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--brand-green)', fontWeight: 600 }}>
                    ✓ Ya agregaste todas las presentaciones disponibles de esta categoría.
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-end',
                      flexWrap: 'wrap',
                      paddingBottom: 4,
                    }}
                  >
                    <div style={{ flex: '1 1 120px' }}>
                      <Select
                        label={
                          categoria === 'bebida'
                            ? 'Presentación (ml)'
                            : categoria === 'granizado'
                            ? 'Tamaño granizado (oz)'
                            : 'Tamaño de vaso (oz)'
                        }
                        id="tamano_vaso_id"
                        value={tamanoVasoId || tamanosDisponibles[0]?.id || ''}
                        onChange={(e) => setTamanoVasoId(e.target.value)}
                        options={tamanosDisponibles.map((tamano) => ({
                          value: tamano.id,
                          label: tamano.etiqueta,
                        }))}
                      />
                    </div>

                    <div style={{ width: 100 }}>
                      <Input
                        label="Precio ($)"
                        id="precio_borrador"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={precioBorrador}
                        onChange={(e) => setPrecioBorrador(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={handleAgregarTamano}
                      disabled={!precioBorrador}
                      style={{ height: 42, borderRadius: 10 }}
                    >
                      + Agregar
                    </Button>
                  </div>
                )}

                {/* Listado de tamaños agregados */}
                {tamanos.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--hr-line)',
                    }}
                  >
                    {tamanos.map((fila) => (
                      <div
                        key={fila.tamanoVasoId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '5px 10px',
                          background: 'var(--glass-card-bg)',
                          border: '1px solid var(--border-soft)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{etiquetaTamano(fila.tamanoVasoId)}</span>
                        <span style={{ color: 'var(--brand-red)', fontWeight: 700 }}>
                          ${fila.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuitarTamano(fila.tamanoVasoId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--brand-red)',
                            fontWeight: 700,
                            padding: '0 2px',
                            fontSize: 13,
                          }}
                          title="Quitar presentación"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {error && (
              <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 12.5, fontWeight: 600 }}>
                {error}
              </p>
            )}

            {/* Botón Crear Producto en Columna 2 */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={botonDeshabilitado}
              style={{ width: '100%', marginTop: 'auto', height: 42, borderRadius: 10 }}
            >
              {enviando ? 'Creando…' : 'Crear Producto'}
            </Button>
          </div>
        </div>
      </form>
    </GlassCard>
  )
}
