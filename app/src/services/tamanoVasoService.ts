import { supabase } from '../lib/supabaseClient'
import type { CategoriaTamanoVaso, TamanoVaso } from '../types/tamanoVaso'
import { formatearUnidad } from '../utils/unidadMedida'

/**
 * Puente entre el catálogo de unidades de `insumos` (fuente de verdad de
 * tamaños/presentaciones disponibles desde el ticket post-MVP "relacionar
 * categoría de producto con tipo de insumo") y `tamanos_vaso`, que sigue
 * siendo la tabla que `producto_tamano_precio.tamano_vaso_id` referencia
 * (RN-011, sin cambios de esquema ahí para no tocar ventas/registrar-venta).
 *
 * El selector de "Tamaños y Precios" en Productos ya no lista filas
 * pre-existentes de `tamanos_vaso`: lista combinaciones (tipoUnidad,
 * valorUnidad) tomadas en vivo de `insumos` para el tipo relacionado a la
 * categoría (ver `utils/unidadMedida.combosUnidadPorCategoria`). Al guardar
 * un precio para una combinación, `resolverOCrear` busca si ya existe una
 * fila de `tamanos_vaso` equivalente (misma categoría + mismo valor numérico)
 * y, si no, la crea de una vez -- con `insumo_id = null`: Opción A confirmada
 * por Erick es un selector explícito de unidad, no una inferencia forzada
 * desde un insumo concreto ya vinculado.
 */

interface TamanoVasoRow {
  id: string
  etiqueta: string
  tipo: 'vaso' | 'bebida'
  categoria: CategoriaTamanoVaso
  onzas: number | null
  mililitros: number | null
  insumo_id: string | null
  activo: boolean
  created_at: string
}

const COLUMNAS = 'id, etiqueta, tipo, categoria, onzas, mililitros, insumo_id, activo, created_at'

function mapRow(row: TamanoVasoRow): TamanoVaso {
  return {
    id: row.id,
    etiqueta: row.etiqueta,
    tipo: row.tipo,
    categoria: row.categoria,
    onzas: row.onzas,
    mililitros: row.mililitros,
    insumoId: row.insumo_id,
    activo: row.activo,
    createdAt: row.created_at,
  }
}

interface ResolverTamanoVasoInput {
  categoria: CategoriaTamanoVaso
  tipoUnidad: string
  valorUnidad: number
}

export const tamanoVasoService = {
  /**
   * Lista todos los tamaños de vaso / presentaciones activas en el sistema.
   */
  async listarActivos(): Promise<TamanoVaso[]> {
    const { data, error } = await supabase
      .from('tamanos_vaso')
      .select(COLUMNAS)
      .eq('activo', true)
      .order('etiqueta', { ascending: true })
    if (error) throw error
    return (data as TamanoVasoRow[]).map(mapRow)
  },

  /** Busca una fila de `tamanos_vaso` que ya represente esta combinación
   * (categoria + onzas si tipoUnidad='oz', o + mililitros si ='ml', o por
   * etiqueta como respaldo para otros tipos de unidad); si no existe, la
   * crea. Nunca duplica: la unicidad (etiqueta, categoria) en BD (ver
   * 20260912000005_tamanos_vaso_unico_por_categoria.sql) es la red de
   * seguridad final ante una carrera entre dos guardados simultáneos. */
  async resolverOCrear(input: ResolverTamanoVasoInput): Promise<TamanoVaso> {
    const etiqueta = formatearUnidad(input.tipoUnidad, input.valorUnidad)

    let busqueda = supabase.from('tamanos_vaso').select(COLUMNAS).eq('categoria', input.categoria)
    if (input.tipoUnidad === 'oz') busqueda = busqueda.eq('onzas', input.valorUnidad)
    else if (input.tipoUnidad === 'ml') busqueda = busqueda.eq('mililitros', input.valorUnidad)
    else busqueda = busqueda.eq('etiqueta', etiqueta)

    const { data: existentes, error: errorBusqueda } = await busqueda.limit(1)
    if (errorBusqueda) throw errorBusqueda
    if (existentes && existentes.length > 0) return mapRow(existentes[0] as TamanoVasoRow)

    const { data, error } = await supabase
      .from('tamanos_vaso')
      .insert({
        etiqueta,
        tipo: input.categoria === 'bebida' ? 'bebida' : 'vaso',
        categoria: input.categoria,
        onzas: input.tipoUnidad === 'oz' ? input.valorUnidad : null,
        mililitros: input.tipoUnidad === 'ml' ? input.valorUnidad : null,
        insumo_id: null,
        activo: true,
      })
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as TamanoVasoRow)
  },
}
