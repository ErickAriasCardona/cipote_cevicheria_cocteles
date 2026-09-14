import { formatearCOP } from './moneda'

/**
 * Etiquetas legibles del resultado de un cierre de caja sin decimales.
 */

/** Etiqueta de la diferencia de dinero contado vs. esperado. */
export function etiquetaDiferenciaDinero(diferencia: number): string {
  const diffRedondeada = Math.round(diferencia)
  if (diffRedondeada > 0) return `Sobró ${formatearCOP(diffRedondeada)}`
  if (diffRedondeada < 0) return `Faltó ${formatearCOP(Math.abs(diffRedondeada))}`
  return 'Sin diferencia'
}

/** Etiqueta de la diferencia de conteo físico de vasos vs. teórico. */
export function etiquetaDiferenciaVasos(diferencia: number): string {
  const diffRedondeada = Math.round(diferencia)
  if (diffRedondeada > 0) return `Sobrante de ${diffRedondeada}`
  if (diffRedondeada < 0) return `Faltante de ${Math.abs(diffRedondeada)}`
  return 'Sin diferencia'
}
