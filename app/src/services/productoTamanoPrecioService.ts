import { supabase } from '../lib/supabaseClient'
import type {
  ActualizarProductoTamanoPrecioInput,
  CrearProductoTamanoPrecioInput,
  ProductoTamanoPrecio,
} from '../types/productoTamanoPrecio'

/**
 * Servicio de precios por producto x tamaño de vaso (RF-03.1, RN-011,
 * corrección quinta ronda 2026-09-05). CRUD simple bajo RLS (PostgREST
 * directo), mismo patrón que `recetaService.ts` (tabla puente con PK
 * compuesta, sin política DELETE — "quitar" un tamaño es `activo=false`).
 */

interface ProductoTamanoPrecioRow {
  producto_id: string
  tamano_vaso_id: string
  precio: number
  activo: boolean
  created_at: string
  updated_at: string
}

const COLUMNAS = 'producto_id, tamano_vaso_id, precio, activo, created_at, updated_at'

function mapRow(row: ProductoTamanoPrecioRow): ProductoTamanoPrecio {
  return {
    productoId: row.producto_id,
    tamanoVasoId: row.tamano_vaso_id,
    precio: row.precio,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const productoTamanoPrecioService = {
  /** Todas las combinaciones (activas e inactivas) de todos los productos —
   * usado por `ProductosPage` (Administrador) para mostrar cuántos tamaños
   * tiene configurado cada producto y para gestionar los de uno seleccionado,
   * mismo patrón de carga completa + filtrado en cliente que ya usa
   * `productosService.listarProductos` en `RecetaPage`. */
  async listarTodos(): Promise<ProductoTamanoPrecio[]> {
    const { data, error } = await supabase
      .from('producto_tamano_precio')
      .select(COLUMNAS)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data as ProductoTamanoPrecioRow[]).map(mapRow)
  },

  /** Solo combinaciones activas de todos los productos — usado por el POS de
   * ventas (`VentaPage`/`VentaForm`, RF-03.2) para resolver el precio
   * efectivo de la combinación producto+tamaño elegida por el Cajero. */
  async listarActivos(): Promise<ProductoTamanoPrecio[]> {
    const { data, error } = await supabase
      .from('producto_tamano_precio')
      .select(COLUMNAS)
      .eq('activo', true)
    if (error) throw error
    return (data as ProductoTamanoPrecioRow[]).map(mapRow)
  },

  async crear(input: CrearProductoTamanoPrecioInput): Promise<ProductoTamanoPrecio> {
    const { data, error } = await supabase
      .from('producto_tamano_precio')
      .insert({
        producto_id: input.productoId,
        tamano_vaso_id: input.tamanoVasoId,
        precio: input.precio,
      })
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as ProductoTamanoPrecioRow)
  },

  /** Cambia el precio y/o `activo` de una combinación ya existente. Nunca
   * DELETE (no hay política que lo permita): "quitar" un tamaño de un
   * producto se modela como `activo=false`. */
  async actualizar(
    productoId: string,
    tamanoVasoId: string,
    cambios: ActualizarProductoTamanoPrecioInput,
  ): Promise<ProductoTamanoPrecio> {
    const payload: Partial<ProductoTamanoPrecioRow> = {}
    if (cambios.precio !== undefined) payload.precio = cambios.precio
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await supabase
      .from('producto_tamano_precio')
      .update(payload)
      .eq('producto_id', productoId)
      .eq('tamano_vaso_id', tamanoVasoId)
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as ProductoTamanoPrecioRow)
  },

  /** Elimina físicamente la configuración de un tamaño y precio para el producto (permitido para administrador). */
  async eliminar(productoId: string, tamanoVasoId: string): Promise<void> {
    const { error } = await supabase
      .from('producto_tamano_precio')
      .delete()
      .eq('producto_id', productoId)
      .eq('tamano_vaso_id', tamanoVasoId)
    if (error) throw error
  },
}
