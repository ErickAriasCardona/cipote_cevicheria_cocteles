/**
 * Espejo tipado de las tablas `cierres_caja` y `conteo_vasos_cierre`
 * (BD-06.1, RF-02.2/02.3/04.4). Ver
 * DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md secciones 4 y 12.
 *
 * Ambas tablas se escriben exclusivamente vía la Edge Function `cerrar-caja`
 * (BD-06.2); no existe ningún flujo de edición desde el frontend (RN-004:
 * un cierre guardado es inmutable para todos los roles).
 */
export interface CierreCaja {
  id: string
  turnoId: string
  dineroContado: number
  observaciones: string | null
  totalEfectivo: number
  totalTarjeta: number
  totalNequi: number
  totalRappi: number
  totalTransferenciaExitosa: number
  totalGastosCaja: number
  totalEsperado: number
  /** dineroContado - totalEsperado. Positivo=sobró, negativo=faltó, 0=sin diferencia. */
  diferencia: number
  cerradoPor: string
  fechaCierre: string
}

export interface ConteoVasoCierre {
  id: string
  turnoId: string
  tamanoVasoId: string
  cantidadTeorica: number
  cantidadFisica: number
  /** cantidadFisica - cantidadTeorica. Positivo=sobrante, negativo=faltante, 0=sin diferencia. */
  diferencia: number
  createdAt: string
}

/** Conteo físico de un tamaño de vaso capturado por el Cajero al cerrar
 * (HU-04.4). `cantidadTeorica`/`diferencia` los calcula exclusivamente la
 * Edge Function `cerrar-caja` — el cliente nunca los envía ni los conoce
 * antes de guardar (RN-003). */
export interface ConteoVasoCierreInput {
  tamanoVasoId: string
  cantidadFisica: number
}

/** Payload para cerrar caja (HU-02.2/HU-04.4) vía la Edge Function
 * `cerrar-caja`. No incluye `turnoId`/`cerradoPor`: ambos se resuelven
 * server-side desde `auth.uid()` y el turno abierto propio (mismo criterio
 * que `RegistrarVentaInput`). Deliberadamente NO incluye dinero esperado,
 * ganancia ni diferencias — el Cajero no los conoce antes de guardar (RN-003). */
export interface CerrarCajaInput {
  dineroContado: number
  observaciones?: string
  conteoVasos: ConteoVasoCierreInput[]
}

export interface CerrarCajaResultado {
  cierre: CierreCaja
  conteoVasos: ConteoVasoCierre[]
}
