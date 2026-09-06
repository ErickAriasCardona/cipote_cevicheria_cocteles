import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession'
import { authService } from '../../services/authService'
import { useTheme } from '../../theme/useTheme'
import { Tabs } from '../ui/Tabs'
import type { TabItem } from '../ui/Tabs'

const CAJERO_TABS: TabItem[] = [
  { to: '/cajero', label: 'Panel Cajero', end: true },
  { to: '/cajero/venta', label: 'POS de Ventas' },
  { to: '/cajero/transferencias', label: 'Transferencias' },
  { to: '/cajero/cierre', label: 'Cierre de caja' },
]

const ADMIN_TABS: TabItem[] = [
  { to: '/administrador', label: 'Panel', end: true },
  { to: '/administrador/usuarios', label: 'Usuarios' },
  { to: '/administrador/productos', label: 'Productos' },
  { to: '/administrador/insumos', label: 'Insumos' },
  { to: '/administrador/receta', label: 'Receta' },
  { to: '/administrador/ventas', label: 'Ventas' },
  { to: '/administrador/cierres-caja', label: 'Cierres de caja' },
  { to: '/administrador/gastos', label: 'Gastos' },
  { to: '/administrador/reportes-ventas', label: 'Reportes' },
]

export interface AppShellProps {
  children: ReactNode
  hideTabs?: boolean
  rol?: string
}

export function AppShell({ children, hideTabs = false, rol }: AppShellProps) {
  const { usuario } = useSession()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await authService.cerrarSesion()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const rolEfectivo = rol || usuario?.rol
  const roleHome = rolEfectivo === 'administrador' ? '/administrador' : '/cajero'
  const tabs = rolEfectivo === 'administrador' ? ADMIN_TABS : CAJERO_TABS

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Orbes de fondo Liquid Glass */}
      <div
        style={{
          position: 'fixed',
          top: -90,
          right: -90,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'var(--orb1-color)',
          opacity: 'var(--orb1-opacity)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
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
          zIndex: 0,
        }}
      />

      {/* Contenido principal en capa superior */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 1240,
          width: '100%',
          margin: '0 auto',
          padding: '24px 28px 48px',
          boxSizing: 'border-box',
        }}
      >
        {/* Cabecera persistente */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <Link
            to={usuario ? roleHome : '/'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textDecoration: 'none',
            }}
          >
            <img
              src="/logo.jpeg"
              alt="Logo Cipote"
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--brand-font)',
                fontSize: 22,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              Cipote Ceviche Cocteles
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {usuario && (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    lineHeight: 1.25,
                    marginRight: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--sans)',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {usuario.nombreCompleto || usuario.email}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--sans)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {usuario.rol === 'administrador' ? 'Administrador' : 'Cajero'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--sans)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                    background: 'var(--input-bg)',
                    boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Salir
                </button>
              </>
            )}

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
              {theme === 'light' ? '☾' : '☀'}
            </button>
          </div>
        </header>

        {/* Barra de pestañas secundarias por rol */}
        {usuario && !hideTabs && <Tabs items={tabs} />}

        {/* Vista activa */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
      </div>
    </div>
  )
}
