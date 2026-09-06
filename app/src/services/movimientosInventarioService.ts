import { supabase } from '../lib/supabaseClient'
import type {
  MovimientoInventario,
  RegistrarInventarioInicialInput,
} from '../types/movimientoInventario'

/**
 * Servicio sobre `movimientos_inventario` (BD-02.1 Mejora propuesta 1, BD-02.3).
 *
 * La matriz de acceso de Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección
 * 5.3) documenta esta tabla como de solo lectura para Administrador y sin
 * ningún INSERT directo bajo RLS ("solo INSERT vía service_role", mismo
 * patrón que `ventas`/`cierres_caja`/`venta_pagos`). Eso dejó sin mecanismo
 * real, durante el desarrollo de BD-02.3 (Fase 4, 2026-09-04), la
 * funcionalidad de "registrar inventario inicial de vasos" que ese subbloque
 * sí necesita (RF-04.2/HU-04.2) — inconsistencia real detectada y NO resuelta
 * unilateralmente en su momento (regla explícita de Vulcano); se dejaron 3
 * alternativas documentadas para que Erick decidiera.
 *
 * Decisión final de Erick (2026-09-04): Opción 2. Migración
 * `20260904000007_movimientos_inventario_insert_administrador.sql` agrega la
 * fila `rol_permisos` (administrador, movimientos_inventario, insert, true) y
 * la política `movimientos_inventario_insert_inicial`, que solo permite el
 * INSERT cuando `tipo_movimiento = 'inventario_inicial'`. `tipo_movimiento =
 * 'venta'` sigue siendo exclusivo de `service_role` (Edge Function
 * `registrar-venta`, BD-04) — esta función nunca inserta esas filas.
 *
 * `registrarInventarioInicial` hace el INSERT directo bajo esa política y
 * además actualiza `insumos.stock_actual` (permitido por la fila ya existente
 * `('administrador', 'insumos', 'update', true)` del seed de BD-01): el
 * conteo inicial fija el stock absoluto del insumo, no lo incrementa. No es
 * una operación atómica a nivel de base de datos (dos llamadas PostgREST
 * separadas, sin Edge Function/transacción) — aceptado deliberadamente por
 * Erick al elegir Opción 2 en vez de una Edge Function nueva; el índice único
 * parcial `ux_movimientos_inventario_inicial_dia` sigue protegiendo contra el
 * doble registro del mismo insumo el mismo día (HU-04.2 CA-04).
 */

interface MovimientoInventarioRow {
  id: string
  insumo_id: string
  venta_id: string | null
  tipo_movimiento: 'venta' | 'ajuste_manual' | 'inventario_inicial'
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

  /** Registra el conteo de inventario inicial de un insumo (HU-04.2). Ver la
   * nota de cabecera de este archivo: `cantidad` fija el stock absoluto del
   * insumo (no lo incrementa), y solo puede ejecutarse una vez por insumo por
   * día (índice único parcial `ux_movimientos_inventario_inicial_dia`; un
   * segundo intento el mismo día falla con SQLSTATE 23505). */
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
