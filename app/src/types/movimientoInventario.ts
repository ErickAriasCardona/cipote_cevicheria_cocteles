/**
 * Espejo tipado de la tabla `movimientos_inventario` (BD-02.1 Mejora propuesta 1,
 * RF-04.2/RF-04.3). Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 11.
 *
 * `venta`: exclusivo de `service_role` (Edge Function `registrar-venta`,
 * BD-04). `inventario_inicial`: INSERT directo bajo RLS habilitado para
 * administrador (migración `20260904000007_movimientos_inventario_insert_administrador.sql`,
 * decisión de Erick 2026-09-04, Opción 2) — ver movimientosInventarioService.ts.
 */
export type TipoMovimientoInventario =
  | 'venta'
  | 'ajuste_manual'
  | 'inventario_inicial'
  | 'conteo_apertura'
  | 'conteo_cierre'
  | 'ingreso_vasos'

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
  insumoNombre?: string
  insumoUnidad?: string
  insumoTipo?: string
  usuarioNombre?: string
  usuarioRol?: string
}

export interface FiltrosKardex {
  insumoId?: string
  tipoMovimiento?: TipoMovimientoInventario | 'todos'
  limite?: number
}

export type MomentoConteo = 'apertura' | 'cierre'

/** Payload para registrar el conteo de inventario diario (Apertura o Cierre) */
export interface RegistrarConteoInventarioInput {
  insumoId: string
  momento: MomentoConteo
  cantidad: number
  usuarioId: string
  observaciones?: string | null
}

/** Payload para registrar el conteo de inventario inicial de un insumo (legado) */
export interface RegistrarInventarioInicialInput {
  insumoId: string
  cantidad: number
  usuarioId: string
  observaciones?: string | null
}

/** Payload para registrar ingreso de vasos por parte de la cajera durante el turno */
export interface RegistrarIngresoVasosInput {
  insumoId: string
  cantidad: number
  usuarioId: string
  observaciones?: string | null
}

export interface ReestablecerVasoItem {
  insumoId: string
  tamanoVasoId?: string
  nombre: string
  etiqueta?: string
  stockActual: number
  nuevoStock: number
}

export interface ReestablecerInventarioInput {
  items: ReestablecerVasoItem[]
  usuarioId: string
  motivo?: string | null
}
