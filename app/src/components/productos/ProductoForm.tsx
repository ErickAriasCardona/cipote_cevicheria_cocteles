import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { CategoriaProducto, CrearProductoInput, Producto } from '../../types/producto'
import type { NuevoTamanoPrecioInput, ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type { Insumo } from '../../types/insumo'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Chip } from '../ui/Chip'
import { combosUnidadPorCategoria, formatearUnidad, obtenerCombosDisponibles } from '../../utils/unidadMedida'

interface ProductoFormProps {
  /** Fuente de verdad de las combinaciones de tamaño/presentación (tipo de
   * unidad + valor de unidad) disponibles por categoría de producto -- ver
   * `insumos.categoria_producto` (ticket post-MVP "relacionar categoría de
   * producto con tipo de insumo"). También alimenta el selector de "Nombre
   * del producto" para Bebidas y para Otros (insumos existentes de la
   * categoría correspondiente + opción de nombre nuevo sin stock). */
  insumos: Insumo[]
  /** Productos ya existentes en el catálogo (activos e inactivos), junto con
   * sus precios por tamaño y los tamaños de vaso, para poder detectar cuando
   * el nombre elegido en `opcionesNombreCatalogo` ya corresponde a un
   * producto existente y así excluir del selector de "Presentaciones y
   * Precios" las combinaciones que ese producto ya tiene registradas (ticket
   * fix "duplicar presentaciones/productos con nombre ya existente en
   * catálogo", 2026-09-12). Reutiliza `obtenerCombosDisponibles` de
   * `ProductosTable` en vez de duplicar la lógica de matching. */
  productos: Producto[]
  precios: ProductoTamanoPrecio[]
  tamanosVaso: TamanoVaso[]
  onCrear: (input: CrearProductoInput, tamanos: NuevoTamanoPrecioInput[]) => Promise<void>
}

/** Clave del selector de "Nombre del producto" (Bebidas y Otros) que indica
 * que el usuario quiere escribir un nombre nuevo en vez de elegir uno de los
 * insumos existentes de esa categoría. Ese nombre nuevo se guarda solo como
 * texto en `productos.nombre`, sin crear insumo ni llevar control de
 * inventario (ticket post-MVP parte 3, Opción A confirmada por Erick para
 * Bebidas; misma opción generalizada a Otros). */
const CLAVE_NOMBRE_LIBRE = '__nombre_libre__'

function claveCombo(combo: { tipoUnidad: string; valorUnidad: number }): string {
  return `${combo.tipoUnidad}|${combo.valorUnidad}`
}

/** Mensaje único para el aviso/bloqueo de nombre duplicado, reutilizado tanto
 * en el `role="alert"` visible en el formulario como en el error que
 * `handleSubmit` fija si el usuario logra llegar a enviar (ej. atajos de
 * teclado). Aclara la categoría del producto existente cuando es distinta a
 * la que se está creando, ya que `productos.nombre` es único sin importar la
 * categoría (ver comentario de `productoDuplicado`). */
function mensajeDuplicado(producto: Producto, categoriaEnCurso: CategoriaProducto): string {
  const estado = producto.activo ? '' : ' (inactivo)'
  const ubicacion =
    producto.categoria === categoriaEnCurso
      ? 'en esta categoría'
      : `en la categoría "${producto.categoria}"`
  return `Ya existe un producto "${producto.nombre}"${estado} ${ubicacion}. Usa "Editar / Configurar tamaños y precios" en el catálogo para modificarlo en vez de crear uno duplicado.`
}

