/**
 * Espejo tipado de la tabla `categorias_gasto` (BD-08.1/08.2, RF-05.2).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 14.
 */
export interface CategoriaGasto {
  id: string
  nombre: string
  activo: boolean
  creadoPor: string
  creadoEn: string
}

/** Payload para dar de alta una categoría de gasto (HU-05.2). */
export interface CrearCategoriaGastoInput {
  nombre: string
}

/** Cambios permitidos sobre una categoría ya existente. "Eliminar" es en
 * realidad activo=false (nunca DELETE físico, ver migración
 * 20260905000003_categorias_gasto.sql). */
export interface ActualizarCategoriaGastoInput {
  nombre?: string
  activo?: boolean
}
