import { useState } from 'react'
import type { Rol } from '../../types/auth'
import type { UsuarioPerfil } from '../../types/usuario'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'

interface UsuariosTableProps {
  usuarios: UsuarioPerfil[]
  /** id del usuario de la sesión activa (useSession), para reforzar el
   * mensaje de confirmación cuando el Administrador se edita a sí mismo. */
  usuarioActualId: string | null
  onCambiarRol: (id: string, rol: Rol) => void
  onCambiarActivo: (id: string, activo: boolean) => void
  onEliminar: (id: string, nombre: string) => Promise<void>
}

const ROLES: Rol[] = ['administrador', 'cajero']

const ETIQUETAS_ROL: Record<Rol, string> = {
  administrador: 'Administrador',
  cajero: 'Cajero',
}

function IconoPower({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function IconoTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

interface FilaUsuarioProps {
  usuario: UsuarioPerfil
  esUsuarioActual: boolean
  onCambiarRol: UsuariosTableProps['onCambiarRol']
  onCambiarActivo: UsuariosTableProps['onCambiarActivo']
  onEliminar: UsuariosTableProps['onEliminar']
}

function FilaUsuario({ usuario, esUsuarioActual, onCambiarRol, onCambiarActivo, onEliminar }: FilaUsuarioProps) {
  const { confirmar } = useConfirmacion()
  const [rol, setRol] = useState<Rol>(usuario.rol)

  async function handleGuardarRol() {
    let mensaje = `¿Confirmas cambiar el rol de ${usuario.nombreCompleto} de ${ETIQUETAS_ROL[usuario.rol]} a ${ETIQUETAS_ROL[rol]}?`
    if (esUsuarioActual) {
      mensaje += ' Vas a cambiar tu propio rol; perderás acceso de Administrador de inmediato.'
    }
    const ok = await confirmar({
      titulo: 'Cambiar rol',
      mensaje,
      textoConfirmar: 'Cambiar rol',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    onCambiarRol(usuario.id, rol)
  }

  async function handleCambiarActivo() {
    if (esUsuarioActual) return
    const siguienteActivo = !usuario.activo
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Activar usuario' : 'Desactivar usuario',
      mensaje: siguienteActivo
        ? `¿Confirmas reactivar al usuario "${usuario.nombreCompleto}"? Podrá iniciar sesión nuevamente.`
        : `¿Confirmas desactivar al usuario "${usuario.nombreCompleto}"? No podrá iniciar sesión en el sistema.`,
      textoConfirmar: siguienteActivo ? 'Activar' : 'Desactivar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(usuario.id, siguienteActivo)
  }

  async function handleEliminar() {
    const ok = await confirmar({
      titulo: 'Eliminar usuario',
      mensaje: `¿Confirmas eliminar permanentemente al usuario "${usuario.nombreCompleto}"? Esta acción borrará sus credenciales de acceso. Si el usuario tiene registros históricos (ventas, turnos o gastos), el sistema protegerá la información contable.`,
      textoConfirmar: 'Eliminar usuario',
      varianteConfirmar: 'destructive',
    })
    if (!ok) return
    await onEliminar(usuario.id, usuario.nombreCompleto)
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--hr-line)' }}>
      <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{usuario.nombreCompleto}</span>
          {esUsuarioActual && (
            <span style={{ fontSize: 11, color: 'var(--brand-blue)', fontWeight: 700 }}>
              (Tú)
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '14px 12px', fontSize: 12.5 }}>
        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
          {usuario.email || '—'}
        </span>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12.5,
              color: 'var(--text-primary)',
              fontFamily: 'var(--sans)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {ROLES.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_ROL[valor]}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant={rol !== usuario.rol ? 'blue' : 'secondary'}
            size="sm"
            onClick={handleGuardarRol}
            disabled={rol === usuario.rol}
          >
            Guardar rol
          </Button>
        </div>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <button
          type="button"
          disabled={esUsuarioActual}
          className={`btn-estado-toggle ${usuario.activo ? 'activo' : 'inactivo'}`}
          onClick={handleCambiarActivo}
          title={
            esUsuarioActual
              ? 'No puedes cambiar el estado de tu propia cuenta de usuario'
              : usuario.activo
              ? `Desactivar usuario "${usuario.nombreCompleto}" (apagar)`
              : `Activar usuario "${usuario.nombreCompleto}" (encender)`
          }
        >
          <IconoPower size={13} />
          <span>{usuario.activo ? 'Activo' : 'Inactivo'}</span>
        </button>
      </td>
      <td style={{ padding: '14px 12px', width: 70 }}>
        {/* Botón Eliminar (Trash) - Validado: no permitir eliminar al usuario actual */}
        {esUsuarioActual ? (
          <button
            type="button"
            disabled
            title="No puedes eliminar tu propia cuenta de administrador"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid var(--border-soft)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-faint)',
              cursor: 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.35,
            }}
          >
            <IconoTrash />
          </button>
        ) : (
          <button
            type="button"
            title={`Eliminar usuario "${usuario.nombreCompleto}"`}
            onClick={handleEliminar}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <IconoTrash />
          </button>
        )}
      </td>
    </tr>
  )
}

export function UsuariosTable({
  usuarios,
  usuarioActualId,
  onCambiarRol,
  onCambiarActivo,
  onEliminar,
}: UsuariosTableProps) {
  if (usuarios.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '16px 0', fontSize: 14 }}>
        Todavía no hay usuarios registrados.
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr
            style={{
              borderBottom: '2px solid var(--hr-line)',
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: 'var(--text-faint)',
            }}
          >
            <th style={{ padding: '10px 12px' }}>Nombre</th>
            <th style={{ padding: '10px 12px' }}>Correo Electrónico</th>
            <th style={{ padding: '10px 12px' }}>Rol</th>
            <th style={{ padding: '10px 12px', width: 110 }}>Estado</th>
            <th style={{ padding: '10px 12px', width: 70 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <FilaUsuario
              key={usuario.id}
              usuario={usuario}
              esUsuarioActual={usuario.id === usuarioActualId}
              onCambiarRol={onCambiarRol}
              onCambiarActivo={onCambiarActivo}
              onEliminar={onEliminar}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

