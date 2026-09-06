import { supabase } from '../lib/supabaseClient'
import type {
  ActualizarCategoriaGastoInput,
  CategoriaGasto,
  CrearCategoriaGastoInput,
} from '../types/categoriaGasto'

/**
 * Servicio de gestión del catálogo de categorías de gasto (BD-08.2, RF-05.2).
 *
 * Mismo patrón exacto de productosService/insumosService (BD-02.2/02.3):
 * CRUD directo bajo RLS, sin Edge Function — las políticas
 * `categorias_gasto_insert`/`_update` (fn_check_permission) ya cubren el rol
 * administrador. "Eliminar" una categoría es en realidad `activo=false`
 * (vía `actualizarCategoria`), nunca un DELETE físico: no existe política
 * DELETE para ningún rol (migración `20260905000003_categorias_gasto.sql`),
 * precisamente para no romper la integridad referencial de `gastos`
 * históricos ya vinculados por `categoria_id`.
 *
 * `creado_por` no lo resuelve el servidor (a diferencia de `registrar-venta`/
 * `crear-usuario`): al ser un INSERT directo de PostgREST sin Edge Function,
 * se recibe como parámetro ya resuelto desde `useSession` por la página
 * contenedora — mismo patrón que
 * `movimientosInventarioService.registrarInventarioInicial` (BD-02.3).
 */

interface CategoriaGastoRow {
  id: string
  nombre: string
  activo: boolean
  creado_por: string
  creado_en: string
}

function mapRow(row: CategoriaGastoRow): CategoriaGasto {
  return {
    id: row.id,
    nombre: row.nombre,
    activo: row.activo,
    creadoPor: row.creado_por,
    creadoEn: row.creado_en,
  }
}

const SELECT_COLUMNAS = 'id, nombre, activo, creado_por, creado_en'

export const categoriasGastoService = {
  async listarCategorias(): Promise<CategoriaGasto[]> {
    const { data, error } = await supabase
      .from('categorias_gasto')
      .select(SELECT_COLUMNAS)
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data as CategoriaGastoRow[]).map(mapRow)
  },

  async crearCategoria(
    input: CrearCategoriaGastoInput,
    creadoPor: string,
  ): Promise<CategoriaGasto> {
    const { data, error } = await supabase
      .from('categorias_gasto')
      .insert({ nombre: input.nombre, creado_por: creadoPor })
      .select(SELECT_COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as CategoriaGastoRow)
  },

  async actualizarCategoria(
    id: string,
    cambios: ActualizarCategoriaGastoInput,
  ): Promise<CategoriaGasto> {
    const payload: Partial<CategoriaGastoRow> = {}
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await supabase
      .from('categorias_gasto')
      .update(payload)
      .eq('id', id)
      .select(SELECT_COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as CategoriaGastoRow)
  },
}
