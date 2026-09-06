import { useCallback, useEffect, useState } from 'react'
import { UsuarioForm } from '../../components/usuarios/UsuarioForm'
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
    await usuariosService.actualizarUsuario(id, { activo })
    await cargarUsuarios()
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

        <UsuarioForm onCrear={handleCrear} />

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        <GlassCard padding={20}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
            Usuarios Registrados
          </h3>
          {cargando ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando usuarios…</p>
          ) : (
            <UsuariosTable
              usuarios={usuarios}
              usuarioActualId={usuarioSesion?.usuarioId ?? null}
              onCambiarRol={handleCambiarRol}
              onCambiarActivo={handleCambiarActivo}
            />
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
