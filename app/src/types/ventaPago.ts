/**
 * Espejo tipado de la tabla `venta_pagos` (BD-04.1, RF-03.3/03.4/03.5).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 10.
 */
export type MetodoPago = 'efectivo' | 'nequi' | 'transferencia_qr' | 'credito_rappi' | 'tarjeta'

export type EstadoTransferencia = 'pendiente' | 'exitosa' | 'rechazada_cancelada'

export interface VentaPago {
  id: string
  ventaId: string
  metodoPago: MetodoPago
  monto: number
  /** Solo no-nulo cuando metodoPago === 'transferencia_qr' (CHECK cruzado). */
  estadoTransferencia: EstadoTransferencia | null
  createdAt: string
  updatedAt: string
}

/** Un renglón de pago dentro del payload de `registrar-venta` (pago mixto,
 * RF-03.4). `estadoTransferencia` nunca se envía desde el cliente: la Edge
 * Function lo fija en 'pendiente' automáticamente cuando corresponde. */
export interface RegistrarVentaPagoInput {
  metodoPago: MetodoPago
  monto: number
  /** Efectivo entregado por el cliente para calcular devuelta (solo cliente web). */
  pagaCon?: number
  /** Sub-método descriptivo para transferencias (Nequi, Bre-B, Datáfono, Transferencia Bancaria) */
  subMetodo?: string
}
