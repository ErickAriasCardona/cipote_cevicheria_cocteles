// Edge Function: eliminar-restablecer-venta (BD-07.1, RF-03.6/HU-03.6,
// RN-002/RN-009/RN-010)
//
// Único punto de escritura de las 5 columnas de soft-delete de `ventas`
// (`eliminado`, `eliminado_por`, `eliminado_en`, `restablecido_por`,
// `restablecido_en`) — ya existen desde `20260904000009_ventas_venta_pagos.sql`
// (BD-04.1), sin ninguna migración nueva. `ventas` no tiene política UPDATE
// para ningún rol (🚫 total, ni siquiera Administrador, ver esa migración) —
// la matriz de acceso de Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección
// 5.3) deja escrito que esa ausencia total de política garantiza por
// construcción que ni el Cajero ni un bug de RLS mal configurada puedan
// tocar estas columnas; esta Edge Function revalida el rol Administrador en
// su propio código como segundo control (arquitectura sección 6.6).
//
// A diferencia de `registrar-venta`/`cerrar-caja`, este es un único UPDATE de
// una fila de `ventas`, ya atómico por sí mismo vía `supabase-js`/PostgREST
// con `service_role` — mismo nivel de complejidad que
// `actualizar-estado-transferencia` (BD-05.1).
//
// RN-009 (auditoría confiable): `eliminado_por`/`restablecido_por` se
// resuelven siempre desde `auth.uid()` server-side, nunca del payload del
// cliente — igual que `cajero_id` en `registrar-venta`.
//
// Guarda de transición (arquitectura 6.6, punto 3): no se puede "eliminar"
// una venta ya eliminada, ni "restablecer" una que no lo está. El ciclo
// eliminar→restablecer→eliminar es válido (Poseidon, sección 4, nota
// deliberada de diseño): cada acción solo escribe sus propias 2 columnas,
// nunca limpia las de la acción contraria.
//
// Nota de consistencia con BD-06: esta función nunca toca `cierres_caja` ni
// `conteo_vasos_cierre` — si el turno de la venta ya tiene un cierre
// guardado (inmutable), la exclusión de RN-010 ya quedó congelada en ese
// snapshot; esta operación no lo reabre ni lo recalcula (arquitectura 6.6,
// punto 5), solo afecta el cálculo de un futuro cierre aún no guardado.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type AccionSoftDelete = 'eliminar' | 'restablecer'

const ACCIONES: AccionSoftDelete[] = ['eliminar', 'restablecer']

interface EliminarRestablecerVentaPayload {
  ventaId: string
  accion: AccionSoftDelete
}

interface VentaRow {
  id: string
  turno_id: string
  cajero_id: string
  producto_id: string
  tamano_vaso_id: string
  cantidad: number
  precio_unitario: number
  total: number
  tipo_entrega: string
  observaciones: string | null
  created_at: string
  eliminado: boolean
  eliminado_por: string | null
  eliminado_en: string | null
  restablecido_por: string | null
  restablecido_en: string | null
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

function validarPayload(body: Record<string, unknown>): EliminarRestablecerVentaPayload {
  const ventaId = body.venta_id
  const accion = body.accion

  if (typeof ventaId !== 'string' || ventaId.trim() === '') {
    throw new AppError(422, 'venta_id es obligatorio.')
  }
  if (typeof accion !== 'string' || !ACCIONES.includes(accion as AccionSoftDelete)) {
    throw new AppError(422, `accion debe ser uno de: ${ACCIONES.join(', ')}.`)
  }

  return { ventaId: ventaId.trim(), accion: accion as AccionSoftDelete }
}

const SELECT_VENTA =
  'id, turno_id, cajero_id, producto_id, tamano_vaso_id, cantidad, precio_unitario, total, ' +
  'tipo_entrega, observaciones, created_at, eliminado, eliminado_por, eliminado_en, ' +
  'restablecido_por, restablecido_en'

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
  // es (mismo patrón que el resto de Edge Functions del proyecto).
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

  // Cliente con service_role: única forma de escribir estas columnas
  // (ventas no tiene política UPDATE para ningún rol) y de resolver el rol
  // del invocador sin depender de RLS.
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerPerfil, error: callerPerfilError } = await supabaseAdmin
    .from('usuarios_perfil')
    .select('rol, activo')
    .eq('id', caller.id)
    .single()

  if (callerPerfilError || !callerPerfil || !callerPerfil.activo) {
    return jsonResponse({ error: 'No autorizado.' }, 403)
  }
  // RN-002 (excepción exclusiva del Administrador, HU-03.6 CA-03): el Cajero
  // nunca puede eliminar ni restablecer una venta.
  if (callerPerfil.rol !== 'administrador') {
    return jsonResponse(
      { error: 'Solo un Administrador puede eliminar o restablecer una venta.' },
      403,
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  let datos: EliminarRestablecerVentaPayload
  try {
    datos = validarPayload(body)
  } catch (err) {
    if (err instanceof AppError) return jsonResponse({ error: err.message }, err.status)
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  const { data: venta, error: ventaError } = await supabaseAdmin
    .from('ventas')
    .select(SELECT_VENTA)
    .eq('id', datos.ventaId)
    .maybeSingle<VentaRow>()

  if (ventaError || !venta) {
    return jsonResponse({ error: 'La venta indicada no existe.' }, 404)
  }

  // Guarda de transición (arquitectura 6.6, punto 3): no se puede "eliminar"
  // una venta ya eliminada, ni "restablecer" una que no lo está.
  if (datos.accion === 'eliminar' && venta.eliminado) {
    return jsonResponse({ error: 'La venta ya está eliminada.' }, 409)
  }
  if (datos.accion === 'restablecer' && !venta.eliminado) {
    return jsonResponse({ error: 'La venta no está eliminada; no se puede restablecer.' }, 409)
  }

  const ahora = new Date().toISOString()
  // Cada acción solo escribe sus propias 2 columnas — nunca limpia las de la
  // acción contraria (permite el ciclo eliminar→restablecer→eliminar sin
  // violar ck_ventas_soft_delete_consistente, ver cabecera de este archivo).
  const cambios =
    datos.accion === 'eliminar'
      ? { eliminado: true, eliminado_por: caller.id, eliminado_en: ahora }
      : { eliminado: false, restablecido_por: caller.id, restablecido_en: ahora }

  const { data: actualizada, error: updateError } = await supabaseAdmin
    .from('ventas')
    .update(cambios)
    .eq('id', datos.ventaId)
    .select(SELECT_VENTA)
    .single()

  if (updateError || !actualizada) {
    console.error('eliminar-restablecer-venta: error al actualizar', updateError)
    const mensaje =
      datos.accion === 'eliminar' ? 'No se pudo eliminar la venta.' : 'No se pudo restablecer la venta.'
    return jsonResponse({ error: mensaje }, 500)
  }

  return jsonResponse({ venta: actualizada }, 200)
})
