import { useEffect, useRef } from 'react'
import type { DatosCarta } from '../../types/carta'
import { CartaCarouselRow } from './CartaCarouselRow'
import {
  IconoCeviche,
  IconoGranizado,
  IconoBebida,
  IconoCarta,
  IconoDestello,
  IconoCruz,
} from '../ui/IconosFormas'

interface CartaSlideDrawerProps {
  abierto: boolean
  onCerrar: () => void
  datos: DatosCarta | null
  cargando?: boolean
}

export function CartaSlideDrawer({ abierto, onCerrar, datos, cargando }: CartaSlideDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCerrar()
      }
    }

    // Prevenir scroll en la página principal mientras el panel está abierto
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [abierto, onCerrar])

  return (
    <div
      role="presentation"
      onClick={onCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: abierto ? 1 : 0,
        visibility: abierto ? 'visible' : 'hidden',
        pointerEvents: abierto ? 'auto' : 'none',
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carta completa"
        onClick={(e) => e.stopPropagation()}
        className="landing-carta-drawer"
        style={{
          transform: abierto ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Cabecera del Panel */}
        <div className="landing-carta-drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'linear-gradient(160deg, rgba(228, 41, 38, 0.18), rgba(228, 41, 38, 0.06))',
                  border: '1px solid rgba(228, 41, 38, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
                }}
              >
                <IconoCarta size={24} />
              </div>
              <h2
                style={{
                  fontSize: 'clamp(19px, 2.5vw, 26px)',
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.5px',
                  color: 'var(--text-primary)',
                }}
              >
                La Carta de Cipote
              </h2>
            </div>
            <p
              style={{
                margin: '6px 0 0 56px',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              Nuestras especialidades preparadas al momento en cualquier presentación
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar carta"
            title="Cerrar carta (Esc)"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <IconoCruz size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Contenido scrolleable con carruseles por categoría */}
        <div className="landing-carta-drawer-content">
          {cargando && !datos ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  border: '3px solid var(--brand-blue)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Cargando carta fresca...</p>
            </div>
          ) : (
            <>
              {/* 1. Ceviches & Cócteles */}
              <CartaCarouselRow
                titulo="Ceviches / Cócteles"
                icono={<IconoCeviche size={24} />}
                subtitulo="Camarón fresco, cebolla morada, limón o salsa clásica bien fría."
                productos={datos?.ceviches ?? []}
              />

              {/* 2. Granizados */}
              <CartaCarouselRow
                titulo="Granizados"
                icono={<IconoGranizado size={24} />}
                subtitulo="Textura nieve suave, frutas naturales y mezclas insignia."
                productos={datos?.granizados ?? []}
              />

              {/* 3. Bebidas */}
              <CartaCarouselRow
                titulo="Bebidas"
                icono={<IconoBebida size={24} />}
                subtitulo="Refrescos bien helados en botella y vaso para disfrutar."
                productos={datos?.bebidas ?? []}
              />

              {/* 4. Otros productos si existen */}
              {datos?.otros && datos.otros.length > 0 && (
                <CartaCarouselRow
                  titulo="Otros y Adicionales"
                  icono={<IconoDestello size={22} />}
                  subtitulo="Complementos especiales del menú."
                  productos={datos.otros}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
