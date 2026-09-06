// Edge Function: cerrar-caja (BD-06.2, RF-02.2/02.3/04.4, RN-003/RN-004/
// RN-007/RN-010/RNF-005)
//
// Único punto de escritura de `cierres_caja`/`conteo_vasos_cierre` y de
// `turnos_caja.estado='cerrado'` (ver PLAN_DESARROLLO_2026-09-05_BD-06-
// cierre-caja-control-vasos.md). Igual que `registrar-venta`, escribe 3 cosas
// relacionadas (INSERT cierres_caja, N×INSERT conteo_vasos_cierre, UPDATE
// turnos_caja) que deben ser atómicas — PostgREST/supabase-js no daría
// atomicidad real entre llamadas encadenadas ante un fallo a mitad de camino,
// así que se reutiliza exactamente el mismo mecanismo ya aprobado y probado
// en `registrar-venta`: conexión directa a Postgres vía `jsr:@db/postgres`,
// con una transacción real (BEGIN/COMMIT/ROLLBACK).
//
// RN-003 (el Cajero no ve dinero esperado/ganancia/diferencias antes de
// guardar): por eso todo el cálculo del esperado ocurre aquí, server-side, y
// solo se devuelve en la respuesta DESPUÉS del COMMIT — el cliente nunca
// envía ni puede leer ese dato antes de guardar (ver ARQUITECTURA_MVP_1.0_
// 2026-08-30.md sección 4, "Por qué el cálculo del esperado nunca se hace en
// el cliente").
//
// Identidad: `cerrado_por` se resuelve siempre desde `auth.uid()` (igual que
// `cajero_id` en `registrar-venta`), nunca del payload. El turno se resuelve
// como "el turno abierto que pertenece a quien llama" (mismo criterio ya
// usado en `registrar-venta`), y se verifica explícitamente que el rol sea
// Cajero (CU-02.2/HU-02.2 solo mencionan a ese actor; ningún RF/RN habilita
// al Administrador a cerrar caja).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { Client } from 'jsr:@db/postgres@0.19.5'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ConteoVasoPayload {
  tamanoVasoId: string
  cantidadFisica: number
}

interface CerrarCajaPayload {
  dineroContado: number
  observaciones: string | null
  conteoVasos: ConteoVasoPayload[]
}

interface TurnoRow {
  id: string
}
interface TamanoVasoActivoRow {
  id: string
  insumo_id: string
}
interface VentaPagoTurnoRow {
  metodo_pago: string
  monto: string
  estado_transferencia: string | null
}
interface TeoricoRow {
  insumo_id: string
  teorico: string | null
}
interface CierreCajaRow {
  id: string
  turno_id: string
  dinero_contado: string
  observaciones: string | null
  total_efectivo: string
  total_tarjeta: string
  total_nequi: string
  total_rappi: string
  total_transferencia_exitosa: string
  total_esperado: string
  diferencia: string
  cerrado_por: string
  fecha_cierre: Date
}
interface ConteoVasoCierreRow {
  id: string
  turno_id: string
  tamano_vaso_id: string
  cantidad_teorica: string
  cantidad_fisica: string
  diferencia: string
  created_at: Date
}

/** Error de negocio con código HTTP explícito (mismo patrón que las demás
 * Edge Functions del proyecto). */
class AppError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** Redondea a centavos enteros (mismo criterio de `registrar-venta` para
 * todo cálculo de dinero: evita arrastrar errores de punto flotante). */
function centavos(monto: number): number {
  return Math.round(monto * 100)
}

