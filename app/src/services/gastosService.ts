import { supabase } from '../lib/supabaseClient'
import type { ActualizarGastoInput, CrearGastoInput, EstadoPagoGasto, Gasto, GastoHistorialEdicion, OrigenGasto } from '../types/gasto'

interface GastoRow {
  id: string
  categoria_id: string
  descripcion: string
  monto: number
  fecha: string
  registrado_por: string
  origen: OrigenGasto
  estado_pago: EstadoPagoGasto
  turno_id: string | null
  created_at: string
  updated_at: string
  categorias_gasto: { nombre: string } | { nombre: string }[] | null
}

interface GastoHistorialRow {
  id: string
  gasto_id: string
  monto_anterior: number
  monto_nuevo: number
  descripcion_anterior: string
  descripcion_nueva: string
  categoria_id_anterior: string
  categoria_id_nueva: string
  modificado_por: string
  motivo_edicion: string | null
  estado_pago_anterior?: string | null
  estado_pago_nuevo?: string | null
  origen_anterior?: string | null
  origen_nuevo?: string | null
  created_at: string
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
    monto: Number(row.monto),
    fecha: row.fecha,
    registradoPor: row.registrado_por,
    origen: row.origen ?? 'caja',
    estadoPago: row.estado_pago ?? 'pagado',
    turnoId: row.turno_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoriaNombre: categoria?.nombre ?? '—',
  }
}

function mapHistorialRow(row: GastoHistorialRow): GastoHistorialEdicion {
  return {
    id: row.id,
    gastoId: row.gasto_id,
    montoAnterior: Number(row.monto_anterior),
    montoNuevo: Number(row.monto_nuevo),
    descripcionAnterior: row.descripcion_anterior,
    descripcionNueva: row.descripcion_nueva,
    categoriaIdAnterior: row.categoria_id_anterior,
    categoriaIdNueva: row.categoria_id_nueva,
    modificadoPor: row.modificado_por,
    motivoEdicion: row.motivo_edicion,
    estadoPagoAnterior: row.estado_pago_anterior,
    estadoPagoNuevo: row.estado_pago_nuevo,
    origenAnterior: row.origen_anterior,
    origenNuevo: row.origen_nuevo,
    createdAt: row.created_at,
  }
}

const SELECT_COLUMNAS =
  'id, categoria_id, descripcion, monto, fecha, registrado_por, origen, estado_pago, turno_id, created_at, updated_at, categorias_gasto(nombre)'

export interface FiltrosGastos {
  fechaInicio?: string
  fechaFin?: string
  origen?: 'todos' | OrigenGasto
  estadoPago?: 'todos' | EstadoPagoGasto
  categoriaId?: string
}

export const gastosService = {
  async listarGastos(filtros?: FiltrosGastos): Promise<Gasto[]> {
    let query = supabase
      .from('gastos')
      .select(SELECT_COLUMNAS)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })

    if (filtros?.fechaInicio) {
      query = query.gte('fecha', filtros.fechaInicio)
    }
    if (filtros?.fechaFin) {
      query = query.lte('fecha', filtros.fechaFin)
    }
    if (filtros?.origen && filtros.origen !== 'todos') {
      query = query.eq('origen', filtros.origen)
    }
    if (filtros?.estadoPago && filtros.estadoPago !== 'todos') {
      query = query.eq('estado_pago', filtros.estadoPago)
    }
    if (filtros?.categoriaId) {
      query = query.eq('categoria_id', filtros.categoriaId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as unknown as GastoRow[]).map(mapRow)
  },

  async listarGastosTurno(turnoId: string): Promise<Gasto[]> {
    const { data, error } = await supabase
      .from('gastos')
      .select(SELECT_COLUMNAS)
      .eq('turno_id', turnoId)
      .eq('origen', 'caja')
      .order('created_at', { ascending: false })
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
        origen: input.origen ?? 'caja',
        estado_pago: input.estadoPago ?? 'pagado',
        turno_id: input.turnoId ?? null,
      })
      .select(SELECT_COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as unknown as GastoRow)
  },

  async actualizarGasto(id: string, input: ActualizarGastoInput): Promise<Gasto> {
    const payload: Record<string, unknown> = {}
    if (input.categoriaId !== undefined) payload.categoria_id = input.categoriaId
    if (input.descripcion !== undefined) payload.descripcion = input.descripcion
    if (input.monto !== undefined) payload.monto = input.monto
    if (input.origen !== undefined) payload.origen = input.origen
    if (input.estadoPago !== undefined) payload.estado_pago = input.estadoPago

    const { data, error } = await supabase
      .from('gastos')
      .update(payload)
      .eq('id', id)
      .select(SELECT_COLUMNAS)
      .single()
    if (error) throw error
    return mapRow(data as unknown as GastoRow)
  },

  async obtenerHistorialGasto(gastoId: string): Promise<GastoHistorialEdicion[]> {
    const { data, error } = await supabase
      .from('gastos_historial_ediciones')
      .select('*')
      .eq('gasto_id', gastoId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as unknown as GastoHistorialRow[]).map(mapHistorialRow)
  },
}
