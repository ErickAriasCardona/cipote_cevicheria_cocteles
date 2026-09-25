// Edge Function: crear-usuario (BD-01.5, RF-01.1/HU-01.1)
//
// Flujo con confirmación de correo electrónico obligatoria vía Resend API:
//   1. Verifica rol Administrador server-side (resuelve el rol directamente
//      desde usuarios_perfil con service_role).
//   2. Genera el enlace de confirmación y crea el usuario en auth.users en estado
//      no confirmado (email_confirmed_at = null) vía admin.generateLink.
//   3. Inserta su fila en usuarios_perfil en la misma operación.
//   4. Envía el email con el enlace y estilo de marca profesional mediante Resend API.
//   5. Si algún paso falla, compensa eliminando el usuario para no dejar cuentas huérfanas.

import { createClient } from 'npm:@supabase/supabase-js@2'
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
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Cipote Ceviche Cocteles <onboarding@resend.dev>'
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

  // 1. Generar enlace de verificación y crear usuario con estado no verificado
  const redirectTo = `${frontendUrl.replace(/\/+$/, '')}/login?confirmed=true`
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: datos.email,
    password: datos.password,
    options: {
      data: { nombre_completo: datos.nombreCompleto },
      redirectTo,
    },
  })

  if (linkError || !linkData?.user) {
    const errorMsg = linkError?.message?.includes('already been registered')
      ? 'Ya existe un usuario registrado con este correo electrónico.'
      : (linkError?.message ?? 'No se pudo crear el usuario en el sistema de autenticación.')
    return jsonResponse({ error: errorMsg }, 422)
  }

  const userId = linkData.user.id
  let actionLink = linkData.properties?.action_link ?? redirectTo
  try {
    const urlObj = new URL(actionLink)
    urlObj.searchParams.set('redirect_to', redirectTo)
    actionLink = urlObj.toString()
  } catch {
    // fallback
  }

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
    // Compensación: eliminar el usuario de auth.users
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return jsonResponse(
      { error: perfilError?.message ?? 'No se pudo crear el perfil del usuario.' },
      500,
    )
  }

  // 3. Enviar correo de confirmación con Resend
  const emailHtml = generarEmailConfirmacionHtml({
    nombreCompleto: datos.nombreCompleto,
    email: datos.email,
    password: datos.password,
    rol: datos.rol,
    actionLink,
    logoUrl: `${frontendUrl.replace(/\/+$/, '')}/logo.jpeg`,
  })

  if (resendApiKey) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: [datos.email],
          subject: '🦐 Confirma tu correo para acceder a Cipote Ceviche Cocteles',
          html: emailHtml,
        }),
      })

      if (!resendRes.ok) {
        const resendErr = await resendRes.text()
        console.error('Error enviando correo con Resend:', resendErr)
        // Compensación completa
        await supabaseAdmin.from('usuarios_perfil').delete().eq('id', userId)
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return jsonResponse(
          {
            error: `No se pudo enviar el correo de confirmación (Resend: ${resendErr}). La cuenta no fue creada. Verifica las restricciones de dominio de Resend.`,
          },
          502,
        )
      }
    } catch (errResend) {
      console.error('Excepción al conectar con Resend:', errResend)
      await supabaseAdmin.from('usuarios_perfil').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return jsonResponse(
        {
          error: `Error de conexión al enviar el correo con Resend: ${errResend instanceof Error ? errResend.message : String(errResend)}`,
        },
        502,
      )
    }
  } else {
    console.warn('RESEND_API_KEY no configurada. El usuario fue registrado pero no se envió el correo automático.')
  }

  return jsonResponse(
    {
      usuario: perfil,
      emailEnviado: Boolean(resendApiKey),
      aviso: resendApiKey
        ? 'Usuario creado y correo de confirmación enviado exitosamente.'
        : 'Usuario creado. Configura RESEND_API_KEY en Supabase Secrets para envíos automáticos.',
    },
    200,
  )
})
