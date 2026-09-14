import { supabase } from '../lib/supabaseClient'
import type { CrearPromocionInput, Promocion, PromocionConDetalle, PromocionProductoItem } from '../types/promocion'

interface PromocionRow {
  id: string
  nombre: string
  precio: number
  imagen_url: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export const promocionesService = {
  /**
   * Lista todas las promociones con sus componentes y productos vinculados.
   */
  async listarPromociones(): Promise<PromocionConDetalle[]> {
    const { data: promosData, error: promosError } = await supabase
      .from('promociones')
      .select('*')
      .order('created_at', { ascending: false })

    if (promosError) throw promosError
    if (!promosData || promosData.length === 0) return []

    // Obtener componentes de todas las promociones con nombres de producto y tamaños
    const { data: compData, error: compError } = await supabase
      .from('promocion_productos')
      .select(`
        promocion_id,
        producto_id,
        cantidad,
        tamano_vaso_id,
        productos (
          id,
          nombre,
          categoria
        ),
        tamanos_vaso (
          id,
          etiqueta
        )
      `)

    if (compError) throw compError

    // Agrupar componentes por promocion_id
    const componentesPorPromo = new Map<string, PromocionProductoItem[]>()
    for (const row of (compData || []) as any[]) {
      const pId = row.promocion_id
      const item: PromocionProductoItem = {
        productoId: row.producto_id,
        nombreProducto: row.productos?.nombre || 'Producto',
        categoriaProducto: row.productos?.categoria || 'otro',
        tamanoVasoId: row.tamano_vaso_id,
        etiquetaTamano: row.tamanos_vaso?.etiqueta || null,
        cantidad: Number(row.cantidad),
      }
      const arr = componentesPorPromo.get(pId) || []
      arr.push(item)
      componentesPorPromo.set(pId, arr)
    }

    return (promosData as PromocionRow[]).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      imagenUrl: p.imagen_url,
      activo: p.activo,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      componentes: componentesPorPromo.get(p.id) || [],
    }))
  },

  /**
   * Da de alta una nueva promoción agrupando varios productos del catálogo.
   */
  async crearPromocion(input: CrearPromocionInput): Promise<Promocion> {
    if (!input.nombre.trim()) {
      throw new Error('El nombre de la promoción es obligatorio.')
    }
    if (input.precio <= 0) {
      throw new Error('El precio de la promoción debe ser mayor a cero.')
    }
    if (!input.componentes || input.componentes.length === 0) {
      throw new Error('Debes incluir al menos un producto en la promoción.')
    }

    // 1. Insertar promoción
    const { data: promoData, error: promoError } = await supabase
      .from('promociones')
      .insert({
        nombre: input.nombre.trim(),
        precio: input.precio,
        imagen_url: input.imagenUrl || null,
        activo: true,
      })
      .select('*')
      .single()

    if (promoError) {
      if (promoError.code === '23505') {
        throw new Error(`Ya existe una promoción con el nombre "${input.nombre.trim()}". Elige otro nombre.`)
      }
      throw promoError
    }

    const nuevaPromo = promoData as PromocionRow

    // 2. Consolidar productos repetidos para respetar la PK compuesta (promocion_id, producto_id)
    const componentesConsolidados = new Map<string, { producto_id: string; tamano_vaso_id: string | null; cantidad: number }>()
    for (const c of input.componentes) {
      const existente = componentesConsolidados.get(c.productoId)
      if (existente) {
        existente.cantidad += c.cantidad
        if (c.tamanoVasoId) existente.tamano_vaso_id = c.tamanoVasoId
      } else {
        componentesConsolidados.set(c.productoId, {
          producto_id: c.productoId,
          tamano_vaso_id: c.tamanoVasoId || null,
          cantidad: c.cantidad,
        })
      }
    }

    const componentesPayload = Array.from(componentesConsolidados.values()).map((c) => ({
      promocion_id: nuevaPromo.id,
      producto_id: c.producto_id,
      tamano_vaso_id: c.tamano_vaso_id,
      cantidad: c.cantidad,
    }))

    const { error: compError } = await supabase
      .from('promocion_productos')
      .insert(componentesPayload)

    if (compError) {
      // Si falla la inserción de componentes, limpiamos la promo huérfana
      await supabase.from('promociones').delete().eq('id', nuevaPromo.id)
      throw compError
    }

    return {
      id: nuevaPromo.id,
      nombre: nuevaPromo.nombre,
      precio: Number(nuevaPromo.precio),
      imagenUrl: nuevaPromo.imagen_url,
      activo: nuevaPromo.activo,
      createdAt: nuevaPromo.created_at,
      updatedAt: nuevaPromo.updated_at,
    }
  },

  /**
   * Actualiza la URL de imagen de una promoción.
   */
  async actualizarImagen(id: string, imagenUrl: string): Promise<void> {
    const { error } = await supabase
      .from('promociones')
      .update({ imagen_url: imagenUrl })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Activa o desactiva una promoción.
   */
  async toggleActivo(id: string, activo: boolean): Promise<void> {
    const { error } = await supabase
      .from('promociones')
      .update({ activo })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Elimina una promoción (la BD borra en cascada los registros de promocion_productos).
   */
  async eliminarPromocion(id: string): Promise<void> {
    const { error } = await supabase
      .from('promociones')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '23503') {
        throw new Error('No se puede eliminar esta promoción porque ya tiene ventas registradas. Puedes desactivarla para que no aparezca en la carta.')
      }
      throw error
    }
  },
}
