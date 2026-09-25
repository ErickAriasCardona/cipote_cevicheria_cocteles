/**
 * Utilidades compartidas para el par estructurado (tipoUnidad, valorUnidad)
 * que reemplaza el antiguo string libre `unidad_medida` de insumos (ticket
 * post-MVP "Separar tipo de unidad y valor de unidad en Insumos", 2026-09-12).
 */
import type { Producto } from '../types/producto'
import type { ProductoTamanoPrecio } from '../types/productoTamanoPrecio'
import type { TamanoVaso } from '../types/tamanoVaso'
import type { Insumo } from '../types/insumo'

export interface ComboUnidad {
  tipoUnidad: string
  valorUnidad: number
  etiqueta: string
}

/** Presets del desplegable "Tipo de unidad" pedidos por Erick (ml, gr, kg,
 * lt, Unidad, oz). Los tipos personalizados que ya existan en datos reales
 * se agregan aparte, con el mismo criterio que `tiposPersonalizados` para
 * `insumos.tipo` (ver InsumosPage.tsx). */
export const TIPOS_UNIDAD_PRESET: { value: string; label: string }[] = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'oz', label: 'Onzas (oz)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'lt', label: 'Litros (lt)' },
  { value: 'gr', label: 'Gramos (gr)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
]

/**
 * Formatea (tipoUnidad, valorUnidad) con el mismo criterio visual que la
 * columna generada `insumos.unidad_medida` en BD (ver migración
 * 20260912000003_insumos_tipo_valor_unidad.sql): "9oz", "400ml", "unidad".
 */
export function formatearUnidad(tipoUnidad: string, valorUnidad: number): string {
  if (tipoUnidad === 'unidad' && valorUnidad === 1) return 'unidad'
  const valorTexto = Number.isInteger(valorUnidad) ? String(valorUnidad) : String(valorUnidad)
  return `${valorTexto}${tipoUnidad}`
}

/**
 * Combinaciones únicas (tipoUnidad, valorUnidad) de insumos activos que
 * pertenecen a la categoría de producto dada (ver `insumos.categoria_producto`,
 * columna derivada de `tipo`). Es la fuente de verdad para el selector de
 * "Tamaños y Precios" / "Presentaciones" en Productos (ticket post-MVP
 * "relacionar categoría de producto con tipo de insumo", Opción A confirmada
 * por Erick: se muestran TODAS las combinaciones disponibles para ese tipo,
 * el administrador elige explícitamente cuál usar).
 */
export function combosUnidadPorCategoria(
  insumos: { activo: boolean; categoriaProducto?: string | null; tipoUnidad: string; valorUnidad: number }[],
  categoria: string,
): ComboUnidad[] {
  const vistos = new Set<string>()
  const combos: ComboUnidad[] = []
  for (const insumo of insumos) {
    if (!insumo.activo || insumo.categoriaProducto !== categoria) continue
    const clave = `${insumo.tipoUnidad}|${insumo.valorUnidad}`
    if (vistos.has(clave)) continue
    vistos.add(clave)
    combos.push({
      tipoUnidad: insumo.tipoUnidad,
      valorUnidad: insumo.valorUnidad,
      etiqueta: formatearUnidad(insumo.tipoUnidad, insumo.valorUnidad),
    })
  }
  return combos.sort((a, b) => a.valorUnidad - b.valorUnidad)
}

/**
 * Combinaciones (tipoUnidad, valorUnidad) de `insumos` para la categoría del
 * producto que TODAVÍA no están configuradas como fila de
 * `producto_tamano_precio`. Una combinación se considera "ya configurada" si
 * alguna fila de precio del producto apunta a una fila de `tamanos_vaso` de
 * la misma categoría con el mismo valor numérico (onzas para 'oz',
 * mililitros para 'ml'; etiqueta como respaldo para otros tipos de unidad) --
 * ver `tamanoVasoService.resolverOCrear`, que crea esa fila de una vez si
 * todavía no existe cuando se guarda un precio nuevo.
 *
 * Vive acá (y no en un componente) para poder reutilizarse tanto desde
 * `ProductosTable` (agregar presentación a un producto existente) como desde
 * `ProductoForm` (evitar ofrecer, al crear un producto nuevo con un nombre
 * que ya existe en el catálogo, presentaciones que ese producto ya tiene
 * guardadas -- ticket fix "duplicar presentaciones/productos con nombre ya
 * existente en catálogo", 2026-09-12).
 */
export function obtenerCombosDisponibles(
  producto: Producto,
  precios: ProductoTamanoPrecio[],
  tamanosVaso: TamanoVaso[],
  insumos: Insumo[],
): ComboUnidad[] {
  if (producto.categoria === 'otro' || producto.categoria === 'adicionales') return []
  const filasProducto = precios.filter((p) => p.productoId === producto.id)
  const combos = combosUnidadPorCategoria(insumos, producto.categoria)
  return combos.filter((combo) => {
    return !filasProducto.some((fila) => {
      const tamano = tamanosVaso.find((t) => t.id === fila.tamanoVasoId)
      if (!tamano || tamano.categoria !== producto.categoria) return false
      if (combo.tipoUnidad === 'oz') return tamano.onzas === combo.valorUnidad
      if (combo.tipoUnidad === 'ml') return tamano.mililitros === combo.valorUnidad
      return tamano.etiqueta === combo.etiqueta
    })
  })
}
