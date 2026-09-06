/**
 * Espejo tipado de la tabla `movimientos_inventario` (BD-02.1 Mejora propuesta 1,
 * RF-04.2/RF-04.3). Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 11.
 *
 * `venta`: exclusivo de `service_role` (Edge Function `registrar-venta`,
 * BD-04). `inventario_inicial`: INSERT directo bajo RLS habilitado para
 * administrador (migración `20260904000007_movimientos_inventario_insert_administrador.sql`,
 * decisión de Erick 2026-09-04, Opción 2) — ver movimientosInventarioService.ts.
 */
export type TipoMovimientoInventario = 'venta' | 'ajuste_manual' | 'inventario_inicial'

export interface MovimientoInventario {
  id: string
  insumoId: string
  ventaId: string | null
  tipoMovimiento: TipoMovimientoInventario
  cantidad: number
  stockResultante: number
  usuarioId: string
  observaciones: string | null
  createdAt: string
}

/** Payload para registrar el conteo de inventario inicial de un insumo
 * (HU-04.2). Solo válido para `tipo_movimiento = 'inventario_inicial'`: la
 * política RLS `movimientos_inventario_insert_inicial` rechaza cualquier otro
 * valor para el rol administrador, y ningún rol puede insertar `'venta'`
 * directamente (exclusivo de service_role, BD-04). */
export interface RegistrarInventarioInicialInput {
  insumoId: string
  cantidad: number
  usuarioId: string
  observaciones?: string | null
}
