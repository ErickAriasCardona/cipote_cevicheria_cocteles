import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../../hooks/useSession'
import { useTheme } from '../../theme/useTheme'
import { useCarrito } from '../../hooks/useCarrito'
import { IconoLuna, IconoSol } from '../ui/IconoTema'

function IconoCarrito() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function IconoPOS() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function IconoCerrar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const NAV_LINKS = [
  { href: '#hero', label: 'Inicio' },
  { href: '#menu', label: 'Favoritos' },
  { href: '#feature', label: 'Especiales' },
  { href: '#pedir', label: 'Cómo pedir' },
  { href: '#contacto', label: 'Contacto' },
]

export function LandingNav() {
  const { usuario } = useSession()
  const { theme, toggleTheme } = useTheme()
  const { totalCount, toggleDrawer } = useCarrito()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const roleHome = usuario?.rol === 'administrador' ? '/administrador' : '/cajero'

  return (
    <header className="landing-nav-header">
      <div className="landing-nav-inner">
        {/* Logo y Marca Oficial */}
        <a
          href="#hero"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.jpeg"
            alt="Logo Cipote"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              flexShrink: 0,
            }}
          />
          <span className="landing-nav-brand-text">
            <span className="landing-brand-full">Cipote Ceviche Cocteles</span>
            <span className="landing-brand-short">Cipote</span>
          </span>
        </a>

        {/* Navegación Desktop */}
        <div className="landing-nav-desktop">
          {/* Enlaces estilo pill tabs */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--tabs-wrap-bg)',
              border: '1px solid var(--tabs-wrap-border)',
              borderRadius: 999,
              padding: 4,
            }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.background = 'var(--sec-active-bg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Acciones derecha: Carrito, POS / Login, Tema */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Botón de Carrito con Contador Dinámico */}
            <button
              type="button"
              onClick={toggleDrawer}
              title="Ver pedido"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid var(--input-border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
                transition: 'transform 0.15s ease, background 0.15s ease',
              }}
            >
              <IconoCarrito />
              <span>Pedido</span>
              {totalCount > 0 && (
                <span
                  style={{
                    background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
                    color: '#fff',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    minWidth: 20,
                    height: 20,
                    padding: '0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(228, 41, 38, 0.4)',
                  }}
                >
                  {totalCount}
                </span>
              )}
            </button>

            {/* Acceso POS / Panel */}
            <Link
              to={usuario ? roleHome : '/login'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid var(--input-border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
                transition: 'all 0.15s ease',
              }}
              title={usuario ? `Ir al panel de ${usuario.rol}` : 'Acceso al punto de venta (POS)'}
            >
              <IconoPOS />
              <span>{usuario ? 'Panel' : 'POS'}</span>
            </Link>

            {/* Conmutador de Tema Claro / Oscuro */}
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
                transition: 'all 0.15s ease',
              }}
            >
              {theme === 'light' ? <IconoLuna /> : <IconoSol />}
            </button>
          </div>
        </div>

        {/* Botones de Carrito y Menú para Tablet / Móvil */}
        <div className="landing-nav-mobile-actions">
          {/* Carrito en móvil para acceso rápido */}
          <button
            type="button"
            onClick={toggleDrawer}
            title="Ver pedido"
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              borderRadius: 12,
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
            }}
          >
            <IconoCarrito />
            {totalCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  minWidth: 18,
                  height: 18,
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(228, 41, 38, 0.4)',
                }}
              >
                {totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú de navegación"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Drawer Móvil */}
      {menuAbierto && (
        <div
          role="presentation"
          onClick={() => setMenuAbierto(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--modal-overlay)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1100,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú móvil"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(320px, 86vw)',
              background: 'var(--screen-bg)',
              borderLeft: '1px solid var(--input-border)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.25)',
              animation: 'drawerIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/logo.jpeg" alt="Logo Cipote" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ fontFamily: 'var(--brand-font)', fontSize: 18, color: 'var(--text-primary)' }}>
                  Cipote
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconoCerrar />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuAbierto(false)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20, borderTop: '1px solid var(--hr-line)' }}>
              <Link
                to={usuario ? roleHome : '/login'}
                onClick={() => setMenuAbierto(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  borderRadius: 12,
                  background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(228, 41, 38, 0.35)',
                }}
              >
                <IconoPOS />
                <span>{usuario ? 'Ir al Panel' : 'Ingresar al POS'}</span>
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px',
                  borderRadius: 12,
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {theme === 'light' ? <IconoLuna /> : <IconoSol />}
                <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
