import { supabase } from '../lib/supabaseClient'
import type { ActualizarInsumoInput, CrearInsumoInput, Insumo } from '../types/insumo'

/**
 * Servicio de gestión de insumos (BD-02.3, RF-04.1).
 *
 * Deliberadamente NO expone una forma de editar `stockActual` directamente:
 * todo cambio de existencias debe quedar trazado en `movimientos_inventario`
 * (RN-005) para no romper la auditoría punto-en-el-tiempo (`stock_resultante`).
 * Ver movimientosInventarioService.ts para el estado (pendiente) del registro
 * de inventario inicial.
 */

interface InsumoRow {
  id: string
  nombre: string
  tipo: 'vaso' | 'otro'
  unidad_medida: string
  stock_actual: number
  stock_minimo: number
  activo: boolean
  created_at: string
  updated_at: string
}

const COLUMNAS = 'id, nombre, tipo, unidad_medida, stock_actual, stock_minimo, activo, created_at, updated_at'

function mapRow(row: InsumoRow): Insumo {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    unidadMedida: row.unidad_medida,
    stockActual: row.stock_actual,
    stockMinimo: row.stock_minimo ?? 0,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const insumosService = {
  async listarInsumos(): Promise<Insumo[]> {
    const { data, error } = await supabase
      .from('insumos')
      .select(COLUMNAS)
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data as InsumoRow[]).map(mapRow)
  },

  async crearInsumo(input: CrearInsumoInput): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumos')
      .insert({
        nombre: input.nombre,
        tipo: input.tipo ?? 'otro',
        unidad_medida: input.unidadMedida ?? 'unidad',
        stock_minimo: input.stockMinimo ?? 0,
      })
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as InsumoRow)
  },

  async actualizarInsumo(id: string, cambios: ActualizarInsumoInput): Promise<Insumo> {
    const payload: Partial<InsumoRow> = {}
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre
    if (cambios.tipo !== undefined) payload.tipo = cambios.tipo
    if (cambios.unidadMedida !== undefined) payload.unidad_medida = cambios.unidadMedida
    if (cambios.stockMinimo !== undefined) payload.stock_minimo = cambios.stockMinimo
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await supabase
      .from('insumos')
      .update(payload)
      .eq('id', id)
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as InsumoRow)
  },
}
