import { Link } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'

function IconoCandado() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

/**
 * Página destino de RoleGuard cuando el rol activo no tiene acceso a la ruta (RN-001/RN-002).
 */
export function NoAutorizadoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(228,41,38,0.18) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <GlassCard tint="red" padding={36} style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(228,41,38,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--brand-red)',
            border: '1px solid rgba(228,41,38,0.25)',
          }}
        >
          <IconoCandado />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--brand-red)' }}>
          Acceso no autorizado
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Tu rol de usuario actual no tiene los permisos requeridos para acceder a este módulo.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md">
              Volver al inicio de sesión
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
