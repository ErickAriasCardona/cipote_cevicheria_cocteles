import { supabase } from '../lib/supabaseClient'
import type { CrearGastoInput, Gasto } from '../types/gasto'

/**
 * Servicio de registro de gastos (BD-08.3, RF-05.1).
 *
 * Mismo patrón directo bajo RLS que categoriasGastoService/productosService:
 * las políticas `gastos_select`/`_insert` (fn_check_permission) ya cubren el
 * rol administrador, sin Edge Function (arquitectura sección 6.7 de
 * Prometeo: CRUD simple sin validación cruzada). `registradoPor` se recibe
 * como parámetro ya resuelto desde `useSession` por la página contenedora,
 * mismo motivo y mismo patrón que `categoriasGastoService.crearCategoria`.
 *
 * No expone eliminarGasto ni actualizarGasto: la Matriz de Desarrollo acota
 * BD-08.3 a "registro" (alta) de gastos; la política UPDATE ya existe en BD
 * (permite corregir un gasto mal digitado, ver diccionario de datos sección
 * 13) para cuando un bloque futuro necesite esa UI — no se construye una UI
 * de edición no solicitada (evita alcance no aprobado).
 */

interface GastoRow {
  id: string
  categoria_id: string
  descripcion: string
  monto: number
  fecha: string
  registrado_por: string
  created_at: string
  updated_at: string
  // supabase-js puede embeber una relación 1:1 como objeto o como arreglo de
  // un elemento según la versión de PostgREST — mismo caso ya resuelto en
  // ventasService.ts / eliminar-restablecer-venta/index.ts.
  categorias_gasto: { nombre: string } | { nombre: string }[] | null
}

function primeroSiEsArreglo<T>(valor: T | T[] | null): T | null {
  if (!valor) return null
  return Array.isArray(valor) ? (valor[0] ?? null) : valor
}

function mapRow(row: GastoRow): Gasto {
  const categoria = primeroSiEsArreglo(row.categorias_gasto)
  return {
    id: row.id,
    categoriaId: row.categoria_id,
    descripcion: row.descripcion,
    monto: row.monto,
    fecha: row.fecha,
    registradoPor: row.registrado_por,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoriaNombre: categoria?.nombre ?? '—',
  }
}

const SELECT_COLUMNAS =
  'id, categoria_id, descripcion, monto, fecha, registrado_por, created_at, updated_at, categorias_gasto(nombre)'

export const gastosService = {
  async listarGastos(): Promise<Gasto[]> {
    const { data, error } = await supabase
      .from('gastos')
      .select(SELECT_COLUMNAS)
      .order('fecha', { ascending: false })
    if (error) throw error
    return (data as unknown as GastoRow[]).map(mapRow)
  },

  async crearGasto(input: CrearGastoInput, registradoPor: string): Promise<Gasto> {
    const { data, error } = await supabase
      .from('gastos')
      .insert({
        categoria_id: input.categoriaId,
        descripcion: input.descripcion,
        monto: input.monto,
        fecha: input.fecha,
        registrado_por: registradoPor,
      })
      .select(SELECT_COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as unknown as GastoRow)
  },
}
