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

        // Si el fallo de Resend se debe a restricciones de dominio de prueba
        // (por ejemplo: "You can only send testing emails to your own email address..."),
        // despachamos el correo de verificación directamente vía Supabase Auth para que
        // le llegue a la bandeja del usuario y mantenga el estado no confirmado (email_confirmed_at = null).
        const esErrorRestriccionDominio =
          resendRes.status === 403 ||
          resendErr.toLowerCase().includes('testing emails') ||
          resendErr.toLowerCase().includes('validation_error') ||
          resendErr.toLowerCase().includes('verify a domain')

        if (esErrorRestriccionDominio) {
          console.warn('Resend en modo prueba: destinatario externo no permitido. Despachando verificación vía Supabase Auth.')
          const supabaseAnon = createClient(supabaseUrl, anonKey)
          const { error: supabaseResendErr } = await supabaseAnon.auth.resend({
            type: 'signup',
            email: datos.email,
            options: {
              emailRedirectTo: redirectTo,
            },
          })

          if (supabaseResendErr) {
            console.error('Error enviando correo vía Supabase Auth:', supabaseResendErr)
            // Compensación estricta: eliminamos el usuario si no se pudo enviar el correo
            await supabaseAdmin.from('usuarios_perfil').delete().eq('id', userId)
            await supabaseAdmin.auth.admin.deleteUser(userId)
            return jsonResponse(
              {
                error: `No se pudo enviar el correo de verificación a ${datos.email} (${supabaseResendErr.message}). La cuenta no fue creada para mantener la regla de verificación obligatoria.`,
              },
              502,
            )
          }

          return jsonResponse(
            {
              usuario: perfil,
              emailEnviado: true,
              aviso: `Usuario "${datos.nombreCompleto}" creado exitosamente. Se envió el correo de confirmación a ${datos.email}. El usuario no podrá ingresar al sistema hasta que confirme su cuenta.`,
            },
            200,
          )
        }

        // Si es otro fallo grave e inesperado, aplicamos compensación
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
      // Fallback a Supabase Auth
      const supabaseAnon = createClient(supabaseUrl, anonKey)
      const { error: supabaseResendErr } = await supabaseAnon.auth.resend({
        type: 'signup',
        email: datos.email,
        options: {
          emailRedirectTo: redirectTo,
        },
      })
      if (supabaseResendErr) {
        await supabaseAdmin.from('usuarios_perfil').delete().eq('id', userId)
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return jsonResponse(
          {
            error: `Error al enviar correo de verificación: ${supabaseResendErr.message}`,
          },
          502,
        )
      }
      return jsonResponse(
        {
          usuario: perfil,
          emailEnviado: true,
          aviso: `Usuario "${datos.nombreCompleto}" creado exitosamente. Se envió el correo de verificación a ${datos.email}. El usuario no podrá ingresar hasta que confirme su cuenta.`,
        },
        200,
      )
    }
  } else {
    // Si no hay Resend API Key configurada, enviamos confirmación vía Supabase Auth
    const supabaseAnon = createClient(supabaseUrl, anonKey)
    const { error: supabaseResendErr } = await supabaseAnon.auth.resend({
      type: 'signup',
      email: datos.email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })
    if (supabaseResendErr) {
      await supabaseAdmin.from('usuarios_perfil').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return jsonResponse(
        {
          error: `Error al enviar correo de verificación vía Supabase: ${supabaseResendErr.message}`,
        },
        502,
      )
    }
  }

  return jsonResponse(
    {
      usuario: perfil,
      emailEnviado: true,
      aviso: `Usuario "${datos.nombreCompleto}" creado exitosamente. Se envió un correo electrónico con el enlace de confirmación a ${datos.email}. El usuario no podrá ingresar hasta confirmar su cuenta.`,
    },
    200,
  )
})
