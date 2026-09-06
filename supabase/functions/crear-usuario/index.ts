// Edge Function: crear-usuario (BD-01.5, RF-01.1/HU-01.1)
//
// Extensión aprobada por Erick al diseño original de Prometeo (ver
// PLAN_DESARROLLO_2026-08-31_BD-01-fundacion-tecnica.md, sección "Mejoras
// propuestas al diseño de Prometeo", y el comentario del 2026-08-31 en la
// tarjeta Kanban BD-01). Crear un usuario real requiere la Admin API de
// Supabase Auth (service_role key), que nunca puede usarse desde el
// navegador con la anon key — por eso esta operación no es un INSERT
// directo bajo RLS como el resto de usuariosService, sino la única
// excepción, resuelta aquí siguiendo el mismo patrón ya usado por
// cerrar-caja / eliminar-restablecer-venta:
//   1. Verifica rol Administrador server-side (resuelve el rol directamente
//      desde usuarios_perfil, sin pasar por rol_permisos — mismo patrón
//      documentado en MODELO_DATOS_MVP_1.0_2026-08-30.md sección 5.3,
//      nota "eliminar-restablecer-venta y rol_permisos").
//   2. Crea el usuario en auth.users vía admin.createUser (service_role).
//   3. Inserta su fila en usuarios_perfil en la misma operación.
//   4. Si el paso 3 falla, compensa eliminando el usuario de Auth creado en
//      el paso 2 (no hay transacción real entre auth.users y public.*).

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Rol = 'administrador' | 'cajero'

interface CrearUsuarioBody {
  nombre_completo?: unknown
  email?: unknown
  password?: unknown
  rol?: unknown
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function validarPayload(
  body: CrearUsuarioBody,
): { nombreCompleto: string; email: string; password: string; rol: Rol } | null {
  const { nombre_completo, email, password, rol } = body
  if (typeof nombre_completo !== 'string' || nombre_completo.trim().length === 0) return null
  if (typeof email !== 'string' || email.trim().length === 0) return null
  if (typeof password !== 'string' || password.length < 6) return null
  if (rol !== 'administrador' && rol !== 'cajero') return null
  return { nombreCompleto: nombre_completo.trim(), email: email.trim(), password, rol }
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

  // Cliente "como el invocador" (anon key + su JWT) solo para resolver quién es.
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

  // Cliente con service_role: única forma de administrar auth.users y de
  // resolver el rol del invocador sin depender de RLS (mismo patrón que
  // cerrar-caja / eliminar-restablecer-venta).
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerPerfil, error: callerPerfilError } = await supabaseAdmin
    .from('usuarios_perfil')
    .select('rol, activo')
    .eq('id', caller.id)
    .single()

  if (callerPerfilError || !callerPerfil || !callerPerfil.activo) {
    return jsonResponse({ error: 'No autorizado.' }, 403)
  }
  if (callerPerfil.rol !== 'administrador') {
    return jsonResponse({ error: 'Solo un Administrador puede crear usuarios.' }, 403)
  }

  let body: CrearUsuarioBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  const datos = validarPayload(body)
  if (!datos) {
    return jsonResponse(
      { error: 'nombre_completo, email, password (mínimo 6 caracteres) y rol son obligatorios.' },
      422,
    )
  }

  const { data: nuevoAuthUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: datos.email,
    password: datos.password,
    email_confirm: true,
    user_metadata: { nombre_completo: datos.nombreCompleto },
  })

  if (createUserError || !nuevoAuthUser?.user) {
    return jsonResponse({ error: createUserError?.message ?? 'No se pudo crear el usuario.' }, 422)
  }

  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('usuarios_perfil')
    .insert({
      id: nuevoAuthUser.user.id,
      nombre_completo: datos.nombreCompleto,
      rol: datos.rol,
      activo: true,
    })
    .select('id, nombre_completo, rol, activo, created_at, updated_at')
    .single()

  if (perfilError || !perfil) {
    // Compensación: no dejar un usuario huérfano en auth.users sin perfil.
    await supabaseAdmin.auth.admin.deleteUser(nuevoAuthUser.user.id)
    return jsonResponse(
      { error: perfilError?.message ?? 'No se pudo crear el perfil del usuario.' },
      500,
    )
  }

  return jsonResponse({ usuario: perfil }, 200)
})
