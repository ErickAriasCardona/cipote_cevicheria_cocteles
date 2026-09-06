/**
 * Espejo tipado de la tabla `gastos` (BD-08.1/08.3, RF-05.1).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 13.
 */
export interface Gasto {
  id: string
  categoriaId: string
  descripcion: string
  monto: number
  /** Fecha del gasto (formato `date`, YYYY-MM-DD), puede diferir de
   * `createdAt` si se registra tarde (HU-05.1 CA-01). */
  fecha: string
  registradoPor: string
  createdAt: string
  updatedAt: string
  /** Nombre de la categoría, embebido vía join (categorias_gasto(nombre))
   * para no requerir una consulta extra en la UI — mismo patrón ya usado en
   * `VentaConEstadoEliminacion.productoNombre` (ventasService.ts). */
  categoriaNombre: string
}

/** Payload para registrar un gasto (HU-05.1). `fecha` es opcional: si se
 * omite, la columna toma `CURRENT_DATE` por default de la tabla. */
export interface CrearGastoInput {
  categoriaId: string
  descripcion: string
  monto: number
  fecha?: string
}