export function ProductoForm({ insumos, productos, precios, tamanosVaso, onCrear }: ProductoFormProps) {
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState<CategoriaProducto>('ceviche')
  const [descripcion, setDescripcion] = useState('')
  const [precioDirecto, setPrecioDirecto] = useState('')
  const [tamanos, setTamanos] = useState<NuevoTamanoPrecioInput[]>([])
  const [comboSeleccionado, setComboSeleccionado] = useState('')
  const [precioBorrador, setPrecioBorrador] = useState('')
  const [nombreCatalogoSeleccion, setNombreCatalogoSeleccion] = useState(CLAVE_NOMBRE_LIBRE)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const combosCategoria = useMemo(
    () => (categoria === 'otro' ? [] : combosUnidadPorCategoria(insumos, categoria)),
    [insumos, categoria],
  )

  // Categorías cuyo "Nombre del producto" se elige de insumos existentes en
  // vez de escribirse libremente: Bebidas (insumos.categoriaProducto ===
  // 'bebida') y Otros (insumos.categoriaProducto == null, es decir insumos
  // que no son de tipo ceviche/granizado/bebida -- ej. Bolsa, Tapa, Fruta).
  const usaSelectorNombreDesdeInsumos = categoria === 'bebida' || categoria === 'otro'

  const opcionesNombreCatalogo = useMemo(() => {
    if (!usaSelectorNombreDesdeInsumos) return []
    const nombresInsumos = Array.from(
      new Set(
        insumos
          .filter((i) => i.activo && (categoria === 'bebida' ? i.categoriaProducto === 'bebida' : i.categoriaProducto == null))
          .map((i) => i.nombre),
      ),
    ).sort((a, b) => a.localeCompare(b, 'es'))
    return [
      ...nombresInsumos.map((n) => ({ value: n, label: n })),
      {
        value: CLAVE_NOMBRE_LIBRE,
        label: categoria === 'bebida' ? '+ Agregar bebida nueva (sin stock)...' : '+ Agregar nombre nuevo (sin stock)...',
      },
    ]
  }, [insumos, categoria, usaSelectorNombreDesdeInsumos])

  const precioBorradorNumerico = Number(precioBorrador)
  const precioDirectoNumerico = Number(precioDirecto)
  const esNombreLibre = !usaSelectorNombreDesdeInsumos || nombreCatalogoSeleccion === CLAVE_NOMBRE_LIBRE
  const nombreFinal = esNombreLibre ? nombre.trim() : nombreCatalogoSeleccion

  // Producto ya existente en el catálogo (activo o inactivo) con el mismo
  // nombre Y LA MISMA CATEGORÍA que el que se está por crear. Se usa
  // ÚNICAMENTE para calcular qué presentaciones (tamaños) ese producto ya
  // tiene guardadas (combosYaEnCatalogo) -- no es la validación que bloquea
  // el guardado, esa es `productoDuplicado` más abajo, que compara contra
  // TODAS las categorías porque así es la restricción real de la BD. Bug
  // original confirmado 2026-09-12: al elegir en `opcionesNombreCatalogo` un
  // nombre que ya tiene producto creado (ej. "Coca - Cola"), el selector de
  // presentaciones sólo filtraba contra `tamanos` (estado local de esta
  // sesión del formulario) y no contra lo que ya está guardado en
  // `producto_tamano_precio` para ese producto -- permitía agregar una
  // presentación duplicada y, al guardar, `handleCrear` en ProductosPage
  // siempre llama `crearProducto`, creando un SEGUNDO producto con el mismo
  // nombre.
  const productoExistenteMismaCategoria = useMemo(() => {
    if (!usaSelectorNombreDesdeInsumos || !nombreFinal) return null
    return productos.find((p) => p.categoria === categoria && p.nombre === nombreFinal) ?? null
  }, [productos, categoria, usaSelectorNombreDesdeInsumos, nombreFinal])

  // Combos que el producto existente (si lo hay) todavía NO tiene guardados
  // en `producto_tamano_precio` -- reutiliza `obtenerCombosDisponibles` de
  // ProductosTable (misma fuente de datos/lógica que ya usa el catálogo) en
  // vez de duplicar el matching. Si no hay producto existente con ese
  // nombre, no hay nada que excluir por ese lado.
  const combosYaEnCatalogo = useMemo(
    () =>
      productoExistenteMismaCategoria
        ? obtenerCombosDisponibles(productoExistenteMismaCategoria, precios, tamanosVaso, insumos)
        : combosCategoria,
    [productoExistenteMismaCategoria, precios, tamanosVaso, insumos, combosCategoria],
  )

  // Validación real de duplicado (ticket fix 409 Conflict, 2026-09-12):
  // `productos.nombre` es UNIQUE a nivel de BD SIN IMPORTAR LA CATEGORÍA
  // (migración `20260904000001_catalogo_productos.sql` línea 7) -- no existe
  // tal cosa como "mismo nombre permitido en categorías distintas". La
  // validación de `productoExistenteMismaCategoria` de arriba sólo cubría
  // Bebida/Otros comparando nombre+categoría, y Ceviche/Granizado (nombre de
  // texto libre, sin selector) no tenían NINGUNA validación previa -- en
  // ambos casos huecos el INSERT llegaba a la red y la BD respondía 409
  // Conflict. Esta validación compara SOLO por nombre (case-insensitive,
  // trim), contra TODOS los productos existentes (activos e inactivos) SIN
  // filtrar por categoría, y aplica a las 4 categorías por igual.
  const nombreNormalizado = nombreFinal.trim().toLowerCase()
  const productoDuplicado = useMemo(() => {
    if (!nombreNormalizado) return null
    return productos.find((p) => p.nombre.trim().toLowerCase() === nombreNormalizado) ?? null
  }, [productos, nombreNormalizado])

  const combosDisponibles = combosCategoria.filter(
    (combo) =>
      !tamanos.some((fila) => fila.tipoUnidad === combo.tipoUnidad && fila.valorUnidad === combo.valorUnidad) &&
      combosYaEnCatalogo.some((c) => c.tipoUnidad === combo.tipoUnidad && c.valorUnidad === combo.valorUnidad),
  )

  function handleCambiarCategoria(nuevaCategoria: CategoriaProducto) {
    setCategoria(nuevaCategoria)
    setTamanos([])
    setPrecioBorrador('')
    setComboSeleccionado('')
    setNombreCatalogoSeleccion(CLAVE_NOMBRE_LIBRE)
    if (nuevaCategoria === 'bebida' || nuevaCategoria === 'otro') setNombre('')
    setError(null)
  }

  function handleAgregarTamano() {
    setError(null)
    const claveParaAgregar = comboSeleccionado || claveCombo(combosDisponibles[0] ?? { tipoUnidad: '', valorUnidad: 0 })
    const combo = combosDisponibles.find((c) => claveCombo(c) === claveParaAgregar)
    if (!combo) return
    if (!Number.isFinite(precioBorradorNumerico) || precioBorradorNumerico <= 0) {
      setError('El precio del tamaño a agregar debe ser un número mayor que cero.')
      return
    }
    setTamanos((actual) => [
      ...actual,
      { tipoUnidad: combo.tipoUnidad, valorUnidad: combo.valorUnidad, precio: precioBorradorNumerico },
    ])
    setPrecioBorrador('')
    const siguienteDisponible = combosDisponibles.find((c) => claveCombo(c) !== claveParaAgregar)
    setComboSeleccionado(siguienteDisponible ? claveCombo(siguienteDisponible) : '')
  }

  function handleQuitarTamano(combo: NuevoTamanoPrecioInput) {
    setTamanos((actual) =>
      actual.filter((fila) => !(fila.tipoUnidad === combo.tipoUnidad && fila.valorUnidad === combo.valorUnidad)),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (productoDuplicado) {
      setError(mensajeDuplicado(productoDuplicado, categoria))
      return
    }

    if (categoria === 'otro') {
      if (!Number.isFinite(precioDirectoNumerico) || precioDirectoNumerico <= 0) {
        setError('Ingresa un precio de venta válido mayor que cero para este producto.')
        return
      }

      const ok = await confirmar({
        titulo: 'Crear producto',
        mensaje: `¿Confirmas crear el producto "${nombreFinal}" en categoría "Otros" con precio $${precioDirectoNumerico.toLocaleString('es-CO', { minimumFractionDigits: 2 })}?`,
        textoConfirmar: 'Crear producto',
      })
      if (!ok) return

      setEnviando(true)
      try {
        await onCrear(
          {
            nombre: nombreFinal,
            categoria,
            descripcion: descripcion.trim() || null,
            precio: precioDirectoNumerico,
          },
          [],
        )
        setNombre('')
        setDescripcion('')
        setPrecioDirecto('')
        setNombreCatalogoSeleccion(CLAVE_NOMBRE_LIBRE)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear el producto.')
      } finally {
        setEnviando(false)
      }
      return
    }

    // Para 'ceviche', 'granizado' o 'bebida'
    if (tamanos.length === 0) {
      setError(
        `Agrega al menos una presentación/tamaño con su precio antes de guardar el ${categoria === 'bebida' ? 'bebida' : 'producto'}.`,
      )
      return
    }

    const ok = await confirmar({
      titulo: 'Crear producto',
      mensaje: `¿Confirmas crear el producto "${nombreFinal}" (${categoria}) con ${tamanos.length} tamaño(s) configurado(s)?`,
      textoConfirmar: 'Crear producto',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onCrear(
        {
          nombre: nombreFinal,
          categoria,
          descripcion: descripcion.trim() || null,
        },
        tamanos,
      )
      setNombre('')
      setDescripcion('')
      setTamanos([])
      setPrecioBorrador('')
      setComboSeleccionado('')
      setNombreCatalogoSeleccion(CLAVE_NOMBRE_LIBRE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el producto.')
    } finally {
      setEnviando(false)
    }
  }

  const botonDeshabilitado =
    enviando ||
    !nombreFinal ||
    Boolean(productoDuplicado) ||
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

            {/* Nombre del producto -- para Bebidas y Otros, selector de
            insumos existentes de la categoría correspondiente + opción
            explícita de nombre nuevo sin stock (ticket post-MVP parte 3,
            Opción A confirmada por Erick: el nombre nuevo se guarda solo
            como texto en productos.nombre, sin crear insumo ni llevar
            control de inventario; misma mecánica para ambas categorías). */}
            {usaSelectorNombreDesdeInsumos ? (
              <>
                <Select
                  label={categoria === 'bebida' ? 'Nombre del producto (bebida)' : 'Nombre del producto (otros)'}
                  id="nombre_catalogo_select"
                  value={nombreCatalogoSeleccion}
                  onChange={(e) => {
                    setNombreCatalogoSeleccion(e.target.value)
                    setNombre('')
                  }}
                  options={opcionesNombreCatalogo}
                />
                {nombreCatalogoSeleccion === CLAVE_NOMBRE_LIBRE && (
                  <Input
                    label={
                      categoria === 'bebida'
                        ? 'Nombre de la bebida nueva (sin stock/insumo)'
                        : 'Nombre del producto nuevo (sin stock/insumo)'
                    }
                    id="nombre_catalogo_nuevo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={categoria === 'bebida' ? 'Ej: Limonada de Coco' : 'Ej: Empanada de Carne'}
                    required
                  />
                )}
              </>
            ) : (
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
                    : 'Ej: Porción de Galletas, Empanada...'
                }
                required
              />
            )}

            {/* Aviso de nombre duplicado -- aplica a las 4 categorías por igual
            (ver `productoDuplicado`), no sólo a Bebida/Otros como antes. */}
            {productoDuplicado && (
              <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--brand-red)', fontWeight: 600 }}>
                {mensajeDuplicado(productoDuplicado, categoria)}
              </p>
            )}

            {/* Descripción (opcional) */}
            <Input
              label="Descripción (opcional)"
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción o detalle para caja"
            />
          </div>

          {/* COLUMNA 2: Tamaños de Vaso y Precios + Botón Crear Producto.
          form-add-row-container establece el contexto de Container Query
          que usa .form-add-row más abajo (ver index.css) para decidir, según
          el ancho real de ESTA columna (no el de la ventana), si el botón
          "+ Agregar" cabe en la misma fila del Select/Input o pasa a ocupar
          el ancho completo debajo. */}
          <div
            className="form-add-row-container"
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

                {combosCategoria.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--brand-red)', fontWeight: 600 }}>
                    No hay insumos activos del tipo relacionado a esta categoría todavía. Ve a Insumos y
                    crea al menos uno (con su tipo de unidad y valor de unidad) antes de configurar
                    tamaños aquí.
                  </p>
                ) : combosDisponibles.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--brand-green)', fontWeight: 600 }}>
                    ✓ Ya agregaste todas las presentaciones disponibles de esta categoría.
                  </p>
                ) : (
                  <div className="form-add-row" style={{ paddingBottom: 4 }}>
                    <div className="form-add-row-field">
                      <Select
                        label={
                          categoria === 'bebida'
                            ? 'Presentación'
                            : categoria === 'granizado'
                            ? 'Tamaño granizado'
                            : 'Tamaño de vaso'
                        }
                        id="combo_unidad"
                        value={comboSeleccionado || claveCombo(combosDisponibles[0])}
                        onChange={(e) => setComboSeleccionado(e.target.value)}
                        options={combosDisponibles.map((combo) => ({
                          value: claveCombo(combo),
                          label: combo.etiqueta,
                        }))}
                      />
                    </div>

                    <div className="form-add-row-field form-add-row-field--narrow">
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
                      className="form-add-row-btn"
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
                        key={claveCombo(fila)}
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
                        <span style={{ fontWeight: 600 }}>{formatearUnidad(fila.tipoUnidad, fila.valorUnidad)}</span>
                        <span style={{ color: 'var(--brand-red)', fontWeight: 700 }}>
                          ${fila.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuitarTamano(fila)}
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
