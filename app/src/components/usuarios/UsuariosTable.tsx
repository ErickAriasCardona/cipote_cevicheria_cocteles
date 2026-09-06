import { useState } from 'react'
import type { Rol } from '../../types/auth'
import type { UsuarioPerfil } from '../../types/usuario'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface UsuariosTableProps {
  usuarios: UsuarioPerfil[]
  /** id del usuario de la sesión activa (useSession), para reforzar el
   * mensaje de confirmación cuando el Administrador se edita a sí mismo. */
  usuarioActualId: string | null
  onCambiarRol: (id: string, rol: Rol) => void
  onCambiarActivo: (id: string, activo: boolean) => void
}

const ROLES: Rol[] = ['administrador', 'cajero']

const ETIQUETAS_ROL: Record<Rol, string> = {
  administrador: 'Administrador',
  cajero: 'Cajero',
}

interface FilaUsuarioProps {
  usuario: UsuarioPerfil
  esUsuarioActual: boolean
  onCambiarRol: UsuariosTableProps['onCambiarRol']
  onCambiarActivo: UsuariosTableProps['onCambiarActivo']
}

function FilaUsuario({ usuario, esUsuarioActual, onCambiarRol, onCambiarActivo }: FilaUsuarioProps) {
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
    const siguienteActivo = !usuario.activo
    let mensaje = siguienteActivo
      ? `¿Confirmas activar a ${usuario.nombreCompleto}?`
      : `¿Confirmas desactivar a ${usuario.nombreCompleto}?`
    if (esUsuarioActual && !siguienteActivo) {
      mensaje += ' Vas a desactivar tu propio usuario; perderás acceso de inmediato.'
    }
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Activar usuario' : 'Desactivar usuario',
      mensaje,
      textoConfirmar: siguienteActivo ? 'Activar' : 'Desactivar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(usuario.id, siguienteActivo)
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
        <StatusPill variant={usuario.activo ? 'positive' : 'destructive'}>
          {usuario.activo ? 'Activo' : 'Inactivo'}
        </StatusPill>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <Button
          type="button"
          variant={usuario.activo ? 'destructive' : 'activate'}
          size="sm"
          onClick={handleCambiarActivo}
        >
          {usuario.activo ? 'Desactivar' : 'Activar'}
        </Button>
      </td>
    </tr>
  )
}

export function UsuariosTable({
  usuarios,
  usuarioActualId,
  onCambiarRol,
  onCambiarActivo,
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
            <th style={{ padding: '10px 12px' }}>Rol</th>
            <th style={{ padding: '10px 12px' }}>Estado</th>
            <th style={{ padding: '10px 12px' }}>Acciones</th>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
