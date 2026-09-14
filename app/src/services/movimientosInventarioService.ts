import { supabase } from '../lib/supabaseClient'
import type {
  MovimientoInventario,
  ReestablecerInventarioInput,
  RegistrarConteoInventarioInput,
  RegistrarIngresoVasosInput,
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

interface KardexMovimientoRow extends MovimientoInventarioRow {
  insumos?: {
    nombre: string
    unidad_medida: string | null
    tipo: string
  } | null
  usuarios_perfil?: {
    nombre_completo: string
    rol: string
  } | null
}

function mapRow(row: MovimientoInventarioRow): MovimientoInventario {
  return {
    id: row.id,
    insumoId: row.insumo_id,
    ventaId: row.venta_id,
    tipoMovimiento: row.tipo_movimiento,
    cantidad: Number(row.cantidad),
    stockResultante: Number(row.stock_resultante),
    usuarioId: row.usuario_id,
    observaciones: row.observaciones,
    createdAt: row.created_at,
  }
}

function mapKardexRow(row: KardexMovimientoRow): MovimientoInventario {
  return {
    id: row.id,
    insumoId: row.insumo_id,
    ventaId: row.venta_id,
    tipoMovimiento: row.tipo_movimiento,
    cantidad: Number(row.cantidad),
    stockResultante: Number(row.stock_resultante),
    usuarioId: row.usuario_id,
    observaciones: row.observaciones,
    createdAt: row.created_at,
    insumoNombre: row.insumos?.nombre ?? 'Insumo',
    insumoUnidad: row.insumos?.unidad_medida ?? 'unidad',
    insumoTipo: row.insumos?.tipo ?? 'otro',
    usuarioNombre: row.usuarios_perfil?.nombre_completo ?? 'Sistema',
    usuarioRol: row.usuarios_perfil?.rol ?? '',
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

  /** Registra ingreso de vasos para la venta realizado por la cajera en su turno (afecta únicamente stock_minimo_diario) */
  async registrarIngresoVasos(
    input: RegistrarIngresoVasosInput,
  ): Promise<MovimientoInventario> {
    // 1. Intentar registrar vía RPC seguro fn_registrar_ingreso_vasos_cajero (SECURITY DEFINER)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'fn_registrar_ingreso_vasos_cajero',
        {
          p_insumo_id: input.insumoId,
          p_cantidad: input.cantidad,
          p_usuario_id: input.usuarioId,
          p_observaciones: input.observaciones ?? 'Ingreso de vasos para venta en turno (Stock del Día)',
        },
      )

      if (!rpcError && rpcData) {
        return mapRow(rpcData as MovimientoInventarioRow)
      }
    } catch {
      // Continuar con fallback directo
    }

    // 2. Fallback: Actualizar exclusivamente stock_minimo_diario (stock del día)
    const { data: insumoData, error: insumoError } = await supabase
      .from('insumos')
      .select('stock_actual, stock_minimo_diario')
      .eq('id', input.insumoId)
      .single()
    if (insumoError) throw insumoError

    const stockActual = Number(insumoData?.stock_actual ?? 0)
    const stockMinimoDiario = Number(insumoData?.stock_minimo_diario ?? 0)
    const stockDiaActual = stockMinimoDiario > 0 ? stockMinimoDiario : stockActual
    const stockDiaResultante = stockDiaActual + input.cantidad

    // Registrar movimiento
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .insert({
        insumo_id: input.insumoId,
        tipo_movimiento: 'ingreso_vasos',
        cantidad: input.cantidad,
        stock_resultante: stockDiaResultante,
        usuario_id: input.usuarioId,
        observaciones: input.observaciones ?? 'Ingreso de vasos para la venta en turno (Stock del Día)',
      })
      .select(SELECT_MOVIMIENTO)
      .single()
    if (error) throw error

    // Actualizar exclusivamente stock del día
    await supabase
      .from('insumos')
      .update({ stock_minimo_diario: stockDiaResultante })
      .eq('id', input.insumoId)

    return mapRow(data as MovimientoInventarioRow)
  },

  /** Lista historial de ingresos de vasos */
  async listarIngresosVasos(limite = 50): Promise<MovimientoInventario[]> {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select(SELECT_MOVIMIENTO)
      .eq('tipo_movimiento', 'ingreso_vasos')
      .order('created_at', { ascending: false })
      .limit(limite)
    if (error) throw error
    return (data as MovimientoInventarioRow[]).map(mapRow)
  },

  /**
   * Obtiene el listado completo de movimientos para el Kardex del Administrador
   * con datos enriquecidos del insumo y del usuario responsable.
   */
  async listarKardexMovimientos(filtros?: import('../types/movimientoInventario').FiltrosKardex): Promise<MovimientoInventario[]> {
    let query = supabase
      .from('movimientos_inventario')
      .select(`
        id,
        insumo_id,
        venta_id,
        tipo_movimiento,
        cantidad,
        stock_resultante,
        usuario_id,
        observaciones,
        created_at,
        insumos (nombre, unidad_medida, tipo),
        usuarios_perfil (nombre_completo, rol)
      `)
      .order('created_at', { ascending: false })

    if (filtros?.insumoId) {
      query = query.eq('insumo_id', filtros.insumoId)
    }

    if (filtros?.tipoMovimiento && filtros.tipoMovimiento !== 'todos') {
      query = query.eq('tipo_movimiento', filtros.tipoMovimiento)
    }

    if (filtros?.limite) {
      query = query.limit(filtros.limite)
    } else {
      query = query.limit(100)
    }

    const { data, error } = await query
    if (error) throw error
    return ((data ?? []) as unknown as KardexMovimientoRow[]).map(mapKardexRow)
  },

  /**
   * Reestablece o fija el inventario de vasos para el día/turno por parte del Administrador.
   * Actualiza el stock de cada insumo y registra el movimiento de ajuste con trazabilidad completa en Kardex.
   */
  async reestablecerInventarioVasos(input: ReestablecerInventarioInput): Promise<void> {
    const motivoTexto = input.motivo?.trim()
      ? `Reestablecimiento de turno por Administrador: ${input.motivo.trim()}`
      : 'Reestablecimiento de inventario del día / turno por Administrador'

    for (const item of input.items) {
      const stockAnterior = Math.round(item.stockActual)
      const nuevoStock = Math.round(item.nuevoStock)
      const diferencia = nuevoStock - stockAnterior

      // Registrar movimiento de auditoría
      const { error: insertErr } = await supabase
        .from('movimientos_inventario')
        .insert({
          insumo_id: item.insumoId,
          tipo_movimiento: 'ajuste_manual',
          cantidad: diferencia,
          stock_resultante: nuevoStock,
          usuario_id: input.usuarioId,
          observaciones: `${motivoTexto} (Anterior: ${stockAnterior} -> Nuevo: ${nuevoStock})`,
        })
      if (insertErr) throw insertErr

      // Actualizar stock actual en insumos
      const { error: updateErr } = await supabase
        .from('insumos')
        .update({ stock_actual: nuevoStock })
        .eq('id', item.insumoId)
      if (updateErr) throw updateErr
    }
  },
}