function numero(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor
  if (typeof valor === 'string' && valor.trim() !== '') {
    const parsed = Number(valor)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** `jsr:@db/postgres` devuelve columnas `numeric` como string. */
function num(valor: string | number | null): number {
  if (valor === null) return 0
  return typeof valor === 'number' ? valor : Number(valor)
}

function validarPayload(body: Record<string, unknown>): CerrarCajaPayload {
  const dineroContado = body.dinero_contado
  const observaciones = body.observaciones
  const conteoVasos = body.conteo_vasos

  const dineroContadoNumerico = numero(dineroContado)
  if (dineroContadoNumerico === null || dineroContadoNumerico < 0) {
    throw new AppError(422, 'dinero_contado debe ser un número mayor o igual a cero.')
  }
  if (observaciones !== undefined && observaciones !== null && typeof observaciones !== 'string') {
    throw new AppError(422, 'observaciones debe ser texto.')
  }
  if (!Array.isArray(conteoVasos) || conteoVasos.length === 0) {
    throw new AppError(422, 'Debes ingresar el conteo físico de al menos un tamaño de vaso.')
  }

  const conteoValidado: ConteoVasoPayload[] = conteoVasos.map((fila) => {
    if (typeof fila !== 'object' || fila === null) {
      throw new AppError(422, 'Cada conteo debe ser un objeto con tamano_vaso_id y cantidad_fisica.')
    }
    const { tamano_vaso_id, cantidad_fisica } = fila as Record<string, unknown>
    if (typeof tamano_vaso_id !== 'string' || tamano_vaso_id.trim() === '') {
      throw new AppError(422, 'tamano_vaso_id es obligatorio en cada conteo.')
    }
    const cantidadNumerica = numero(cantidad_fisica)
    if (cantidadNumerica === null || cantidadNumerica < 0) {
      throw new AppError(422, 'cantidad_fisica debe ser un número mayor o igual a cero.')
    }
    return { tamanoVasoId: tamano_vaso_id, cantidadFisica: cantidadNumerica }
  })

  return {
    dineroContado: dineroContadoNumerico,
    observaciones:
      typeof observaciones === 'string' && observaciones.trim() !== '' ? observaciones.trim() : null,
    conteoVasos: conteoValidado,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'No autenticado.' }, 401)
  }

  const supabaseCallerCtx = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
    error: callerError,
  } = await supabaseCallerCtx.auth.getUser()

  if (callerError || !caller) {
    return jsonResponse({ error: 'No autenticado.' }, 401)
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const { data: callerPerfil, error: callerPerfilError } = await supabaseAdmin
    .from('usuarios_perfil')
    .select('rol, activo')
    .eq('id', caller.id)
    .single()

  if (callerPerfilError || !callerPerfil || !callerPerfil.activo) {
    return jsonResponse({ error: 'No autorizado.' }, 403)
  }
  // CU-02.2/HU-02.2: exclusivo del Cajero, ningún RF/RN habilita al
  // Administrador a cerrar caja.
  if (callerPerfil.rol !== 'cajero') {
    return jsonResponse({ error: 'Solo el Cajero puede cerrar caja.' }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  let datos: CerrarCajaPayload
  try {
    datos = validarPayload(body)
  } catch (err) {
    if (err instanceof AppError) return jsonResponse({ error: err.message }, err.status)
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  const client = new Client(dbUrl)

  try {
    await client.connect()
    const transaction = client.createTransaction('cerrar_caja')
    await transaction.begin()

    try {
      // 1) Turno abierto propio (no el abierto global sin filtrar) — mismo
      // criterio que registrar-venta.
      const turnoResult = await transaction.queryObject<TurnoRow>(
        `select id from public.turnos_caja
         where estado = 'abierto' and cajero_id = $1
         for update`,
        [caller.id],
      )
      if (turnoResult.rows.length === 0) {
        throw new AppError(409, 'No tienes un turno de caja abierto para cerrar.')
      }
      const turnoId = turnoResult.rows[0].id

      // 2) El turno no debe tener ya un cierre (defensa explícita antes del
      // UNIQUE de BD, que sería la última línea de defensa real).
      const cierreExistenteResult = await transaction.queryObject<{ id: string }>(
        `select id from public.cierres_caja where turno_id = $1`,
        [turnoId],
      )
      if (cierreExistenteResult.rows.length > 0) {
        throw new AppError(409, 'Este turno ya tiene un cierre registrado.')
      }

      // 3) Tamaños de vaso físicos activos vigentes: HU-04.4 CA-03 exige el conteo de
      // TODOS los vasos físicos (tipo = 'vaso' con insumo asignado), ni más ni menos.
      // Se excluyen las presentaciones en ml de bebidas (tipo = 'bebida').
      const tamanosActivosResult = await transaction.queryObject<TamanoVasoActivoRow>(
        `select id, insumo_id from public.tamanos_vaso where activo = true and tipo = 'vaso' and insumo_id is not null`,
      )
      const tamanosActivos = tamanosActivosResult.rows
      const idsActivos = new Set(tamanosActivos.map((t) => t.id))
      const idsEnviados = new Set(datos.conteoVasos.map((c) => c.tamanoVasoId))

      if (idsActivos.size === 0) {
        throw new AppError(409, 'No hay tamaños de vaso activos configurados.')
      }
      for (const id of idsActivos) {
        if (!idsEnviados.has(id)) {
          throw new AppError(
            422,
            'Debes ingresar el conteo físico de todos los tamaños de vaso activos.',
          )
        }
      }
      for (const id of idsEnviados) {
        if (!idsActivos.has(id)) {
          throw new AppError(422, 'Uno de los tamaños de vaso enviados no existe o no está activo.')
        }
      }

      // 4) Cantidad teórica por insumo-vaso: suma con signo de
      // movimientos_inventario (positivo inventario_inicial, negativo venta)
      // — tal como especifica el diccionario de datos, no leyendo
      // insumos.stock_actual directamente.
      const insumoIds = tamanosActivos.map((t) => t.insumo_id)
      const placeholders = insumoIds.map((_, i) => `$${i + 1}`).join(', ')
      const teoricoResult = await transaction.queryObject<TeoricoRow>(
        `select insumo_id, sum(cantidad) as teorico
         from public.movimientos_inventario
         where insumo_id in (${placeholders})
           and tipo_movimiento in ('inventario_inicial', 'conteo_apertura', 'venta')
         group by insumo_id`,
        insumoIds,
      )
      const teoricoPorInsumo = new Map(teoricoResult.rows.map((f) => [f.insumo_id, num(f.teorico)]))

      // 5) Ventas del turno, no eliminadas (RN-010), con sus pagos.
      const pagosResult = await transaction.queryObject<VentaPagoTurnoRow>(
        `select vp.metodo_pago, vp.monto, vp.estado_transferencia
         from public.venta_pagos vp
         join public.ventas v on v.id = vp.venta_id
         where v.turno_id = $1 and v.eliminado = false`,
        [turnoId],
      )

      let totalEfectivoCentavos = 0
      let totalTarjetaCentavos = 0
      let totalNequiCentavos = 0
      let totalRappiCentavos = 0
      let totalTransferenciaExitosaCentavos = 0

      for (const pago of pagosResult.rows) {
        const montoCentavos = centavos(num(pago.monto))
        switch (pago.metodo_pago) {
          case 'efectivo':
            totalEfectivoCentavos += montoCentavos
            break
          case 'tarjeta':
            totalTarjetaCentavos += montoCentavos
            break
          case 'nequi':
            totalNequiCentavos += montoCentavos
            break
          case 'credito_rappi':
            totalRappiCentavos += montoCentavos
            break
          case 'transferencia_qr':
            // RN-007: solo estado_transferencia = 'exitosa' contabiliza;
            // Pendiente/Rechazada quedan en BD con su estado, sin sumar.
            if (pago.estado_transferencia === 'exitosa') {
              totalTransferenciaExitosaCentavos += montoCentavos
            }
            break
        }
      }

      const totalEsperadoCentavos =
        totalEfectivoCentavos +
        totalTarjetaCentavos +
        totalNequiCentavos +
        totalRappiCentavos +
        totalTransferenciaExitosaCentavos

      const dineroContadoCentavos = centavos(datos.dineroContado)
      const diferenciaCentavos = dineroContadoCentavos - totalEsperadoCentavos

      const totalEfectivo = totalEfectivoCentavos / 100
      const totalTarjeta = totalTarjetaCentavos / 100
      const totalNequi = totalNequiCentavos / 100
      const totalRappi = totalRappiCentavos / 100
      const totalTransferenciaExitosa = totalTransferenciaExitosaCentavos / 100
      const totalEsperado = totalEsperadoCentavos / 100
      const diferencia = diferenciaCentavos / 100

      // 6) INSERT cierres_caja (snapshot inmutable).
      const cierreResult = await transaction.queryObject<CierreCajaRow>(
        `insert into public.cierres_caja
           (turno_id, dinero_contado, observaciones, total_efectivo, total_tarjeta,
            total_nequi, total_rappi, total_transferencia_exitosa, total_esperado,
            diferencia, cerrado_por)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         returning id, turno_id, dinero_contado, observaciones, total_efectivo, total_tarjeta,
           total_nequi, total_rappi, total_transferencia_exitosa, total_esperado, diferencia,
           cerrado_por, fecha_cierre`,
        [
          turnoId,
          datos.dineroContado,
          datos.observaciones,
          totalEfectivo,
          totalTarjeta,
          totalNequi,
          totalRappi,
          totalTransferenciaExitosa,
          totalEsperado,
          diferencia,
          caller.id,
        ],
      )
      const cierre = cierreResult.rows[0]

      // 7) INSERT conteo_vasos_cierre, uno por tamaño activo.
      const conteosInsertados: ConteoVasoCierreRow[] = []
      for (const tamano of tamanosActivos) {
        const enviado = datos.conteoVasos.find((c) => c.tamanoVasoId === tamano.id)!
        const cantidadTeorica = teoricoPorInsumo.get(tamano.insumo_id) ?? 0
        const diferenciaVaso = enviado.cantidadFisica - cantidadTeorica

        const conteoResult = await transaction.queryObject<ConteoVasoCierreRow>(
          `insert into public.conteo_vasos_cierre
             (turno_id, tamano_vaso_id, cantidad_teorica, cantidad_fisica, diferencia)
           values ($1, $2, $3, $4, $5)
           returning id, turno_id, tamano_vaso_id, cantidad_teorica, cantidad_fisica, diferencia, created_at`,
          [turnoId, tamano.id, cantidadTeorica, enviado.cantidadFisica, diferenciaVaso],
        )
        conteosInsertados.push(conteoResult.rows[0])
      }

      // 8) UPDATE turnos_caja (guarda de carrera: solo si seguía abierto).
      const turnoActualizadoResult = await transaction.queryObject<TurnoRow>(
        `update public.turnos_caja set estado = 'cerrado'
         where id = $1 and estado = 'abierto'
         returning id`,
        [turnoId],
      )
      if (turnoActualizadoResult.rows.length === 0) {
        throw new AppError(409, 'El turno ya no está abierto (fue cerrado por otra solicitud).')
      }

      await transaction.commit()

      // RN-003: la respuesta con el esperado/diferencia solo se arma y se
      // devuelve DESPUÉS del COMMIT.
      return jsonResponse(
        {
          cierre: {
            id: cierre.id,
            turno_id: cierre.turno_id,
            dinero_contado: num(cierre.dinero_contado),
            observaciones: cierre.observaciones,
            total_efectivo: num(cierre.total_efectivo),
            total_tarjeta: num(cierre.total_tarjeta),
            total_nequi: num(cierre.total_nequi),
            total_rappi: num(cierre.total_rappi),
            total_transferencia_exitosa: num(cierre.total_transferencia_exitosa),
            total_esperado: num(cierre.total_esperado),
            diferencia: num(cierre.diferencia),
            cerrado_por: cierre.cerrado_por,
            fecha_cierre: cierre.fecha_cierre,
          },
          conteo_vasos: conteosInsertados.map((c) => ({
            id: c.id,
            turno_id: c.turno_id,
            tamano_vaso_id: c.tamano_vaso_id,
            cantidad_teorica: num(c.cantidad_teorica),
            cantidad_fisica: num(c.cantidad_fisica),
            diferencia: num(c.diferencia),
            created_at: c.created_at,
          })),
        },
        200,
      )
    } catch (err) {
      try {
        await transaction.rollback()
      } catch (rollbackErr) {
        console.error('cerrar-caja: error al hacer rollback', rollbackErr)
      }
      throw err
    }
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse({ error: err.message }, err.status)
    }
    console.error('cerrar-caja: error inesperado', err)
    return jsonResponse({ error: 'No se pudo cerrar la caja.' }, 500)
  } finally {
    try {
      await client.end()
    } catch (endErr) {
      console.error('cerrar-caja: error al cerrar la conexión', endErr)
    }
  }
})
