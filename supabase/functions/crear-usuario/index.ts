// Edge Function: crear-usuario (BD-01.5, RF-01.1/HU-01.1)
//
// Flujo con confirmación de correo electrónico obligatoria vía SMTP (Supabase Auth):
//   1. Verifica rol Administrador server-side (resuelve el rol directamente
//      desde usuarios_perfil con service_role).
//   2. Crea el usuario en auth.users en estado no confirmado (email_confirmed_at = null)
//      con la contraseña inicial asignada y metadata (nombre_completo, password_inicial).
//   3. Inserta su fila en usuarios_perfil en la misma operación.
//   4. Envía el email de invitación/activación oficial mediante el servidor SMTP con la plantilla de Cipote.
//   5. Si algún paso falla, compensa eliminando el usuario para no dejar cuentas huérfanas.

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
  redirectTo?: unknown
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
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://cipote-ceviche-cocteles.vercel.app'

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

  // Cliente con service_role para operaciones administrativas.
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

  const redirectTo =
    (typeof body?.redirectTo === 'string' && body.redirectTo.trim().length > 0)
      ? body.redirectTo.trim()
      : `${frontendUrl.replace(/\/+$/, '')}/login?confirmed=true`

  // 1. Crear el usuario en auth.users con la contraseña fijada y email_confirm en false
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: datos.email,
    password: datos.password,
    email_confirm: false,
    user_metadata: {
      nombre_completo: datos.nombreCompleto,
      password_inicial: datos.password,
    },
  })

  if (createError || !createData?.user) {
    const errorMsg =
      createError?.message?.includes('already registered') ||
      createError?.message?.includes('already been registered')
        ? 'Ya existe un usuario registrado con este correo electrónico.'
        : (createError?.message ?? 'No se pudo crear el usuario en el sistema de autenticación.')
    return jsonResponse({ error: errorMsg }, 422)
  }

  const userId = createData.user.id

  // 2. Insertar fila en usuarios_perfil
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('usuarios_perfil')
    .insert({
      id: userId,
      nombre_completo: datos.nombreCompleto,
      rol: datos.rol,
      activo: true,
    })
    .select('id, nombre_completo, rol, activo, created_at, updated_at')
    .single()

  if (perfilError || !perfil) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return jsonResponse(
      { error: perfilError?.message ?? 'No se pudo crear el perfil del usuario.' },
      500,
    )
  }

  // 3. Enviar invitación con el enlace de confirmación vía SMTP oficial
  // Incluimos tanto nombre_completo como password_inicial para que la plantilla HTML
  // oficial de Cipote muestre los datos de acceso completos y exactos.
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    datos.email,
    {
      redirectTo,
      data: {
        nombre_completo: datos.nombreCompleto,
        password_inicial: datos.password,
      },
    },
  )

  if (inviteError) {
    console.error('Error enviando invitación por Supabase Auth SMTP:', inviteError)
    await supabaseAdmin.from('usuarios_perfil').delete().eq('id', userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return jsonResponse(
      {
        error: `No se pudo enviar el correo de verificación a ${datos.email} (${inviteError.message}). La cuenta no fue creada.`,
      },
      502,
    )
  }

  return jsonResponse(
    {
      usuario: perfil,
      emailEnviado: true,
      aviso: `Usuario "${datos.nombreCompleto}" creado exitosamente. Se envió el correo de confirmación a ${datos.email}. El usuario no podrá ingresar al sistema hasta que confirme su cuenta mediante el enlace recibido.`,
    },
    200,
  )
})
