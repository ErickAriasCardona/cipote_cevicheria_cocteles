/**
 * Espejo tipado de la tabla `insumos` (BD-02.3, RF-04.1).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 7.
 */
export type TipoInsumo = 'vaso' | 'otro' | string
export type CategoriaVasoInsumo = 'ceviche' | 'granizado'

export interface Insumo {
  id: string
  nombre: string
  tipo: TipoInsumo
  categoriaVaso?: CategoriaVasoInsumo | null
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  stockMinimoDiario: number
  activo: boolean
  createdAt: string
  updatedAt: string
}

/** Payload para dar de alta un insumo (HU-04.1). */
export interface CrearInsumoInput {
  nombre: string
  tipo?: TipoInsumo
  categoriaVaso?: CategoriaVasoInsumo | null
  unidadMedida?: string
  stockActual?: number
  stockMinimo?: number
  stockMinimoDiario?: number
}

/** Cambios permitidos sobre un insumo ya existente. */
export interface ActualizarInsumoInput {
  nombre?: string
  tipo?: TipoInsumo
  categoriaVaso?: CategoriaVasoInsumo | null
  unidadMedida?: string
  stockActual?: number
  stockMinimo?: number
  stockMinimoDiario?: number
  activo?: boolean
}
