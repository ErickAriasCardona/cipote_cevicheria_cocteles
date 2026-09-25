import { supabase } from '../lib/supabaseClient'
import type { ActualizarUsuarioInput, CrearUsuarioInput, UsuarioPerfil } from '../types/usuario'

/**
 * Servicio de gestión de usuarios y roles (BD-01.5, RF-01.1).
 *
 * `listarUsuarios` y `actualizarUsuario` son CRUD simple bajo RLS (PostgREST directo),
 * consistente con el diagrama de componentes de Prometeo (ARQUITECTURA_MVP_1.0_2026-08-30.md
 * sección 2: "usuariosService --> REST").
 *
 * `crearUsuario` es la única excepción: invoca la Edge Function `crear-usuario`
 * porque dar de alta un usuario real requiere la Admin API de Supabase Auth
 * (service_role key), que nunca puede usarse desde el navegador. Ver la
 * justificación completa en supabase/functions/crear-usuario/index.ts y en
 * PLAN_DESARROLLO_2026-08-31_BD-01-fundacion-tecnica.md ("Mejoras propuestas
 * al diseño de Prometeo"), aprobada explícitamente por Erick.
 */

interface UsuarioPerfilRow {
  id: string
  nombre_completo: string
  rol: 'administrador' | 'cajero'
  activo: boolean
  created_at: string
  updated_at: string
}

function mapRow(row: UsuarioPerfilRow): UsuarioPerfil {
  return {
    id: row.id,
    nombreCompleto: row.nombre_completo,
    rol: row.rol,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const usuariosService = {
  async listarUsuarios(): Promise<UsuarioPerfil[]> {
    const { data, error } = await supabase
      .from('usuarios_perfil')
      .select('id, nombre_completo, rol, activo, created_at, updated_at')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data as UsuarioPerfilRow[]).map(mapRow)
  },

  async crearUsuario(input: CrearUsuarioInput): Promise<UsuarioPerfil> {
    const { data, error } = await supabase.functions.invoke('crear-usuario', {
      body: {
        nombre_completo: input.nombreCompleto,
        email: input.email,
        password: input.password,
        rol: input.rol,
      },
    })
    if (error) {
      if ('context' in error && error.context) {
        try {
          const body = await (error.context as Response).json()
          if (body?.error) throw new Error(body.error)
        } catch (jsonErr) {
          if (jsonErr instanceof Error && jsonErr.message !== error.message) {
            throw jsonErr
          }
        }
      }
      throw error
    }
    return mapRow(data.usuario as UsuarioPerfilRow)
  },

  async actualizarUsuario(id: string, cambios: ActualizarUsuarioInput): Promise<UsuarioPerfil> {
    const payload: Partial<UsuarioPerfilRow> = {}
    if (cambios.nombreCompleto !== undefined) payload.nombre_completo = cambios.nombreCompleto
    if (cambios.rol !== undefined) payload.rol = cambios.rol
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await supabase
      .from('usuarios_perfil')
      .update(payload)
      .eq('id', id)
      .select('id, nombre_completo, rol, activo, created_at, updated_at')
      .single()
    if (error) throw error
    return mapRow(data as UsuarioPerfilRow)
  },

  async eliminarUsuario(id: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('eliminar-usuario', {
        body: { usuario_id: id },
      })
      if (!error && data?.ok) {
        return
      }
      if (data?.error) {
        throw new Error(data.error)
      }
      if (error) {
        if ('context' in error && error.context) {
          try {
            const body = await (error.context as Response).json()
            if (body?.error) throw new Error(body.error)
          } catch (jsonErr) {
            if (jsonErr instanceof Error && jsonErr.message !== error.message) {
              throw jsonErr
            }
          }
        }
        throw error
      }
    } catch (edgeError) {
      const msg = edgeError instanceof Error ? edgeError.message : String(edgeError)
      if (msg.includes('No puedes eliminar') || msg.includes('No se puede eliminar')) {
        throw edgeError
      }

      // Fallback a RPC en caso de indisponibilidad del servicio de Edge Functions
      const { error: rpcError } = await supabase.rpc('fn_eliminar_usuario', {
        p_usuario_id: id,
      })
      if (rpcError) {
        if (
          rpcError.code === '23503' ||
          rpcError.message.includes('foreign_key_violation') ||
          rpcError.message.includes('registros históricos')
        ) {
          throw new Error(
            'No se puede eliminar este usuario porque tiene registros históricos de ventas, turnos de caja o gastos asociados. Para impedir su acceso, desactívalo usando el icono de apagar.',
          )
        }
        throw new Error(rpcError.message || 'No se pudo eliminar el usuario.')
      }
    }
  },
}

