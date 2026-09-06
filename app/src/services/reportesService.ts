import { supabase } from '../lib/supabaseClient'
import type { VentaReporte } from '../types/reporteVentas'

/**
 * Servicio de lectura agregada para reportes de ventas (BD-09.1, RF-06.1).
 *
 * Consulta de solo lectura directa bajo RLS (política `ventas_select`,
 * S✅ global para Administrador — misma política ya usada en
 * `ventasService.listarVentasAdministrador`, BD-07.2). Sin tabla nueva ni
 * Edge Function: decisión ya tomada por Prometeo/Poseidon (ver tarjeta
 * Kanban BD-09 y MODELO_DATOS_MVP_1.0_2026-08-30.md, este bloque no agrega
 * entidades). La agregación por día/semana/mes ocurre en el cliente
 * (`utils/agregarVentasPorPeriodo.ts`) sobre el conjunto ya filtrado por
 * rango de fecha — el volumen de datos del MVP (una sola sede) no justifica
 * una función de agregación en BD todavía.
 *
 * Excluye ventas con `eliminado=true` (mismo criterio de RN-010 ya aplicado
 * por la Edge Function `cerrar-caja`, BD-06.2): un reporte de ventas no debe
 * contar ventas que el Administrador ya invalidó vía soft-delete (BD-07).
 */
interface VentaReporteRow {
  id: string
  total: number
  created_at: string
}

export const reportesService = {
  /** Ventas no eliminadas dentro de `[desde, hasta)` (ambos timestamps ISO,
   * límite superior exclusivo — la página contenedora resuelve el rango de
   * fecha del selector a este formato). */
  async listarVentasEnRango(desde: string, hasta: string): Promise<VentaReporte[]> {
    const { data, error } = await supabase
      .from('ventas')
      .select('id, total, created_at')
      .eq('eliminado', false)
      .gte('created_at', desde)
      .lt('created_at', hasta)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data as VentaReporteRow[]).map((row) => ({
      id: row.id,
      total: row.total,
      createdAt: row.created_at,
    }))
  },
}
