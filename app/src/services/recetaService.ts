import { supabase } from '../lib/supabaseClient'
import type {
  ActualizarRecetaInput,
  CondicionReceta,
  CrearRecetaInput,
  ProductoReceta,
} from '../types/productoReceta'

/**
 * Servicio de configuración de receta evolutiva (BD-02.4, RF-04.3, PD-005).
 * CRUD simple bajo RLS (PostgREST directo) — no incluye el motor de descuento
 * automático, que vive en la Edge Function `registrar-venta` (BD-04).
 */

interface ProductoRecetaRow {
  producto_id: string
  insumo_id: string
  condicion: CondicionReceta
  cantidad: number
  activo: boolean
  created_at: string
  updated_at: string
}

function mapRow(row: ProductoRecetaRow): ProductoReceta {
  return {
    productoId: row.producto_id,
    insumoId: row.insumo_id,
    condicion: row.condicion,
    cantidad: row.cantidad,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const recetaService = {
  async listarRecetaPorProducto(productoId: string): Promise<ProductoReceta[]> {
    const { data, error } = await supabase
      .from('producto_receta')
      .select('producto_id, insumo_id, condicion, cantidad, activo, created_at, updated_at')
      .eq('producto_id', productoId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data as ProductoRecetaRow[]).map(mapRow)
  },

  async crearRegla(input: CrearRecetaInput): Promise<ProductoReceta> {
    const { data, error } = await supabase
      .from('producto_receta')
      .insert({
        producto_id: input.productoId,
        insumo_id: input.insumoId,
        condicion: input.condicion ?? 'siempre',
        cantidad: input.cantidad,
      })
      .select('producto_id, insumo_id, condicion, cantidad, activo, created_at, updated_at')
      .single()
    if (error) throw error
    return mapRow(data as ProductoRecetaRow)
  },

  async actualizarRegla(
    productoId: string,
    insumoId: string,
    condicion: CondicionReceta,
    cambios: ActualizarRecetaInput,
  ): Promise<ProductoReceta> {
    const payload: Partial<ProductoRecetaRow> = {}
    if (cambios.cantidad !== undefined) payload.cantidad = cambios.cantidad
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await supabase
      .from('producto_receta')
      .update(payload)
      .eq('producto_id', productoId)
      .eq('insumo_id', insumoId)
      .eq('condicion', condicion)
      .select('producto_id, insumo_id, condicion, cantidad, activo, created_at, updated_at')
      .single()
    if (error) throw error
    return mapRow(data as ProductoRecetaRow)
  },
}
