import { useRef } from 'react'
import type { ProductoCarta } from '../../types/carta'
import { ProductoMenuCard } from './ProductoMenuCard'

interface CartaCarouselRowProps {
  titulo: string
  icono: React.ReactNode
  subtitulo?: string
  productos: ProductoCarta[]
}

export function CartaCarouselRow({ titulo, icono, subtitulo, productos }: CartaCarouselRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollerRef.current) return
    const offset = dir === 'left' ? -320 : 320
    scrollerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  if (!productos || productos.length === 0) return null

  return (
    <div style={{ marginBottom: 44 }}>
      {/* Encabezado de la fila de carrusel */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          padding: '0 8px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--tabs-wrap-bg)',
                border: '1px solid var(--tabs-wrap-border)',
                boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
                flexShrink: 0,
              }}
            >
              {icono}
            </div>
            <h3
              style={{
                fontSize: 'clamp(19px, 2.2vw, 24px)',
                fontWeight: 800,
                letterSpacing: '-0.3px',
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              {titulo}
            </h3>
            <span
              style={{
                background: 'var(--sec-active-bg)',
                color: 'var(--sec-active-color)',
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              {productos.length} {productos.length === 1 ? 'opción' : 'opciones'}
            </span>
          </div>
          {subtitulo && (
            <p
              style={{
                margin: '6px 0 0 50px',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              {subtitulo}
            </p>
          )}
        </div>

        {/* Botones de navegación del carrusel */}
        {productos.length > 2 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Desplazar hacia la izquierda"
              style={{
                width: 36,
                height: 36,
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
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Desplazar hacia la derecha"
              style={{
                width: 36,
                height: 36,
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
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Contenedor del Carrusel Horizontal */}
      <div
        ref={scrollerRef}
        style={{
          display: 'flex',
          gap: 22,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          padding: '42px 14px 20px',
          boxSizing: 'border-box',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {productos.map((prod) => (
          <ProductoMenuCard key={prod.id} producto={prod} minWidth={270} maxWidth={290} />
        ))}
      </div>
    </div>
  )
}
