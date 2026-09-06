/**
 * Espejo tipado de la tabla `turnos_caja` (BD-03.1, RF-02.1/HU-02.1).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 3.
 */
export type EstadoTurnoCaja = 'abierto' | 'cerrado'

export interface TurnoCaja {
  id: string
  cajeroId: string
  fechaApertura: string
  dineroInicial: number
  estado: EstadoTurnoCaja
  createdAt: string
}

/** Payload para abrir un turno (HU-02.1). No incluye `cajeroId`: la política
 * RLS `turnos_caja_insert` exige que sea siempre `auth.uid()` (CA-02, "se
 * asocia automáticamente al usuario autenticado"), nunca un valor elegido en
 * el formulario. */
export interface AbrirCajaInput {
  dineroInicial: number
}
