// Edge Function: recuperar-password
// Envío seguro de enlace de restablecimiento de contraseña vía Resend API con plantilla de marca.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { generarEmailRecuperacionHtml } from './emailRecoveryTemplate.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
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
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Cipote Ceviche Cocteles <onboarding@resend.dev>'
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://cipote-ceviche-cocteles.vercel.app'

  let body: { email?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  const emailRaw = body?.email
  if (typeof emailRaw !== 'string' || !emailRaw.includes('@')) {
    return jsonResponse({ error: 'Ingresa un correo electrónico válido.' }, 422)
  }
  const email = emailRaw.trim().toLowerCase()

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  // 1. Generar enlace de recuperación de contraseña seguro
  const redirectTo = `${frontendUrl.replace(/\/+$/, '')}/login?recovery=true`
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    // Si no existe o hubo error, respondemos con mensaje genérico seguro
    console.warn('No se pudo generar enlace de recuperación para:', email, linkError?.message)
    return jsonResponse(
      { ok: true, mensaje: 'Si la cuenta existe, se enviará un enlace de recuperación.' },
      200,
    )
  }

  let actionLink = linkData.properties.action_link
  try {
    const urlObj = new URL(actionLink)
    urlObj.searchParams.set('redirect_to', redirectTo)
    actionLink = urlObj.toString()
  } catch {
    // fallback
  }

  // 2. Obtener nombre del perfil si existe
  let nombreCompleto: string | undefined
  try {
    const { data: perfil } = await supabaseAdmin
      .from('usuarios_perfil')
      .select('nombre_completo')
      .eq('id', linkData.user?.id)
      .maybeSingle()
    if (perfil?.nombre_completo) {
      nombreCompleto = perfil.nombre_completo
    }
  } catch {
    // No bloqueante
  }

  // 3. Enviar correo vía Resend
  if (resendApiKey) {
    const emailHtml = generarEmailRecuperacionHtml({
      nombreCompleto,
      email,
      actionLink,
      logoUrl: `${frontendUrl.replace(/\/+$/, '')}/logo.jpeg`,
    })

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: [email],
          subject: '🔑 Restablece tu contraseña — Cipote Ceviche Cocteles',
          html: emailHtml,
        }),
      })

      if (!resendRes.ok) {
        const resendErr = await resendRes.text()
        console.error('Error enviando email con Resend:', resendErr)

        const esErrorDominio =
          resendRes.status === 403 ||
          resendErr.toLowerCase().includes('testing emails') ||
          resendErr.toLowerCase().includes('validation_error') ||
          resendErr.toLowerCase().includes('verify a domain')

        if (esErrorDominio) {
          return jsonResponse(
            {
              error:
                'El servicio de correos está en modo de prueba y solo permite envíos al propietario de la cuenta (eariassena19@gmail.com). Para restablecer tu contraseña, solicita ayuda al Administrador o verifica un dominio en resend.com.',
            },
            403,
          )
        }

        return jsonResponse(
          { error: `Error enviando correo de recuperación (${resendErr})` },
          502,
        )
      }
    } catch (err) {
      console.error('Excepción al conectar con Resend:', err)
      return jsonResponse(
        { error: 'Error de conexión al enviar el correo de recuperación.' },
        502,
      )
    }
  } else {
    console.warn('RESEND_API_KEY no configurada en Edge Functions.')
  }

  return jsonResponse(
    { ok: true, mensaje: 'Enlace de recuperación enviado exitosamente a tu correo.' },
    200,
  )
})
