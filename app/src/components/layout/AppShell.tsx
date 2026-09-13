import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession'
import { authService } from '../../services/authService'
import { useTheme } from '../../theme/useTheme'
import { Tabs } from '../ui/Tabs'
import type { TabItem } from '../ui/Tabs'
import { IconoLuna, IconoSol } from '../ui/IconoTema'
import { NavDrawer } from './NavDrawer'

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
  { to: '/administrador/inventario', label: 'Inventario' },
  { to: '/administrador/receta', label: 'Receta' },
  { to: '/administrador/ventas', label: 'Ventas' },
  { to: '/administrador/cierres-caja', label: 'Cierres de caja' },
  { to: '/administrador/gastos', label: 'Gastos' },
  { to: '/administrador/reportes-ventas', label: 'Reportes' },
]

function IconoSalir() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export interface AppShellProps {
  children: ReactNode
  hideTabs?: boolean
  rol?: string
}

export function AppShell({ children, hideTabs = false, rol }: AppShellProps) {
  const { usuario } = useSession()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

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
          maxWidth: 1380,
          width: '100%',
          margin: '0 auto',
          padding: '24px 28px 48px',
          boxSizing: 'border-box',
        }}
      >
        {/* Navbar unificado: logo+marca, navegación, usuario y acciones en una sola barra.
        Requisito explícito de Erick (ticket 2026-09-12): NUNCA debe hacer wrap a una
        segunda fila, sin importar cuántas tabs tenga el rol activo. Por eso el
        contenedor raíz usa flexWrap: 'nowrap' -- si el conjunto completo no cabe, es
        el bloque de Tabs (flex: '1 1 auto', minWidth: 0) el que se encoge y absorbe el
        overflow con scroll horizontal (ver Tabs.tsx), mientras logo/usuario/iconos
        conservan su tamaño y quedan siempre visibles en los extremos. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: 16,
            marginBottom: 20,
            padding: '12px 20px',
            borderRadius: 18,
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
          }}
        >
          <Link
            to={usuario ? roleHome : '/'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textDecoration: 'none',
              flexShrink: 0,
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
              className="navbar-brand-text"
              style={{
                fontFamily: 'var(--brand-font)',
                fontSize: 22,
                color: 'var(--text-primary)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              Cipote Ceviche Cocteles
            </span>
          </Link>

          {/* Bloque de escritorio: tabs + usuario + logout + toggle de tema.
          Ticket responsive 2026-09-12 (tarea 1): en tablet/mobile (<=1024px,
          ver .navbar-desktop-content / .navbar-hamburger-btn en index.css)
          este bloque completo se oculta y en su lugar solo queda visible el
          botón de hamburguesa de más abajo -- toda esta información pasa al
          <NavDrawer/>. En desktop no cambia nada respecto al comportamiento
          previo. */}
          <div
            className="navbar-desktop-content"
            style={{ alignItems: 'center', gap: 16, flex: '1 1 auto', minWidth: 0 }}
          >
            {usuario && !hideTabs ? (
              // minWidth distinto de 0: si logo+usuario+iconos ya consumen casi
              // todo el ancho disponible, este bloque cede espacio pero nunca
              // llega a colapsar a 0px -- siempre queda una franja scrolleable
              // con al menos una tab visible (ver también las reglas
              // responsive de marca/usuario en index.css que le dan más
              // espacio a este bloque en pantallas angostas).
              <div style={{ flex: '1 1 auto', minWidth: 72 }}>
                <Tabs items={tabs} />
              </div>
            ) : (
              <div style={{ flex: '1 1 auto' }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {usuario && (
                <div
                  className="navbar-name-col"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    lineHeight: 1.25,
                    maxWidth: 160,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--sans)',
                      letterSpacing: '-0.2px',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {usuario.nombreCompleto || usuario.email}
                  </span>
                  <span
                    className="navbar-user-role"
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
              )}

              {usuario && (
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Salir"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <IconoSalir />
                </button>
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
                {theme === 'light' ? <IconoLuna /> : <IconoSol />}
              </button>
            </div>
          </div>

          {/* Botón de hamburguesa: solo visible en tablet/mobile (<=1024px).
          Abre <NavDrawer/> con todo lo que el bloque de arriba oculta a ese
          ancho. */}
          <button
            type="button"
            className="navbar-hamburger-btn"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú de navegación"
            aria-haspopup="dialog"
            aria-expanded={menuAbierto}
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

        {/* Vista activa */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
      </div>

      {usuario && (
        <NavDrawer
          abierto={menuAbierto}
          onCerrar={() => setMenuAbierto(false)}
          tabs={tabs}
          nombreUsuario={usuario.nombreCompleto || usuario.email}
          rolEtiqueta={usuario.rol === 'administrador' ? 'Administrador' : 'Cajero'}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  )
}
