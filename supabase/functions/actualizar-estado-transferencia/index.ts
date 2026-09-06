// Edge Function: actualizar-estado-transferencia (BD-05.1, RF-03.5/HU-03.5,
// CA-01 a CA-04)
//
// Único punto de escritura de `venta_pagos.estado_transferencia` (ver
// PLAN_DESARROLLO_2026-09-04_BD-05-estado-transferencias.md). `venta_pagos`
// no tiene ninguna política UPDATE bajo RLS para ningún rol (🚫 total, ver
// migración `20260904000009_ventas_venta_pagos.sql`) — la matriz de acceso de
// Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección 5.3) deja escrito que
// el cambio de estado pasa exclusivamente por esta función, que valida aquí
// mismo que solo el Cajero puede hacerlo (CA-04) y solo sobre sus propias
// ventas (mismo criterio "propio registro" ya usado en `registrar-venta`
// para el turno abierto).
//
// Esta función NUNCA toca `metodo_pago` (aprobado por Erick el 2026-09-05:
// el Cajero solo elige el método de pago antes de confirmar la venta, dentro
// del formulario de `registrar-venta`; editarlo después del registro queda
// fuera de alcance de BD-05 y sería, en el futuro, exclusivo de
// Administrador/root).
//
// A diferencia de `registrar-venta`, este es un único UPDATE de una fila de
// `venta_pagos`, ya atómico por sí mismo vía `supabase-js`/PostgREST con
// `service_role` — no requiere conexión Postgres directa ni transacción
// multi-tabla (mismo nivel de complejidad que el INSERT único de
// `crear-usuario`).

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type EstadoTransferencia = 'pendiente' | 'exitosa' | 'rechazada_cancelada'

const ESTADOS_TRANSFERENCIA: EstadoTransferencia[] = ['pendiente', 'exitosa', 'rechazada_cancelada']

interface ActualizarEstadoTransferenciaPayload {
  pagoId: string
  nuevoEstado: EstadoTransferencia
}

interface VentaPagoConVentaRow {
  id: string
  venta_id: string
  metodo_pago: string
  monto: number
  estado_transferencia: EstadoTransferencia | null
  actualizado_por: string | null
  created_at: string
  updated_at: string
  ventas: { cajero_id: string } | { cajero_id: string }[] | null
}

/** Error de negocio con código HTTP explícito (mismo patrón que
 * `registrar-venta`/`crear-usuario`). */
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

function validarPayload(body: Record<string, unknown>): ActualizarEstadoTransferenciaPayload {
  const pagoId = body.pago_id
  const nuevoEstado = body.nuevo_estado

  if (typeof pagoId !== 'string' || pagoId.trim() === '') {
    throw new AppError(422, 'pago_id es obligatorio.')
  }
  if (typeof nuevoEstado !== 'string' || !ESTADOS_TRANSFERENCIA.includes(nuevoEstado as EstadoTransferencia)) {
    throw new AppError(422, `nuevo_estado debe ser uno de: ${ESTADOS_TRANSFERENCIA.join(', ')}.`)
  }

  return { pagoId: pagoId.trim(), nuevoEstado: nuevoEstado as EstadoTransferencia }
}

/** `ventas` embebida puede llegar como objeto único o arreglo de un elemento
 * según la versión de PostgREST/supabase-js; se normaliza aquí. */
function cajeroIdDeVenta(ventas: VentaPagoConVentaRow['ventas']): string | null {
  if (!ventas) return null
  if (Array.isArray(ventas)) return ventas[0]?.cajero_id ?? null
  return ventas.cajero_id
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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'No autenticado.' }, 401)
  }

  // Cliente "como el invocador" (anon key + su JWT) solo para resolver quién
  // es (mismo patrón que crear-usuario/registrar-venta).
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

  // Cliente con service_role: resuelve rol/activo sin depender de RLS, y es
  // el único cliente que escribe (venta_pagos no tiene política UPDATE para
  // ningún rol de aplicación).
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerPerfil, error: callerPerfilError } = await supabaseAdmin
    .from('usuarios_perfil')
    .select('rol, activo')
    .eq('id', caller.id)
    .single()

  if (callerPerfilError || !callerPerfil || !callerPerfil.activo) {
    return jsonResponse({ error: 'No autorizado.' }, 403)
  }
  // CA-04: exclusivo del Cajero, nunca del Administrador.
  if (callerPerfil.rol !== 'cajero') {
    return jsonResponse(
      { error: 'Solo el Cajero puede actualizar el estado de una transferencia.' },
      403,
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  let datos: ActualizarEstadoTransferenciaPayload
  try {
    datos = validarPayload(body)
  } catch (err) {
    if (err instanceof AppError) return jsonResponse({ error: err.message }, err.status)
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  // Busca el pago junto con el cajero_id de la venta asociada (join), para
  // validar tipo de pago y propiedad antes de escribir.
  const { data: pago, error: pagoError } = await supabaseAdmin
    .from('venta_pagos')
    .select('id, venta_id, metodo_pago, monto, estado_transferencia, actualizado_por, created_at, updated_at, ventas!inner(cajero_id)')
    .eq('id', datos.pagoId)
    .maybeSingle<VentaPagoConVentaRow>()

  if (pagoError || !pago) {
    return jsonResponse({ error: 'La transferencia indicada no existe.' }, 404)
  }

  if (pago.metodo_pago !== 'transferencia_qr') {
    return jsonResponse({ error: 'Este pago no corresponde a una transferencia/QR.' }, 409)
  }

  const cajeroIdVenta = cajeroIdDeVenta(pago.ventas)
  if (cajeroIdVenta !== caller.id) {
    return jsonResponse(
      { error: 'No puedes actualizar el estado de una transferencia que no es de tus propias ventas.' },
      403,
    )
  }

  const { data: actualizado, error: updateError } = await supabaseAdmin
    .from('venta_pagos')
    .update({
      estado_transferencia: datos.nuevoEstado,
      actualizado_por: caller.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', datos.pagoId)
    .select('id, venta_id, metodo_pago, monto, estado_transferencia, created_at, updated_at')
    .single()

  if (updateError || !actualizado) {
    console.error('actualizar-estado-transferencia: error al actualizar', updateError)
    return jsonResponse({ error: 'No se pudo actualizar el estado de la transferencia.' }, 500)
  }

  return jsonResponse({ pago: actualizado }, 200)
})
