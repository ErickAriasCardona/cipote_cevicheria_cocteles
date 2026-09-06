import { supabase } from '../lib/supabaseClient'
import type { ActualizarProductoInput, CategoriaProducto, CrearProductoInput, Producto } from '../types/producto'

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
  categoria: CategoriaProducto
  descripcion: string | null
  precio: number | null
  precio_legado: number | null
  activo: boolean
  created_at: string
  updated_at: string
}

const COLUMNAS = 'id, nombre, categoria, descripcion, precio, precio_legado, activo, created_at, updated_at'

function mapRow(row: ProductoRow): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    descripcion: row.descripcion,
    precio: row.precio,
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
      .select(COLUMNAS)
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data as ProductoRow[]).map(mapRow)
  },

  async crearProducto(input: CrearProductoInput): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .insert({
        nombre: input.nombre,
        categoria: input.categoria,
        descripcion: input.descripcion ?? null,
        precio: input.precio ?? null,
      })
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as ProductoRow)
  },

  async actualizarProducto(id: string, cambios: ActualizarProductoInput): Promise<Producto> {
    const payload: Partial<ProductoRow> = {}
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre
    if (cambios.categoria !== undefined) payload.categoria = cambios.categoria
    if (cambios.descripcion !== undefined) payload.descripcion = cambios.descripcion
    if (cambios.precio !== undefined) payload.precio = cambios.precio
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await supabase
      .from('productos')
      .update(payload)
      .eq('id', id)
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as ProductoRow)
  },

  async eliminarProducto(id: string): Promise<void> {
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'No se puede eliminar este producto porque ya tiene ventas registradas en el histórico. Puedes apagarlo (desactivarlo) para que no esté disponible para la venta.',
        )
      }
      throw error
    }
  },
}
