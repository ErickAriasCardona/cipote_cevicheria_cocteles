import type { RegistrarVentaPagoInput } from '../types/ventaPago'

/** Redondea a centavos enteros — misma técnica que la Edge Function
 * `registrar-venta`, para que la validación en vivo del Cajero (feedback de
 * UX) nunca diga "cuadra" por un error de redondeo que luego el backend sí
 * detecta (RN-006, fuente de verdad real es siempre el servidor). */
export function centavos(monto: number): number {
  return Math.round(monto * 100)
}

/** Replica en el cliente la revalidación RN-006 que hace `registrar-venta`
 * (comparación en centavos enteros). Usado tanto por `PagoMixtoForm` (feedback
 * visual) como por `VentaForm` (bloqueo del envío), sin duplicar la lógica. */
export function sonPagosValidos(total: number, pagos: RegistrarVentaPagoInput[]): boolean {
  if (pagos.length === 0) return false
  const sumaCentavos = pagos.reduce((acc, pago) => acc + centavos(pago.monto || 0), 0)
  return sumaCentavos === centavos(total)
}
