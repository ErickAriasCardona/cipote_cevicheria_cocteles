/**
 * Espejo tipado de la tabla `tamanos_vaso` (BD-02.3, RF-04.2).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 6.
 *
 * No existía un servicio/tipo dedicado hasta BD-04: `InventarioInicialForm`
 * (BD-02.3) solo necesitaba el insumo-vaso asociado (tipo Insumo), nunca la
 * fila de `tamanos_vaso` en sí. El POS de ventas (BD-04.3) sí necesita listar
 * tamaños de vaso vendibles directamente.
 */
export type TipoTamanoVaso = 'vaso' | 'bebida'

export interface TamanoVaso {
  id: string
  etiqueta: string
  tipo: TipoTamanoVaso
  onzas: number | null
  mililitros: number | null
  insumoId: string | null
  activo: boolean
  createdAt: string
}
