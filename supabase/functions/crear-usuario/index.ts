// Edge Function: crear-usuario (BD-01.5, RF-01.1/HU-01.1)
//
// Flujo con confirmación de correo electrónico obligatoria vía SMTP (Gmail):
//   1. Verifica rol Administrador server-side (resuelve el rol directamente
//      desde usuarios_perfil con service_role).
//   2. Crea el usuario en auth.users en estado no confirmado (email_confirmed_at = null)
//      con la contraseña inicial asignada y metadata (nombre_completo).
//   3. Inserta su fila en usuarios_perfil en la misma operación.
//   4. Genera el enlace criptográfico oficial de activación vía Supabase Auth generateLink.
//   5. Despacha el correo electrónico con diseño corporativo oficial y la contraseña visible
//      directamente a través del servidor SMTP (Gmail).
//   6. Si algún paso falla, compensa eliminando el usuario para no dejar cuentas huérfanas.

import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.15'
import { generarEmailConfirmacionHtml } from './emailTemplate.ts'

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
  return { nombreCompleto: nombre_completo.trim(), email: email.trim().toLowerCase(), password, rol }
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

  // Configuración del servidor SMTP (Gmail)
  const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465', 10)
  const smtpUser = Deno.env.get('SMTP_USER') || 'eariassena19@gmail.com'
  const smtpPass = Deno.env.get('SMTP_PASS') || 'isqeknhxpefjspim'
  const smtpFrom = Deno.env.get('SMTP_FROM') || 'Cipote Ceviche Cocteles <eariassena19@gmail.com>'

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
      email: datos.email,
      rol: datos.rol,
      activo: true,
    })
    .select('id, nombre_completo, email, rol, activo, created_at, updated_at')
    .single()

  if (perfilError || !perfil) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return jsonResponse(
      { error: perfilError?.message ?? 'No se pudo crear el perfil del usuario.' },
      500,
    )
  }

  // 3. Generar enlace oficial de verificación / activación
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: datos.email,
    password: datos.password,
    options: {
      redirectTo,
    },
  })

  const actionLink = linkData?.properties?.action_link
  if (linkError || !actionLink) {
    console.error('Error generando enlace de verificación:', linkError)
    await supabaseAdmin.from('usuarios_perfil').delete().eq('id', userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return jsonResponse(
      { error: 'No se pudo generar el enlace de confirmación para el usuario.' },
      500,
    )
  }

  // 4. Generar el correo electrónico con diseño corporativo y contraseña visible
  const html = generarEmailConfirmacionHtml({
    nombreCompleto: datos.nombreCompleto,
    email: datos.email,
    password: datos.password,
    rol: datos.rol,
    actionLink,
  })

  // 5. Enviar el correo directamente mediante el servidor SMTP (Gmail)
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: datos.email,
      subject: '🎉 Te damos la bienvenida a Cipote Ceviche Cocteles — Confirma tu cuenta',
      html,
    })
  } catch (smtpErr) {
    console.error('Error enviando correo vía SMTP:', smtpErr)
    await supabaseAdmin.from('usuarios_perfil').delete().eq('id', userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    const errMessage = smtpErr instanceof Error ? smtpErr.message : String(smtpErr)
    return jsonResponse(
      {
        error: `No se pudo enviar el correo de verificación a ${datos.email} mediante el servidor SMTP (${errMessage}). La cuenta no fue creada.`,
      },
      502,
    )
  }

  return jsonResponse(
    {
      usuario: perfil,
      emailEnviado: true,
      aviso: `Usuario "${datos.nombreCompleto}" creado exitosamente. Se envió el correo de confirmación con sus credenciales a ${datos.email}. El usuario no podrá ingresar al sistema hasta que confirme su cuenta mediante el enlace recibido.`,
    },
    200,
  )
})
