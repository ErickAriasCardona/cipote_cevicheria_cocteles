/**
 * Etiquetas legibles del resultado de un cierre de caja (BD-06.5, HU-02.3
 * CA-04 + HU-04.4 CA-01/CA-02). Compartido entre `ResultadoCierre` (Cajero,
 * justo después de cerrar) y `CierresCajaPage` (Administrador, consulta de
 * cierres ya guardados) para no duplicar el mismo criterio de signo en dos
 * archivos — mismo patrón ya usado en `utils/pagoMixto.ts`.
 */

/** Etiqueta de la diferencia de dinero contado vs. esperado. */
export function etiquetaDiferenciaDinero(diferencia: number): string {
  if (diferencia > 0) return `Sobró ${diferencia.toFixed(2)}`
  if (diferencia < 0) return `Faltó ${Math.abs(diferencia).toFixed(2)}`
  return 'Sin diferencia'
}

/** Etiqueta de la diferencia de conteo físico de vasos vs. teórico. */
export function etiquetaDiferenciaVasos(diferencia: number): string {
  if (diferencia > 0) return `Sobrante de ${diferencia}`
  if (diferencia < 0) return `Faltante de ${Math.abs(diferencia)}`
  return 'Sin diferencia'
}
