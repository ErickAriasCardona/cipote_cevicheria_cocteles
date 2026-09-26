// Edge Function: recuperar-password
// Envío seguro de enlace de restablecimiento de contraseña vía SMTP oficial de Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2'

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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
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

  // Despacho directo mediante Supabase Auth con servidor SMTP
  const redirectTo = `${frontendUrl.replace(/\/+$/, '')}/login?recovery=true`
  const supabaseAnon = createClient(supabaseUrl, anonKey)
  const { error: resetAuthError } = await supabaseAnon.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (resetAuthError) {
    console.error('Error enviando correo de recuperación vía SMTP:', resetAuthError)
    return jsonResponse(
      { error: `No se pudo enviar el correo de recuperación a ${email}: ${resetAuthError.message}` },
      502,
    )
  }

  return jsonResponse(
    { ok: true, mensaje: 'Enlace de recuperación enviado exitosamente a tu correo.' },
    200,
  )
})
