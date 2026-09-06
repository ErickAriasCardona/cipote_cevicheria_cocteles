/**
 * Espejo tipado de la tabla `producto_receta` (BD-02.4, RF-04.3, PD-005).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 8.
 */
export type CondicionReceta = 'siempre' | 'para_llevar' | 'consumo_lugar'

export interface ProductoReceta {
  productoId: string
  insumoId: string
  condicion: CondicionReceta
  cantidad: number
  activo: boolean
  createdAt: string
  updatedAt: string
}

/** Payload para agregar un insumo a la receta de un producto (HU-04.3). */
export interface CrearRecetaInput {
  productoId: string
  insumoId: string
  condicion?: CondicionReceta
  cantidad: number
}

/** Cambios permitidos sobre una regla de receta ya existente. */
export interface ActualizarRecetaInput {
  cantidad?: number
  activo?: boolean
}
