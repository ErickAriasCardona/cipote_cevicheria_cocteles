import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { EstadoTransferencia, VentaPago } from '../types/ventaPago'
import type { TipoEntrega } from '../types/venta'

/**
 * Servicio de estado de transferencias/QR (BD-05, RF-03.5/HU-03.5).
 *
 * `listarTransferenciasTurno` es lectura simple bajo RLS (política
 * `venta_pagos_select`, ya vigente desde BD-04.1: un Cajero solo ve los pagos
 * de sus propias ventas) — mismo patrón que
 * `ventasService.listarTamanosVasoActivos`, sin Edge Function.
 *
 * `actualizarEstadoTransferencia` sí invoca la Edge Function
 * `actualizar-estado-transferencia` (mismo patrón `supabase.functions.invoke`
 * + extracción de mensaje de error ya usado en `ventasService.registrarVenta`):
 * `venta_pagos` no tiene ninguna política UPDATE bajo RLS para ningún rol
 * (bloqueo total, ver migración `20260904000009_ventas_venta_pagos.sql`) — la
 * validación de propiedad (solo transferencias de las propias ventas del
 * Cajero) y de rol (CA-04) vive server-side.
 */

/** Resumen mínimo de la venta asociada, solo lo necesario para dar contexto
 * en el listado de transferencias (no se amplía `Venta`/`VentaPago` en
 * `types/` para esto — ver plan BD-05, "Sin cambios en types/ventaPago.ts"). */
export interface VentaResumen {
  id: string
  cantidad: number
  total: number
  tipoEntrega: TipoEntrega
  createdAt: string
}

export interface TransferenciaTurno {
  pago: VentaPago
  venta: VentaResumen
}

interface VentaPagoConVentaRow {
  id: string
  venta_id: string
  metodo_pago: VentaPago['metodoPago']
  monto: number
  estado_transferencia: EstadoTransferencia | null
  created_at: string
  updated_at: string
  ventas: {
    id: string
    cantidad: number
    total: number
    tipo_entrega: TipoEntrega
    created_at: string
  } | null
}

function mapTransferencia(row: VentaPagoConVentaRow): TransferenciaTurno {
  const venta = row.ventas
  if (!venta) {
    // No debería ocurrir (FK not-null + join !inner), pero se evita un
    // acceso a `null` en vez de fallar en silencio con datos incompletos.
    throw new Error('La transferencia no tiene una venta asociada.')
  }
  return {
    pago: {
      id: row.id,
      ventaId: row.venta_id,
      metodoPago: row.metodo_pago,
      monto: row.monto,
      estadoTransferencia: row.estado_transferencia,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    venta: {
      id: venta.id,
      cantidad: venta.cantidad,
      total: venta.total,
      tipoEntrega: venta.tipo_entrega,
      createdAt: venta.created_at,
    },
  }
}

interface VentaPagoActualizadoRow {
  id: string
  venta_id: string
  metodo_pago: VentaPago['metodoPago']
  monto: number
  estado_transferencia: EstadoTransferencia | null
  created_at: string
  updated_at: string
}

function mapVentaPago(row: VentaPagoActualizadoRow): VentaPago {
  return {
    id: row.id,
    ventaId: row.venta_id,
    metodoPago: row.metodo_pago,
    monto: row.monto,
    estadoTransferencia: row.estado_transferencia,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const transferenciasService = {
  /** Transferencias/QR del turno indicado (RF-03.5/BD-05.2). La RLS ya
   * garantiza que un Cajero solo verá las de sus propias ventas; filtra
   * además por `metodo_pago='transferencia_qr'` y `ventas.turno_id`. */
  async listarTransferenciasTurno(turnoId: string): Promise<TransferenciaTurno[]> {
    const { data, error } = await supabase
      .from('venta_pagos')
      .select(
        'id, venta_id, metodo_pago, monto, estado_transferencia, created_at, updated_at, ventas!inner(id, cantidad, total, tipo_entrega, created_at, turno_id)',
      )
      .eq('metodo_pago', 'transferencia_qr')
      .eq('ventas.turno_id', turnoId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as unknown as VentaPagoConVentaRow[]).map(mapTransferencia)
  },

  /** Cambia el estado de una transferencia (HU-03.5 CA-01/CA-02) vía la Edge
   * Function `actualizar-estado-transferencia`. Mismo manejo de error que
   * `ventasService.registrarVenta`: el mensaje real (403 rol/propiedad, 404
   * no existe, 409 no es transferencia/QR, 422 payload inválido) viaja en
   * `error.context` de `FunctionsHttpError`, nunca el genérico de la librería. */
  async actualizarEstadoTransferencia(
    pagoId: string,
    nuevoEstado: EstadoTransferencia,
  ): Promise<VentaPago> {
    const { data, error } = await supabase.functions.invoke('actualizar-estado-transferencia', {
      body: { pago_id: pagoId, nuevo_estado: nuevoEstado },
    })
    if (error) {
      if (error instanceof FunctionsHttpError) {
        let mensaje = 'No se pudo actualizar el estado de la transferencia.'
        try {
          const cuerpo = await error.context.json()
          if (typeof cuerpo?.error === 'string') mensaje = cuerpo.error
        } catch {
          // Cuerpo no-JSON o ilegible: se conserva el mensaje genérico.
        }
        throw new Error(mensaje)
      }
      throw error
    }
    return mapVentaPago(data.pago as VentaPagoActualizadoRow)
  },
}
