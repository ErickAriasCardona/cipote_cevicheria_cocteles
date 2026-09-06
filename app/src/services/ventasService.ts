import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type {
  AccionSoftDeleteVenta,
  RegistrarVentaInput,
  RegistrarVentaResultado,
  Venta,
  VentaConEstadoEliminacion,
} from '../types/venta'
import type { TamanoVaso } from '../types/tamanoVaso'
import type { VentaPago } from '../types/ventaPago'

/**
 * Servicio del núcleo transaccional de ventas (BD-04, RF-03.2 a RF-03.6).
 *
 * `registrarVenta` es la única escritura de este servicio y, a diferencia de
 * `productosService`/`insumosService` (CRUD directo bajo RLS), invoca la Edge
 * Function `registrar-venta` (mismo patrón `supabase.functions.invoke` que
 * `usuariosService.crearUsuario`): `ventas`/`venta_pagos` no tienen ninguna
 * política INSERT bajo RLS para ningún rol de aplicación (🚫 total, ver
 * migración `20260904000009_ventas_venta_pagos.sql`) — toda la validación
 * crítica (RN-006, RN-008, cálculo de insumos por receta) vive server-side.
 *
 * `listarTamanosVasoActivos` sí es lectura simple bajo RLS (política
 * `tamanos_vaso_select`, ya vigente desde BD-02.3): no requiere Edge Function.
 *
 * `listarVentasAdministrador` (BD-07.2) es otra lectura simple bajo RLS
 * (política `ventas_select`, Administrador ve todas) con `productos`/
 * `tamanos_vaso` embebidos para una tabla legible. `eliminarVenta`/
 * `restablecerVenta` (BD-07.1/07.2, RF-03.6) invocan la Edge Function
 * `eliminar-restablecer-venta`: `ventas` no tiene ninguna política UPDATE
 * bajo RLS para ningún rol (🚫 total, ni siquiera Administrador) — la
 * transición de soft-delete con su trazabilidad (RN-009) vive exclusivamente
 * ahí, server-side.
 */

interface TamanoVasoRow {
  id: string
  etiqueta: string
  tipo: 'vaso' | 'bebida'
  categoria?: 'ceviche' | 'granizado' | 'bebida'
  onzas: number | null
  mililitros: number | null
  insumo_id: string | null
  activo: boolean
  created_at: string
}

function mapTamanoVaso(row: TamanoVasoRow): TamanoVaso {
  return {
    id: row.id,
    etiqueta: row.etiqueta,
    tipo: row.tipo,
    categoria: row.categoria,
    onzas: row.onzas,
    mililitros: row.mililitros,
    insumoId: row.insumo_id,
    activo: row.activo,
    createdAt: row.created_at,
  }
}

interface VentaRow {
  id: string
  turno_id: string
  cajero_id: string
  producto_id: string
  tamano_vaso_id: string | null
  cantidad: number
  precio_unitario: number
  total: number
  tipo_entrega: 'para_llevar' | 'consumo_lugar'
  observaciones: string | null
  created_at: string
}

function mapVenta(row: VentaRow): Venta {
  return {
    id: row.id,
    turnoId: row.turno_id,
    cajeroId: row.cajero_id,
    productoId: row.producto_id,
    tamanoVasoId: row.tamano_vaso_id,
    cantidad: row.cantidad,
    precioUnitario: row.precio_unitario,
    total: row.total,
    tipoEntrega: row.tipo_entrega,
    observaciones: row.observaciones,
    createdAt: row.created_at,
  }
}

interface VentaPagoRow {
  id: string
  venta_id: string
  metodo_pago: VentaPago['metodoPago']
  monto: number
  estado_transferencia: VentaPago['estadoTransferencia']
  created_at: string
  updated_at: string
}

