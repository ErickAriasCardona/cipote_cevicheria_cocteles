import { useState } from 'react'
import { PRODUCTS, SIZES, fmtCOP } from '../../config/landing'
import type { SizeOption } from '../../config/landing'
import { useCarrito } from '../../hooks/useCarrito'

export function LandingMenu() {
  const { addToCart } = useCarrito()
  const [sizeSel, setSizeSel] = useState<Record<string, SizeOption>>({
    ceviche: '12oz',
    burtgos: '12oz',
    coctel: '12oz',
  })

  const productKeys = ['ceviche', 'burtgos', 'coctel'] as const

  return (
    <section
      id="menu"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '50px 6% 100px',
        maxWidth: 1180,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 520,
          margin: '0 auto 44px',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(26px, 3.2vw, 34px)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            margin: '0 0 10px',
            color: '#181B22',
          }}
        >
          Nuestros favoritos
        </h2>
        <p
          style={{
            fontSize: 15,
            color: 'rgba(24, 27, 34, 0.55)',
            margin: 0,
          }}
        >
          Los cocteles que más se piden, en cualquier tamaño de vaso.
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '60px 26px',
        }}
      >
        {productKeys.map((key) => {
          const prod = PRODUCTS[key]
          const currentSize = sizeSel[key] || '12oz'
          const price = prod.prices[currentSize]

          return (
            <div
              key={prod.id}
              data-tilt="1"
              style={{
                animation: 'fadeInUp 0.7s ease both',
                transition: 'box-shadow 0.25s ease',
                background:
                  'linear-gradient(165deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))',
                backdropFilter: 'blur(20px) saturate(140%)',
                WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                border: '1px solid rgba(15, 20, 30, 0.07)',
                borderRadius: 24,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 16px 40px rgba(15, 20, 30, 0.08)',
                padding: '52px 20px 22px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Foto circular flotante superior */}
              <div
                style={{
                  position: 'absolute',
                  top: -36,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow:
                    '0 12px 26px rgba(15, 20, 30, 0.2), inset 0 0 0 4px rgba(255, 255, 255, 0.7)',
                }}
              >
                <img
                  src={prod.image}
                  alt={prod.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>

              {/* Badge de Calificación */}
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(15, 20, 30, 0.08)',
                  borderRadius: 999,
                  padding: '5px 10px',
                  boxShadow:
                    'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 10px rgba(15, 20, 30, 0.1)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="#E42926">
                  <path d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 14.9 4.4 18l1.4-6.2L1 7.5l6.4-.6z" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#181B22' }}>
                  {prod.rating}
                </span>
              </div>

              <h3
                style={{
                  margin: '14px 0 4px',
                  fontSize: 16.5,
                  fontWeight: 700,
                  color: '#181B22',
                }}
              >
                {prod.name}
              </h3>

              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: 12.5,
                  color: 'rgba(24, 27, 34, 0.55)',
                }}
              >
                {prod.subtitle}
              </p>

              {/* Chips de selección de tamaño */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  justifyContent: 'center',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                }}
              >
                {SIZES.map((sz) => {
                  const active = currentSize === sz
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        setSizeSel((prev) => ({
                          ...prev,
                          [key]: sz,
                        }))
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontSize: 10.5,
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

              {/* Precio y Botón de adición (+) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid rgba(15,20,30,0.06)',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: '#181B22' }}>
                  {fmtCOP(price)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      id: prod.id,
                      name: prod.name,
                      size: currentSize,
                      unitPrice: price,
                    })
                  }
                  title={`Agregar ${prod.name} (${currentSize}) al pedido`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
