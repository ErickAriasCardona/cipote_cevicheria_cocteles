import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import { GlassCard } from '../components/ui/GlassCard'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useTheme } from '../theme/useTheme'

/**
 * Formulario de inicio de sesión (BD-01.4).
 * Tras un login exitoso, resuelve el rol desde usuarios_perfil y redirige
 * a la ruta base de ese rol; AppRouter + guards se encargan del resto.
 */
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const { user } = await authService.iniciarSesion(email, password)
      if (!user) throw new Error('No se pudo iniciar sesión.')

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios_perfil')
        .select('rol, activo')
        .eq('id', user.id)
        .single()

      if (perfilError || !perfil) throw new Error('No se encontró el perfil del usuario.')
      if (!perfil.activo) {
        await authService.cerrarSesion()
        throw new Error('Este usuario está desactivado. Contacta al Administrador.')
      }

      navigate(perfil.rol === 'administrador' ? '/administrador' : '/cajero', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Orbes de fondo Liquid Glass */}
      <div
        style={{
          position: 'fixed',
          top: -90,
          right: -90,
          width: 440,
          height: 440,
          borderRadius: '50%',
          background: 'var(--orb1-color)',
          opacity: 'var(--orb1-opacity)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -100,
          left: -80,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'var(--orb2-color)',
          opacity: 'var(--orb2-opacity)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* Botones superiores de navegación y tema */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          right: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-secondary)',
          }}
        >
          ← Volver a la página principal
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid var(--tabs-wrap-border)',
            background: 'var(--sheen), var(--tabs-wrap-bg)',
            color: 'var(--text-primary)',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
          }}
        >
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </div>

      <GlassCard
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '44px 38px',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <img
          src="/logo.jpeg"
          alt="Cipote Logo"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 8px 22px rgba(0, 0, 0, 0.25)',
            marginBottom: 16,
          }}
        />
        <div
          style={{
            fontFamily: 'var(--brand-font)',
            fontSize: 26,
            color: 'var(--text-primary)',
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          Cipote Ceviche Cocteles
        </div>
        <h1
          style={{
            margin: '0 0 24px',
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)',
          }}
        >
          Iniciar sesión
        </h1>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <Input
            id="email"
            type="email"
            label="Correo"
            placeholder="correo@cipote.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <p
              role="alert"
              style={{
                margin: '10px 0 16px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--red-text)',
              }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={enviando}
            style={{ marginTop: 12 }}
          >
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--hr-line)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                color: 'var(--text-faint)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Credenciales de prueba rápida:
            </span>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin.prueba@cipote.test')
                  setPassword('Cipote-Admin-2026!')
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(65, 175, 224, 0.3)',
                  background: 'rgba(65, 175, 224, 0.1)',
                  color: 'var(--brand-blue)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Admin (demo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('cajero.prueba@cipote.test')
                  setPassword('Cipote-Cajero-2026!')
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(46, 158, 91, 0.3)',
                  background: 'rgba(46, 158, 91, 0.1)',
                  color: 'var(--green-text)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Cajero (demo)
              </button>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

