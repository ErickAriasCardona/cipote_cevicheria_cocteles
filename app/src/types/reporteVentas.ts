/**
 * Tipos de apoyo para reportes de ventas (BD-09, RF-06.1/HU-06.1, CU-06.1).
 * No hay tabla nueva: `VentaReporte` es una proyección mínima de `ventas`
 * (solo las columnas que la agregación necesita), y `PeriodoAgregado` es el
 * resultado de agrupar esa proyección por día/semana/mes en el cliente (ver
 * `utils/agregarVentasPorPeriodo.ts`).
 */
export interface VentaReporte {
  id: string
  total: number
  createdAt: string
}

export type Granularidad = 'dia' | 'semana' | 'mes'

export interface PeriodoAgregado {
  /** Clave ordenable del periodo (YYYY-MM-DD / YYYY-Www / YYYY-MM). */
  clave: string
  etiqueta: string
  totalVendido: number
  cantidadVentas: number
}