function mapVentaPago(row: VentaPagoRow): VentaPago {
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

export const ventasService = {
  /** Tamaños de vaso activos, para el selector del POS (RF-03.2). */
  async listarTamanosVasoActivos(): Promise<TamanoVaso[]> {
    const { data, error } = await supabase
      .from('tamanos_vaso')
      .select('id, etiqueta, tipo, categoria, onzas, mililitros, insumo_id, activo, created_at')
      .eq('activo', true)
      .order('id', { ascending: true })
    if (error) throw error
    return (data as TamanoVasoRow[]).map(mapTamanoVaso)
  },

  /** Registra una venta (RF-03.2/03.3/03.4/04.3) vía la Edge Function
   * `registrar-venta`. `supabase-js` envuelve cualquier respuesta no-2xx en
   * un `FunctionsHttpError` genérico ("Edge Function returned a non-2xx
   * status code"); el mensaje real (422 validación/RN-006, 409 sin turno
   * propio abierto o stock insuficiente RN-008) viaja en el cuerpo JSON de
   * `error.context` (la Response cruda) — se extrae aquí para que la UI
   * muestre siempre el mensaje real devuelto por el servidor, nunca el
   * genérico de la librería. */
  async registrarVenta(input: RegistrarVentaInput): Promise<RegistrarVentaResultado> {
    const { data, error } = await supabase.functions.invoke('registrar-venta', {
      body: {
        producto_id: input.productoId,
        tamano_vaso_id: input.tamanoVasoId ?? null,
        cantidad: input.cantidad,
        tipo_entrega: input.tipoEntrega,
        observaciones: input.observaciones ?? null,
        pagos: input.pagos.map((pago) => ({
          metodo_pago: pago.metodoPago,
          monto: pago.monto,
        })),
      },
    })
    if (error) {
      if (error instanceof FunctionsHttpError) {
        let mensaje = 'No se pudo registrar la venta.'
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
    return {
      venta: mapVenta(data.venta as VentaRow),
      pagos: (data.pagos as VentaPagoRow[]).map(mapVentaPago),
    }
  },

  /** Listado administrativo de ventas con su estado de soft-delete y
   * trazabilidad (BD-07.2, RF-03.6). Lectura directa bajo RLS (política
   * `ventas_select`, S✅ global para Administrador): incluye ventas
   * eliminadas a propósito, para poder restablecerlas. `productos(nombre)`/
   * `tamanos_vaso(etiqueta)` embebidos para no requerir consultas extra. */
  async listarVentasAdministrador(): Promise<VentaConEstadoEliminacion[]> {
    const { data, error } = await supabase
      .from('ventas')
      .select(
        'id, turno_id, cajero_id, producto_id, tamano_vaso_id, cantidad, precio_unitario, total, ' +
          'tipo_entrega, observaciones, created_at, eliminado, eliminado_por, eliminado_en, ' +
          'restablecido_por, restablecido_en, productos(nombre), tamanos_vaso(etiqueta)',
      )
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as unknown as VentaAdministradorRow[]).map(mapVentaAdministrador)
  },

  /** Elimina (soft-delete) una venta vía la Edge Function
   * `eliminar-restablecer-venta` (HU-03.6 CA-01, exclusivo del Administrador).
   * No devuelve la fila actualizada: la página contenedora vuelve a llamar
   * `listarVentasAdministrador` tras la acción (mismo patrón ya usado en
   * `TransferenciasPage`/`transferenciasService`), que sí trae `productos`/
   * `tamanos_vaso` embebidos para la tabla. */
  async eliminarVenta(ventaId: string): Promise<void> {
    await invocarEliminarRestablecer(ventaId, 'eliminar')
  },

  /** Restablece una venta previamente eliminada (HU-03.6 CA-02). */
  async restablecerVenta(ventaId: string): Promise<void> {
    await invocarEliminarRestablecer(ventaId, 'restablecer')
  },
}

interface VentaAdministradorRow extends VentaRow {
  eliminado: boolean
  eliminado_por: string | null
  eliminado_en: string | null
  restablecido_por: string | null
  restablecido_en: string | null
  // supabase-js puede embeber una relación 1:1 como objeto o como arreglo de
  // un elemento según la versión de PostgREST — se normaliza en mapVentaAdministrador
  // (mismo caso ya resuelto en actualizar-estado-transferencia/index.ts).
  productos: { nombre: string } | { nombre: string }[] | null
  tamanos_vaso: { etiqueta: string } | { etiqueta: string }[] | null
}

function primeroSiEsArreglo<T>(valor: T | T[] | null): T | null {
  if (!valor) return null
  return Array.isArray(valor) ? (valor[0] ?? null) : valor
}

function mapVentaAdministrador(row: VentaAdministradorRow): VentaConEstadoEliminacion {
  const producto = primeroSiEsArreglo(row.productos)
  const tamano = primeroSiEsArreglo(row.tamanos_vaso)
  return {
    ...mapVenta(row),
    eliminado: row.eliminado,
    eliminadoPor: row.eliminado_por,
    eliminadoEn: row.eliminado_en,
    restablecidoPor: row.restablecido_por,
    restablecidoEn: row.restablecido_en,
    productoNombre: producto?.nombre ?? '—',
    tamanoVasoEtiqueta: tamano?.etiqueta ?? '—',
  }
}

/** `supabase-js` envuelve cualquier respuesta no-2xx de una Edge Function en
 * un `FunctionsHttpError` genérico; el mensaje real viaja en el cuerpo JSON
 * de `error.context` (mismo patrón ya usado arriba en `registrarVenta`). */
async function invocarEliminarRestablecer(
  ventaId: string,
  accion: AccionSoftDeleteVenta,
): Promise<void> {
  const { error } = await supabase.functions.invoke('eliminar-restablecer-venta', {
    body: { venta_id: ventaId, accion },
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      let mensaje =
        accion === 'eliminar' ? 'No se pudo eliminar la venta.' : 'No se pudo restablecer la venta.'
      try {
        const cuerpo = await error.context.json()
        if (typeof cuerpo?.error === 'string') mensaje = cuerpo.error
      } catch {
        // Cuerpo no-JSON o ilegible: se conserva el mensaje por defecto.
      }
      throw new Error(mensaje)
    }
    throw error
  }
}
