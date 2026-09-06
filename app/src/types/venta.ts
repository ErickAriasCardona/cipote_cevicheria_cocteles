import type { RegistrarVentaPagoInput, VentaPago } from './ventaPago'

/**
 * Espejo tipado de la tabla `ventas` (BD-04.1, RF-03.2/03.6).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 9.
 *
 * Deliberadamente sin las 5 columnas de soft-delete aquí: el POS del Cajero
 * (`registrar-venta`/`ventasService.registrarVenta`) nunca las necesita. El
 * listado administrativo de BD-07 (RF-03.6) usa `VentaConEstadoEliminacion`
 * (abajo), que extiende este tipo sin romper el uso actual.
 */
export type TipoEntrega = 'para_llevar' | 'consumo_lugar'

export interface Venta {
  id: string
  turnoId: string
  cajeroId: string
  productoId: string
  tamanoVasoId: string | null
  cantidad: number
  precioUnitario: number
  total: number
  tipoEntrega: TipoEntrega
  observaciones: string | null
  createdAt: string
}

/** Payload para registrar una venta (HU-03.2/03.3/03.4) vía la Edge Function
 * `registrar-venta`. No incluye `cajeroId`/`turnoId`: ambos se resuelven
 * server-side desde `auth.uid()` y el turno abierto propio, nunca elegidos
 * por el Cajero ni confiados del cliente (mismo criterio que `AbrirCajaInput`). */
export interface RegistrarVentaInput {
  productoId: string
  tamanoVasoId?: string | null
  cantidad: number
  tipoEntrega: TipoEntrega
  observaciones?: string
  pagos: RegistrarVentaPagoInput[]
}

export interface RegistrarVentaResultado {
  venta: Venta
  pagos: VentaPago[]
}

/** Venta con las 5 columnas de auditoría de soft-delete (RF-03.6/HU-03.6,
 * RN-009, BD-07). Expuesta únicamente en el listado administrativo de
 * ventas (`ventasService.listarVentasAdministrador`) — el POS del Cajero no
 * la usa. `eliminadoPor`/`restablecidoPor` siempre se resuelven server-side
 * desde `auth.uid()` dentro de la Edge Function `eliminar-restablecer-venta`,
 * nunca desde un valor enviado por el cliente. */
export interface VentaConEstadoEliminacion extends Venta {
  eliminado: boolean
  eliminadoPor: string | null
  eliminadoEn: string | null
  restablecidoPor: string | null
  restablecidoEn: string | null
  /** Nombre del producto y etiqueta del tamaño, embebidos por el join de
   * `listarVentasAdministrador` para una tabla legible sin consultas extra. */
  productoNombre: string
  tamanoVasoEtiqueta: string
}

/** Acción de soft-delete (HU-03.6 CA-01/CA-02) vía la Edge Function
 * `eliminar-restablecer-venta`. */
export type AccionSoftDeleteVenta = 'eliminar' | 'restablecer'
