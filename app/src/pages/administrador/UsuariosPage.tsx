import { useCallback, useEffect, useState } from 'react'
import { UsuarioCrearModal } from '../../components/usuarios/UsuarioCrearModal'
import { UsuariosTable } from '../../components/usuarios/UsuariosTable'
import { useSession } from '../../hooks/useSession'
import { usuariosService } from '../../services/usuariosService'
import type { Rol } from '../../types/auth'
import type { CrearUsuarioInput, UsuarioPerfil } from '../../types/usuario'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

/**
 * Pantalla de gestión de usuarios y roles (BD-01.5, RF-01.1/HU-01.1).
 * Exclusiva del Administrador — el enrutamiento ya lo garantiza vía
 * AuthGuard + RoleGuard(['administrador']) en AppRouter.tsx.
 */
export function UsuariosPage() {
  const { usuario: usuarioSesion } = useSession()
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mostrarCrearUsuario, setMostrarCrearUsuario] = useState(false)

  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await usuariosService.listarUsuarios()
      setUsuarios(lista)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el listado de usuarios.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  async function handleCrear(input: CrearUsuarioInput) {
    await usuariosService.crearUsuario(input)
    await cargarUsuarios()
  }

  async function handleCambiarRol(id: string, rol: Rol) {
    await usuariosService.actualizarUsuario(id, { rol })
    await cargarUsuarios()
  }

  async function handleCambiarActivo(id: string, activo: boolean) {
    if (id === usuarioSesion?.usuarioId) {
      setError('No puedes cambiar el estado de tu propia cuenta de usuario.')
      return
    }
    setError(null)
    try {
      await usuariosService.actualizarUsuario(id, { activo })
      await cargarUsuarios()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado del usuario.')
    }
  }

  async function handleEliminarUsuario(id: string) {
    setError(null)
    try {
      await usuariosService.eliminarUsuario(id)
      await cargarUsuarios()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.')
    }
  }

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Gestión de Usuarios
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Administra los roles y accesos del personal en el sistema POS.
          </p>
        </div>

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        <GlassCard padding={20}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Usuarios Registrados</h3>
            <button
              type="button"
              onClick={() => setMostrarCrearUsuario(true)}
              title="Nuevo usuario"
              style={{
                background: 'rgba(65, 175, 224, 0.12)',
                border: '1px solid rgba(65, 175, 224, 0.3)',
                color: 'var(--brand-blue)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 8,
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              + Nuevo usuario
            </button>
          </div>
          {cargando ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando usuarios…</p>
          ) : (
            <UsuariosTable
              usuarios={usuarios}
              usuarioActualId={usuarioSesion?.usuarioId ?? null}
              onCambiarRol={handleCambiarRol}
              onCambiarActivo={handleCambiarActivo}
              onEliminar={handleEliminarUsuario}
            />
          )}
        </GlassCard>

        <UsuarioCrearModal
          abierto={mostrarCrearUsuario}
          onCerrar={() => setMostrarCrearUsuario(false)}
          onCrear={handleCrear}
        />
      </div>
    </AppShell>
  )
}
