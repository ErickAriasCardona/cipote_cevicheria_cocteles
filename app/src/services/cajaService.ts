import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { AbrirCajaInput, TurnoCaja } from '../types/turnoCaja'
import type {
  CerrarCajaInput,
  CerrarCajaResultado,
  CierreCaja,
  ConteoVasoCierre,
} from '../types/cierreCaja'

/**
 * Servicio de ciclo de turno de caja: apertura (BD-03.2, RF-02.1/HU-02.1) y
 * cierre (BD-06.2/06.3, RF-02.2/02.3/04.4).
 *
 * `obtenerTurnoAbierto`/`abrirCaja` son INSERT/SELECT directos bajo RLS, sin
 * Edge Function (mismo patrón ya usado para `productosService`/
 * `insumosService`, BD-02): la política `turnos_caja_insert` (migración
 * `20260904000008_turnos_caja.sql`) ya exige `cajero_id = auth.uid()` en el
 * `WITH CHECK`, así que `cajeroId` se resuelve aquí mismo desde la sesión
 * activa, nunca se deja elegir. El índice único parcial
 * `ux_turnos_caja_abierto` es quien impide realmente una segunda apertura
 * simultánea (HU-02.1 CA-04) — si ya hay un turno abierto, Postgres rechaza
 * el INSERT con SQLSTATE 23505, que se propaga tal cual como error.
 *
 * `cerrarCaja` invoca la Edge Function `cerrar-caja` (BD-06.2): `cierres_caja`
 * y `conteo_vasos_cierre` no tienen ninguna política INSERT bajo RLS (🚫
 * total, ver migración `20260905000002_cierres_caja_conteo_vasos.sql`) — todo
 * el cálculo del esperado/diferencia vive server-side (RN-003, el Cajero
 * nunca lo ve antes de guardar). `listarCierres`/`listarConteoVasosCierre` sí
 * son lecturas simples bajo RLS (política `cierres_caja_select`/
 * `conteo_vasos_cierre_select`, ya vigentes desde BD-06.1).
 */

interface TurnoCajaRow {
  id: string
  cajero_id: string
  fecha_apertura: string
  dinero_inicial: number
  estado: 'abierto' | 'cerrado'
  created_at: string
}

function mapRow(row: TurnoCajaRow): TurnoCaja {
  return {
    id: row.id,
    cajeroId: row.cajero_id,
    fechaApertura: row.fecha_apertura,
    dineroInicial: row.dinero_inicial,
    estado: row.estado,
    createdAt: row.created_at,
  }
}

const SELECT_TURNO = 'id, cajero_id, fecha_apertura, dinero_inicial, estado, created_at'

interface CierreCajaRow {
  id: string
  turno_id: string
  dinero_contado: number
  observaciones: string | null
  total_efectivo: number
  total_tarjeta: number
  total_nequi: number
  total_rappi: number
  total_transferencia_exitosa: number
  total_esperado: number
  diferencia: number
  cerrado_por: string
  fecha_cierre: string
}

function mapCierre(row: CierreCajaRow): CierreCaja {
  return {
    id: row.id,
    turnoId: row.turno_id,
    dineroContado: row.dinero_contado,
    observaciones: row.observaciones,
    totalEfectivo: row.total_efectivo,
    totalTarjeta: row.total_tarjeta,
    totalNequi: row.total_nequi,
    totalRappi: row.total_rappi,
    totalTransferenciaExitosa: row.total_transferencia_exitosa,
    totalEsperado: row.total_esperado,
    diferencia: row.diferencia,
    cerradoPor: row.cerrado_por,
    fechaCierre: row.fecha_cierre,
  }
}

interface ConteoVasoCierreRow {
  id: string
  turno_id: string
  tamano_vaso_id: string
  cantidad_teorica: number
  cantidad_fisica: number
  diferencia: number
  created_at: string
}

function mapConteoVaso(row: ConteoVasoCierreRow): ConteoVasoCierre {
  return {
    id: row.id,
    turnoId: row.turno_id,
    tamanoVasoId: row.tamano_vaso_id,
    cantidadTeorica: row.cantidad_teorica,
    cantidadFisica: row.cantidad_fisica,
    diferencia: row.diferencia,
    createdAt: row.created_at,
  }
}

// Literal único (sin concatenación con `+`): TypeScript solo preserva el
// tipo string-literal de un `const` cuando no pasa por el operador `+`
// (que siempre widening a `string`), y supabase-js necesita ese literal para
// inferir el tipo de fila de `.select(...)` — mismo detalle ya respetado en
// el resto de servicios (`SELECT_TURNO`, `SELECT_MOVIMIENTO`, etc.).
const SELECT_CIERRE =
  'id, turno_id, dinero_contado, observaciones, total_efectivo, total_tarjeta, total_nequi, total_rappi, total_transferencia_exitosa, total_esperado, diferencia, cerrado_por, fecha_cierre'

