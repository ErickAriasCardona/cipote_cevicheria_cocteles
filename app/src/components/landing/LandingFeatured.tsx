import { useState } from 'react'
import { BURTGOS_FEATURE, SIZES, fmtCOP } from '../../config/landing'
import type { SizeOption } from '../../config/landing'
import { useCarrito } from '../../hooks/useCarrito'

export function LandingFeatured() {
  const [currentSize, setCurrentSize] = useState<SizeOption>(BURTGOS_FEATURE.defaultSize)
  const { addToCart } = useCarrito()
  const price = BURTGOS_FEATURE.prices[currentSize]

  return (
    <section
      id="feature"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        background:
          'linear-gradient(180deg, rgba(65,175,224,0.11) 0%, rgba(65,175,224,0.04) 100%)',
        padding: '90px 6% 110px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 50,
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Columna Izquierda: Imagen y Tarjeta Flotante */}
        <div style={{ position: 'relative' }}>
          <div
            data-tilt="1"
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              aspectRatio: '5/4',
              boxShadow: '0 26px 50px rgba(15,20,30,0.16)',
              transition: 'transform 0.15s ease-out',
            }}
          >
            <img
              src={BURTGOS_FEATURE.image}
              alt="Foto del Burtgos en vaso"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          {/* Tarjeta de Vidrio Flotante */}
          <div
            style={{
              position: 'absolute',
              bottom: -26,
              right: -18,
              width: 'min(240px, 70%)',
              background:
                'linear-gradient(165deg, rgba(255,255,255,0.75), rgba(255,255,255,0.45))',
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
              border: '1px solid rgba(15,20,30,0.08)',
              borderRadius: 18,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.7), 0 20px 40px rgba(15,20,30,0.18)',
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#181B22' }}>
                {BURTGOS_FEATURE.name}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(24,27,34,0.5)' }}>
                {BURTGOS_FEATURE.prepTime}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
              {SIZES.map((sz) => {
                const active = currentSize === sz
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setCurrentSize(sz)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      border: 'none',
                      transition: 'all 0.15s ease',
                      background: active
                        ? 'linear-gradient(160deg, rgba(65,175,224,0.4), rgba(65,175,224,0.18))'
                        : 'rgba(15,20,30,0.05)',
                      color: active ? '#0d3a52' : 'rgba(24,27,34,0.55)',
                      boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.5)' : 'none',
                    }}
                  >
                    {sz}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#181B22' }}>
                {fmtCOP(price)}
              </span>
              <button
                type="button"
                onClick={() =>
                  addToCart({
                    id: BURTGOS_FEATURE.productId,
                    name: BURTGOS_FEATURE.name,
                    size: currentSize,
                    unitPrice: price,
                  })
                }
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Texto */}
        <div>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.2vw, 34px)',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              margin: '0 0 14px',
              color: '#181B22',
            }}
          >
            {BURTGOS_FEATURE.title}
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: 'rgba(24, 27, 34, 0.6)',
              margin: 0,
              maxWidth: 420,
            }}
          >
            {BURTGOS_FEATURE.description}
          </p>
        </div>
      </div>
    </section>
  )
}
