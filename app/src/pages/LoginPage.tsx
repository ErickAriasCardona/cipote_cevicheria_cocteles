import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import { GlassCard } from '../components/ui/GlassCard'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useTheme } from '../theme/useTheme'
import { IconoLuna, IconoSol } from '../components/ui/IconoTema'

type ModoLogin = 'login' | 'solicitar_recuperacion' | 'restablecer_password'

/**
 * Formulario de inicio de sesión y recuperación de contraseña (BD-01.4).
 * Tras un login exitoso, resuelve el rol desde usuarios_perfil y redirige
 * a la ruta base de ese rol; AppRouter + guards se encargan del resto.
 *
 * Integra:
 *  1. Verificación obligatoria de confirmación de correo.
 *  2. Solicitud de restablecimiento de contraseña vía Resend / Supabase Auth.
 *  3. Establecimiento de nueva contraseña con token de recuperación.
 */
export function LoginPage() {
  const [modo, setModo] = useState<ModoLogin>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Estados para recuperación
  const [recuperarEmail, setRecuperarEmail] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const correoConfirmado =
    searchParams.get('confirmed') === 'true' ||
    location.hash.includes('type=signup')

  // Detectar si el usuario llega mediante enlace de recuperación de contraseña o error de OTP
  useEffect(() => {
    if (location.hash.includes('otp_expired') || location.hash.includes('error_code=otp_expired')) {
      if (location.hash.includes('recovery')) {
        setError('El enlace de restablecimiento ha expirado o ya fue utilizado. Por favor solicita uno nuevo.')
      } else {
        setMensajeExito('Tu correo electrónico ya ha sido procesado o verificado. Si tu cuenta está activa, ya puedes iniciar sesión.')
      }
    } else if (
      searchParams.get('recovery') === 'true' ||
      location.hash.includes('type=recovery')
    ) {
      setModo('restablecer_password')
      setError(null)
      setMensajeExito(null)
    }

    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setModo('restablecer_password')
        setError(null)
        setMensajeExito(null)
      }
    })

    return () => {
      authSub.subscription.unsubscribe()
    }
  }, [location, searchParams])

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMensajeExito(null)
    setEnviando(true)
    try {
      const { user } = await authService.iniciarSesion(email, password)
      if (!user) throw new Error('No se pudo iniciar sesión.')

      // Verificación estricta: Correo electrónico confirmado
      if (!user.email_confirmed_at) {
        await authService.cerrarSesion()
        throw new Error(
          'Tu correo electrónico aún no ha sido confirmado. Revisa el enlace de activación enviado a tu bandeja de entrada o spam antes de ingresar.',
        )
      }

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
      let mensaje = err instanceof Error ? err.message : 'Error al iniciar sesión.'
      const lower = mensaje.toLowerCase()
      if (lower.includes('email not confirmed') || lower.includes('correo no confirmado')) {
        mensaje =
          'Tu correo electrónico aún no ha sido confirmado. Por favor revisa el email de activación enviado a tu bandeja de entrada o spam antes de ingresar.'
      } else if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
        mensaje = 'Correo electrónico o contraseña incorrectos. Verifica tus credenciales.'
      }
      setError(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  async function handleSolicitarRecuperacion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMensajeExito(null)
    setEnviando(true)

    try {
      const targetEmail = recuperarEmail.trim().toLowerCase()
      if (!targetEmail || !targetEmail.includes('@')) {
        throw new Error('Por favor ingresa un correo electrónico válido.')
      }

      await authService.solicitarRecuperacion(targetEmail)
      setMensajeExito(
        '¡Enlace enviado! Hemos enviado las instrucciones para restablecer tu contraseña. Por favor revisa tu bandeja de entrada o spam.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo de recuperación.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleRestablecerPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMensajeExito(null)

    if (nuevaPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica ambos campos.')
      return
    }

    setEnviando(true)
    try {
      await authService.actualizarContrasena(nuevaPassword)
      setMensajeExito('¡Contraseña actualizada con éxito! Ya puedes iniciar sesión con tu nueva clave.')
      setModo('login')
      setPassword('')
      setNuevaPassword('')
      setConfirmarPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.')
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
          {theme === 'light' ? <IconoLuna /> : <IconoSol />}
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

        {/* Título dinámico según el modo */}
        <h1
          style={{
            margin: '0 0 20px',
            fontSize: 23,
            fontWeight: 800,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)',
          }}
        >
          {modo === 'login' && 'Iniciar sesión'}
          {modo === 'solicitar_recuperacion' && 'Recuperar contraseña'}
          {modo === 'restablecer_password' && 'Restablecer contraseña'}
        </h1>

        {/* Banner de correo verificado */}
        {correoConfirmado && modo === 'login' && (
          <div
            role="status"
            style={{
              margin: '0 0 20px',
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(46, 158, 91, 0.12)',
              border: '1px solid rgba(46, 158, 91, 0.35)',
              color: 'var(--green-text, #2e9e5b)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
            <div>
              <strong style={{ display: 'block', marginBottom: 2 }}>¡Correo verificado con éxito!</strong>
              Tu cuenta ha sido activada correctamente. Ingresa tu correo y contraseña para acceder.
            </div>
          </div>
        )}

        {/* Mensaje de éxito dinámico */}
        {mensajeExito && (
          <div
            role="status"
            style={{
              margin: '0 0 20px',
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(46, 158, 91, 0.12)',
              border: '1px solid rgba(46, 158, 91, 0.35)',
              color: 'var(--green-text, #2e9e5b)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>✨</span>
            <div>{mensajeExito}</div>
          </div>
        )}

        {/* Mensaje de error general */}
        {error && (
          <p
            role="alert"
            style={{
              margin: '0 0 16px',
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(228, 41, 38, 0.08)',
              border: '1px solid rgba(228, 41, 38, 0.25)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--red-text, #E42926)',
              textAlign: 'left',
            }}
          >
            {error}
          </p>
        )}

        {/* MODO 1: INICIO DE SESIÓN */}
        {modo === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ textAlign: 'left' }}>
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

            <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setMensajeExito(null)
                  setRecuperarEmail(email)
                  setModo('solicitar_recuperacion')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--brand-blue, #41AFE0)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={enviando}
              style={{ marginTop: 4 }}
            >
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        )}

        {/* MODO 2: SOLICITAR RECUPERACIÓN */}
        {modo === 'solicitar_recuperacion' && (
          <form onSubmit={handleSolicitarRecuperacion} style={{ textAlign: 'left' }}>
            <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>

            <Input
              id="recuperarEmail"
              type="email"
              label="Correo electrónico"
              placeholder="tu-correo@cipote.com"
              value={recuperarEmail}
              onChange={(e) => setRecuperarEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={enviando}
              style={{ marginTop: 14 }}
            >
              {enviando ? 'Enviando enlace…' : 'Enviar enlace de recuperación'}
            </Button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setMensajeExito(null)
                  setModo('login')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}

        {/* MODO 3: RESTABLECER CONTRASEÑA */}
        {modo === 'restablecer_password' && (
          <form onSubmit={handleRestablecerPassword} style={{ textAlign: 'left' }}>
            <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Crea tu nueva contraseña. Debe tener al menos 6 caracteres.
            </p>

            <Input
              id="nuevaPassword"
              type="password"
              label="Nueva contraseña"
              placeholder="Mínimo 6 caracteres"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />

            <Input
              id="confirmarPassword"
              type="password"
              label="Confirmar nueva contraseña"
              placeholder="Repite la contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={enviando}
              style={{ marginTop: 14 }}
            >
              {enviando ? 'Guardando…' : 'Guardar nueva contraseña'}
            </Button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setMensajeExito(null)
                  setModo('login')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Cancelar y volver al login
              </button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  )
}
