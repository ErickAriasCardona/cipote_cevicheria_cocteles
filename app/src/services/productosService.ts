import { supabase } from '../lib/supabaseClient'
import type { ActualizarProductoInput, CrearProductoInput, Producto } from '../types/producto'

/**
 * Servicio de gestión de productos (BD-02.2, RF-03.1).
 *
 * A diferencia de usuariosService.crearUsuario (BD-01.5), aquí no se necesita
 * Edge Function: el INSERT directo bajo RLS ya está cubierto por la política
 * `productos_insert` (fn_check_permission) para el rol administrador —
 * mismo patrón de PostgREST directo que Prometeo describe para CRUD simple.
 *
 * Ajuste RN-011 (2026-09-05): el precio de venta ya no vive aquí, vive en
 * `producto_tamano_precio` (ver `productoTamanoPrecioService.ts`). `precio`
 * se renombró a `precio_legado` en la migración
 * `20260905000001_producto_tamano_precio.sql` y ya no participa en
 * insert/update — se conserva solo como referencia visual de solo lectura.
 */

interface ProductoRow {
  id: string
  nombre: string
  precio_legado: number | null
  activo: boolean
  created_at: string
  updated_at: string
}

function mapRow(row: ProductoRow): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    precioLegado: row.precio_legado,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const productosService = {
  async listarProductos(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, precio_legado, activo, created_at, updated_at')
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data as ProductoRow[]).map(mapRow)
  },

  async crearProducto(input: CrearProductoInput): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .insert({ nombre: input.nombre })
      .select('id, nombre, precio_legado, activo, created_at, updated_at')
      .single()
    if (error) throw error
    return mapRow(data as ProductoRow)
  },

  async actualizarProducto(id: string, cambios: ActualizarProductoInput): Promise<Producto> {
    const payload: Partial<ProductoRow> = {}
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await supabase
      .from('productos')
      .update(payload)
      .eq('id', id)
      .select('id, nombre, precio_legado, activo, created_at, updated_at')
      .single()
    if (error) throw error
    return mapRow(data as ProductoRow)
  },
}
