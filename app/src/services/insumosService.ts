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
  activo: boolean
  created_at: string
  updated_at: string
}

function mapRow(row: InsumoRow): Insumo {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    unidadMedida: row.unidad_medida,
    stockActual: row.stock_actual,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const insumosService = {
  async listarInsumos(): Promise<Insumo[]> {
    const { data, error } = await supabase
      .from('insumos')
      .select('id, nombre, tipo, unidad_medida, stock_actual, activo, created_at, updated_at')
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
      })
      .select('id, nombre, tipo, unidad_medida, stock_actual, activo, created_at, updated_at')
      .single()
    if (error) throw error
    return mapRow(data as InsumoRow)
  },

  async actualizarInsumo(id: string, cambios: ActualizarInsumoInput): Promise<Insumo> {
    const payload: Partial<InsumoRow> = {}
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre
    if (cambios.tipo !== undefined) payload.tipo = cambios.tipo
    if (cambios.unidadMedida !== undefined) payload.unidad_medida = cambios.unidadMedida
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await supabase
      .from('insumos')
      .update(payload)
      .eq('id', id)
      .select('id, nombre, tipo, unidad_medida, stock_actual, activo, created_at, updated_at')
      .single()
    if (error) throw error
    return mapRow(data as InsumoRow)
  },
}
