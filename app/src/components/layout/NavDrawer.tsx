import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import type { TabItem } from '../ui/Tabs'
import { IconoLuna, IconoSol } from '../ui/IconoTema'

function IconoSalir() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconoCerrarX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export interface NavDrawerProps {
  abierto: boolean
  onCerrar: () => void
  tabs: TabItem[]
  nombreUsuario?: string
  rolEtiqueta?: string
  onLogout: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

/**
 * Menú de navegación para tablet/mobile (ticket responsive 2026-09-12, tarea 1).
 *
 * En pantallas angostas el navbar de AppShell.tsx deja de mostrar tabs +
 * usuario + logout + toggle de tema en la barra -- solo queda logo + este
 * botón de hamburguesa. Al abrirse, este panel deslizante (desde la derecha,
 * mismo lado que CartDrawer.tsx en la landing) muestra todo lo que dejó de
 * caber en la barra, organizado en una lista vertical clara.
 *
 * Sigue el mismo patrón de accesibilidad ya usado en los modales del proyecto
 * (ConfirmDialog.tsx, UsuarioCrearModal.tsx): overlay con
 * var(--modal-overlay) + backdropFilter blur(6px) que cierra al hacer click,
 * panel con role="dialog"/aria-modal, cierre con Escape, foco inicial en el
 * botón de cerrar.
 */
export function NavDrawer({
  abierto,
  onCerrar,
  tabs,
  nombreUsuario,
  rolEtiqueta,
  onLogout,
  theme,
  onToggleTheme,
}: NavDrawerProps) {
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierto) return
    cerrarRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrar()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      role="presentation"
      onClick={onCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(320px, 85vw)',
          background: 'var(--modal-bg)',
          borderLeft: '1px solid var(--modal-border)',
          boxShadow: 'var(--modal-shadow)',
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 18px 24px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--sans)',
            }}
          >
            Menú
          </span>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconoCerrarX />
          </button>
        </div>

        {/* 1. Opciones de navegación */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              onClick={onCerrar}
              style={({ isActive }) => ({
                display: 'block',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'var(--sans)',
                transition: 'all 0.15s ease',
                background: isActive ? 'var(--sec-active-bg)' : 'var(--input-bg)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--input-border)',
                boxShadow: isActive ? 'inset 0 1px 0 var(--pill-highlight)' : 'none',
              })}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--hr-line)', paddingTop: 14, marginTop: 'auto' }}>
          {/* 2. Nombre y rol del usuario */}
          {nombreUsuario && (
            <div style={{ marginBottom: 14, lineHeight: 1.3 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--sans)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {nombreUsuario}
              </div>
              {rolEtiqueta && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {rolEtiqueta}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* 3. Botón de salir */}
            <button
              type="button"
              onClick={() => {
                onCerrar()
                onLogout()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 14px',
                borderRadius: 12,
                border: '1px solid var(--input-border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: 'var(--sans)',
              }}
            >
              <IconoSalir />
              Cerrar sesión
            </button>

            {/* 4. Toggle de tema */}
            <button
              type="button"
              onClick={onToggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 14px',
                borderRadius: 12,
                border: '1px solid var(--tabs-wrap-border)',
                background: 'var(--sheen), var(--tabs-wrap-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: 'var(--sans)',
              }}
            >
              {theme === 'light' ? <IconoLuna /> : <IconoSol />}
              {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
