/**
 * Espejo tipado de la tabla `insumos` (BD-02.3, RF-04.1).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 7.
 */
export type TipoInsumo = 'vaso' | 'otro'

export interface Insumo {
  id: string
  nombre: string
  tipo: TipoInsumo
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  activo: boolean
  createdAt: string
  updatedAt: string
}

/** Payload para dar de alta un insumo (HU-04.1). No incluye stockActual:
 * el stock se establece únicamente vía movimientos_inventario (RN-005). */
export interface CrearInsumoInput {
  nombre: string
  tipo?: TipoInsumo
  unidadMedida?: string
  stockMinimo?: number
}

/** Cambios permitidos sobre un insumo ya existente (nunca stockActual directo). */
export interface ActualizarInsumoInput {
  nombre?: string
  tipo?: TipoInsumo
  unidadMedida?: string
  stockMinimo?: number
  activo?: boolean
}
