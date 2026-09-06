import { supabase } from '../lib/supabaseClient'
import type {
  MovimientoInventario,
  RegistrarConteoInventarioInput,
  RegistrarInventarioInicialInput,
  TipoMovimientoInventario,
} from '../types/movimientoInventario'

/**
 * Servicio sobre `movimientos_inventario` (BD-02.1, BD-02.3, RF-04.2/RF-04.3).
 * Soporta registro de conteo diario en Apertura y Cierre por el Administrador.
 */

interface MovimientoInventarioRow {
  id: string
  insumo_id: string
  venta_id: string | null
  tipo_movimiento: TipoMovimientoInventario
  cantidad: number
  stock_resultante: number
  usuario_id: string
  observaciones: string | null
  created_at: string
}

function mapRow(row: MovimientoInventarioRow): MovimientoInventario {
  return {
    id: row.id,
    insumoId: row.insumo_id,
    ventaId: row.venta_id,
    tipoMovimiento: row.tipo_movimiento,
    cantidad: row.cantidad,
    stockResultante: row.stock_resultante,
    usuarioId: row.usuario_id,
    observaciones: row.observaciones,
    createdAt: row.created_at,
  }
}

const SELECT_MOVIMIENTO =
  'id, insumo_id, venta_id, tipo_movimiento, cantidad, stock_resultante, usuario_id, observaciones, created_at'

export const movimientosInventarioService = {
  async listarMovimientos(): Promise<MovimientoInventario[]> {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select(SELECT_MOVIMIENTO)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as MovimientoInventarioRow[]).map(mapRow)
  },

  /**
   * Obtiene los conteos diarios recientes (Apertura / Cierre / Inventario inicial).
   */
  async listarConteosRecientes(limite = 30): Promise<MovimientoInventario[]> {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select(SELECT_MOVIMIENTO)
      .in('tipo_movimiento', ['conteo_apertura', 'conteo_cierre', 'inventario_inicial'])
      .order('created_at', { ascending: false })
      .limit(limite)
    if (error) throw error
    return (data as MovimientoInventarioRow[]).map(mapRow)
  },

  /**
   * Registra el conteo diario general de inventario (Apertura o Cierre) para un insumo.
   * Fija el `stock_actual` del insumo al valor contado y deja registro inmutable.
   */
  async registrarConteoInventario(
    input: RegistrarConteoInventarioInput,
  ): Promise<MovimientoInventario> {
    const stockResultante = input.cantidad
    const tipoMovimiento: TipoMovimientoInventario =
      input.momento === 'apertura' ? 'conteo_apertura' : 'conteo_cierre'

    const { data, error } = await supabase
      .from('movimientos_inventario')
      .insert({
        insumo_id: input.insumoId,
        tipo_movimiento: tipoMovimiento,
        cantidad: input.cantidad,
        stock_resultante: stockResultante,
        usuario_id: input.usuarioId,
        observaciones: input.observaciones ?? null,
      })
      .select(SELECT_MOVIMIENTO)
      .single()
    if (error) throw error

    const { error: updateError } = await supabase
      .from('insumos')
      .update({ stock_actual: stockResultante })
      .eq('id', input.insumoId)
    if (updateError) throw updateError

    return mapRow(data as MovimientoInventarioRow)
  },

  /** Registra el conteo de inventario inicial legado de un insumo (HU-04.2). */
  async registrarInventarioInicial(
    input: RegistrarInventarioInicialInput,
  ): Promise<MovimientoInventario> {
    const stockResultante = input.cantidad

    const { data, error } = await supabase
      .from('movimientos_inventario')
      .insert({
        insumo_id: input.insumoId,
        tipo_movimiento: 'inventario_inicial',
        cantidad: input.cantidad,
        stock_resultante: stockResultante,
        usuario_id: input.usuarioId,
        observaciones: input.observaciones ?? null,
      })
      .select(SELECT_MOVIMIENTO)
      .single()
    if (error) throw error

    const { error: updateError } = await supabase
      .from('insumos')
      .update({ stock_actual: stockResultante })
      .eq('id', input.insumoId)
    if (updateError) throw updateError

    return mapRow(data as MovimientoInventarioRow)
  },
}
