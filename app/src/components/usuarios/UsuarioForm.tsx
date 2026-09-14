import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Rol } from '../../types/auth'
import type { CrearUsuarioInput } from '../../types/usuario'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

interface UsuarioFormProps {
  onCrear: (input: CrearUsuarioInput) => Promise<void>
}

const ROLES: Rol[] = ['administrador', 'cajero']

/**
 * Formulario de alta de usuario (BD-01.5, RF-01.1/HU-01.1).
 */
export function UsuarioForm({ onCrear }: UsuarioFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Rol>('cajero')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const ok = await confirmar({
      titulo: 'Crear usuario',
      mensaje: `¿Confirmas crear el usuario "${nombreCompleto}" (${email}) con rol ${
        rol === 'administrador' ? 'Administrador' : 'Cajero'
      }?`,
      textoConfirmar: 'Crear usuario',
    })
    if (!ok) return
    setEnviando(true)
    try {
      await onCrear({ nombreCompleto, email, password, rol })
      setNombreCompleto('')
      setEmail('')
      setPassword('')
      setRol('cajero')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <GlassCard
      padding="28px 30px"
      style={{
        background: 'var(--modal-bg)',
        border: '1px solid var(--modal-border)',
        boxShadow: 'var(--modal-shadow)',
        borderRadius: 20,
        marginBottom: 28,
      }}
    >
      <h2
        style={{
          margin: '0 0 18px',
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        Nuevo usuario
      </h2>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            alignItems: 'end',
          }}
        >
          <Input
            id="nombre_completo"
            label="Nombre completo"
            placeholder="Ej: Laura Gómez"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            required
          />

          <Input
            id="email"
            type="email"
            label="Correo electrónico"
            placeholder="usuario@cipote.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            type="password"
            label="Contraseña temporal"
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Select
            id="rol"
            label="Rol asignado"
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
          >
            {ROLES.map((valor) => (
              <option key={valor} value={valor}>
                {valor === 'administrador' ? 'Administrador' : 'Cajero'}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              margin: '8px 0 12px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--red-text)',
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Button type="submit" variant="primary" disabled={enviando}>
            {enviando ? 'Creando…' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