const SELECT_CONTEO_VASO =
  'id, turno_id, tamano_vaso_id, cantidad_teorica, cantidad_fisica, diferencia, created_at'

/** `supabase-js` envuelve cualquier respuesta no-2xx de una Edge Function en
 * un `FunctionsHttpError` genérico; el mensaje real viaja en el cuerpo JSON
 * de `error.context` (mismo patrón ya usado en `ventasService.registrarVenta`). */
async function extraerMensajeError(error: unknown, mensajePorDefecto: string): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    let mensaje = mensajePorDefecto
    try {
      const cuerpo = await error.context.json()
      if (typeof cuerpo?.error === 'string') mensaje = cuerpo.error
    } catch {
      // Cuerpo no-JSON o ilegible: se conserva el mensaje por defecto.
    }
    return new Error(mensaje)
  }
  return error instanceof Error ? error : new Error(mensajePorDefecto)
}

export const cajaService = {
  /** Turno abierto visible para el usuario autenticado: el Administrador ve
   * el único turno abierto global (si existe, vía fn_check_permission);
   * el Cajero solo ve el suyo propio (política "propio registro"). Devuelve
   * `null` si no hay ningún turno abierto (o si el abierto no es el propio,
   * para un Cajero). */
  async obtenerTurnoAbierto(): Promise<TurnoCaja | null> {
    const { data, error } = await supabase
      .from('turnos_caja')
      .select(SELECT_TURNO)
      .eq('estado', 'abierto')
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data as TurnoCajaRow) : null
  },

  /** Abre un nuevo turno de caja (HU-02.1). `cajeroId` es el `auth.uid()` del
   * usuario autenticado (usuarios_perfil.id) — la política RLS lo revalida
   * de todas formas en el servidor, esto no es el único control. */
  async abrirCaja(cajeroId: string, input: AbrirCajaInput): Promise<TurnoCaja> {
    const { data, error } = await supabase
      .from('turnos_caja')
      .insert({
        cajero_id: cajeroId,
        dinero_inicial: input.dineroInicial,
      })
      .select(SELECT_TURNO)
      .single()
    if (error) throw error
    return mapRow(data as TurnoCajaRow)
  },

  /** Cierra caja (HU-02.2/HU-04.4) vía la Edge Function `cerrar-caja`.
   * Deliberadamente no expone ningún método de lectura de "dinero esperado"
   * antes de esta llamada (RN-003): el resultado solo existe una vez que la
   * función ya guardó el cierre en el servidor. */
  async cerrarCaja(input: CerrarCajaInput): Promise<CerrarCajaResultado> {
    const { data, error } = await supabase.functions.invoke('cerrar-caja', {
      body: {
        dinero_contado: input.dineroContado,
        observaciones: input.observaciones ?? null,
        conteo_vasos: input.conteoVasos.map((c) => ({
          tamano_vaso_id: c.tamanoVasoId,
          cantidad_fisica: c.cantidadFisica,
        })),
      },
    })
    if (error) {
      throw await extraerMensajeError(error, 'No se pudo cerrar la caja.')
    }
    return {
      cierre: mapCierre(data.cierre as CierreCajaRow),
      conteoVasos: (data.conteo_vasos as ConteoVasoCierreRow[]).map(mapConteoVaso),
    }
  },

  /** Listado de todos los cierres ya guardados (consulta de solo lectura,
   * CU-02.3 "Administrador consulta"; el Cajero solo ve los de su propio
   * turno vía la política RLS `cierres_caja_select`). */
  async listarCierres(): Promise<CierreCaja[]> {
    const { data, error } = await supabase
      .from('cierres_caja')
      .select(SELECT_CIERRE)
      .order('fecha_cierre', { ascending: false })
    if (error) throw error
    return (data as CierreCajaRow[]).map(mapCierre)
  },

  /** Detalle de conteo de vasos de un cierre puntual, para la consulta de
   * CU-04.4 ("Administrador consulta"). */
  async listarConteoVasosCierre(turnoId: string): Promise<ConteoVasoCierre[]> {
    const { data, error } = await supabase
      .from('conteo_vasos_cierre')
      .select(SELECT_CONTEO_VASO)
      .eq('turno_id', turnoId)
    if (error) throw error
    return (data as ConteoVasoCierreRow[]).map(mapConteoVaso)
  },
}
