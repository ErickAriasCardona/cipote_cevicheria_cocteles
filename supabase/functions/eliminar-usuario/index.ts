// Edge Function: eliminar-usuario
//
// Permite al Administrador eliminar un usuario del sistema (auth.users y usuarios_perfil).
// Validaciones de seguridad:
//   1. Invocador autenticado con rol "administrador" y activo = true.
//   2. Auto-eliminación prohibida: un administrador no puede eliminarse a sí mismo.
//   3. Protección referencial: si el usuario tiene registros dependientes (ventas, turnos, gastos),
//      captura la restricción y retorna un mensaje amigable indicando que debe desactivarlo.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EliminarUsuarioBody {
  usuario_id?: unknown
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'No autenticado.' }, 401)
  }

  // Cliente para resolver quién es el invocador
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

  // Cliente con service_role para administrar auth.users y verificar perfil
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
    return jsonResponse({ error: 'Solo un Administrador puede eliminar usuarios.' }, 403)
  }

  let body: EliminarUsuarioBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  const { usuario_id } = body
  if (typeof usuario_id !== 'string' || usuario_id.trim().length === 0) {
    return jsonResponse({ error: 'El ID del usuario es obligatorio.' }, 422)
  }

  const targetId = usuario_id.trim()

  // Validación de seguridad: no eliminarse a sí mismo
  if (targetId === caller.id) {
    return jsonResponse({ error: 'No puedes eliminar tu propio usuario administrador.' }, 400)
  }

  // Obtener nombre del usuario objetivo
  const { data: targetPerfil } = await supabaseAdmin
    .from('usuarios_perfil')
    .select('nombre_completo')
    .eq('id', targetId)
    .single()

  const nombreUsuario = targetPerfil?.nombre_completo ?? 'el usuario'

  // Intentar eliminar usuario vía Admin API de Supabase Auth
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId)

  if (deleteError) {
    // Si falla por restricción de clave foránea en la base de datos (23503 o foreign key)
    const errMessage = deleteError.message.toLowerCase()
    if (
      errMessage.includes('foreign key') ||
      errMessage.includes('violates') ||
      errMessage.includes('restrict') ||
      errMessage.includes('23503')
    ) {
      return jsonResponse(
        {
          error: `No se puede eliminar a "${nombreUsuario}" porque tiene registros históricos de ventas, turnos de caja o gastos asociados. Para restringir su acceso, desactívalo usando el icono de apagar.`,
        },
        409,
      )
    }

    return jsonResponse({ error: deleteError.message }, 400)
  }

  return jsonResponse(
    { ok: true, mensaje: `Usuario "${nombreUsuario}" eliminado exitosamente.` },
    200,
  )
})
