import { useState, useEffect, useMemo } from 'react'
import { fmtCOP } from '../../config/landing'
import { useCarrito } from '../../hooks/useCarrito'
import { useCarta } from '../../hooks/useCarta'

interface FeaturedSlide {
  id: string
  productId: string
  title: string
  name: string
  tipoBadge: 'COMBO' | 'PROMOCIÓN'
  subBadge: string
  description: string
  image: string
  defaultSize: string
  singlePrice: number
}

export function LandingFeatured() {
  const { addToCart } = useCarrito()
  const { datos } = useCarta()

  // SOLO mostramos las promociones/combos registradas en el sistema
  const slides: FeaturedSlide[] = useMemo(() => {
    if (!datos || !datos.promociones || datos.promociones.length === 0) {
      return []
    }
    return datos.promociones.map((p) => {
      const nombreLower = p.nombre.toLowerCase()
      const descLower = (p.descripcion || '').toLowerCase()
      const isCombo =
        nombreLower.includes('combo') ||
        p.nombre.includes('+') ||
        descLower.includes('combo')

      const tipoBadge: 'COMBO' | 'PROMOCIÓN' = isCombo ? 'COMBO' : 'PROMOCIÓN'
      const subBadge = isCombo ? 'Combo' : 'Promoción'

      return {
        id: `promo-${p.id}`,
        productId: p.id,
        title: p.nombre,
        name: p.nombre,
        tipoBadge,
        subBadge,
        description:
          p.descripcion ||
          (isCombo
            ? 'Combo especial con precio promocional.'
            : 'Promoción exclusiva con ingredientes frescos y precio especial.'),
        image: p.imagenUrl || '/landing/coctel_004.jpg',
        defaultSize: isCombo ? 'Combo' : 'Promoción',
        singlePrice: p.precio,
      }
    })
  }, [datos])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Ajustar índice si la cantidad de slides cambia
  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0)
    }
  }, [slides.length, currentIndex])

  const currentSlide = slides[currentIndex] || slides[0]

  // Carrusel automático cada 5 segundos si hay más de 1 slide
  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [isPaused, slides.length])

  function handleAdd() {
    if (!currentSlide) return
    addToCart({
      id: currentSlide.productId,
      name: currentSlide.name,
      size: currentSlide.defaultSize,
      unitPrice: currentSlide.singlePrice,
    })
  }

  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    setIsPaused(true)
    setTouchStartX(e.touches[0].clientX)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    setIsPaused(false)
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchStartX - touchEndX
    const SWIPE_THRESHOLD = 40

    if (diffX > SWIPE_THRESHOLD) {
      // Deslizó a la izquierda -> siguiente slide
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    } else if (diffX < -SWIPE_THRESHOLD) {
      // Deslizó a la derecha -> slide anterior
      setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    }
    setTouchStartX(null)
  }

  if (slides.length === 0 || !currentSlide) return null

  return (
    <section
      id="feature"
      className="landing-featured-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="landing-featured-grid">
        {/* Columna Izquierda: Imagen y Tarjeta Flotante con transición */}
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            data-tilt="1"
            key={currentSlide.id}
            className="landing-featured-img-wrap"
          >
            <img
              src={currentSlide.image}
              alt={currentSlide.name}
              onError={(e) => {
                e.currentTarget.src = '/landing/coctel_004.jpg'
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          {/* Tarjeta de Vidrio Flotante */}
          <div className="landing-featured-float-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#181B22' }}>
                {currentSlide.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(24,27,34,0.5)' }}>
                {currentSlide.subBadge}
              </span>
            </div>

            {/* Chip indicador de Combo o Promoción */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background:
                    currentSlide.tipoBadge === 'COMBO'
                      ? 'rgba(65, 175, 224, 0.18)'
                      : 'rgba(228, 41, 38, 0.14)',
                  color: currentSlide.tipoBadge === 'COMBO' ? '#0d3a52' : '#c81e1e',
                }}
              >
                {currentSlide.defaultSize}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#181B22' }}>
                {fmtCOP(currentSlide.singlePrice)}
              </span>
              <button
                type="button"
                onClick={handleAdd}
                style={{
                  padding: '7px 15px',
                  borderRadius: 999,
                  background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 10px rgba(228, 41, 38, 0.3)',
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
        <div key={`text-${currentSlide.id}`} className="landing-featured-text-col">
          <span
            style={{
              display: 'inline-block',
              background:
                currentSlide.tipoBadge === 'COMBO'
                  ? 'linear-gradient(160deg, rgba(65, 175, 224, 0.2), rgba(65, 175, 224, 0.08))'
                  : 'linear-gradient(160deg, rgba(228, 41, 38, 0.16), rgba(228, 41, 38, 0.08))',
              color: currentSlide.tipoBadge === 'COMBO' ? '#0d3a52' : '#e42926',
              border:
                currentSlide.tipoBadge === 'COMBO'
                  ? '1px solid rgba(65, 175, 224, 0.35)'
                  : '1px solid rgba(228, 41, 38, 0.28)',
              fontSize: 12,
              fontWeight: 800,
              padding: '5px 14px',
              borderRadius: 999,
              marginBottom: 12,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {currentSlide.tipoBadge}
          </span>
          <h2
            style={{
              fontSize: 'clamp(22px, 3.8vw, 34px)',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              margin: '0 0 14px',
              color: 'var(--text-primary)',
            }}
          >
            {currentSlide.title}
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              margin: 0,
              maxWidth: 440,
            }}
          >
            {currentSlide.description}
          </p>
        </div>
      </div>

      {/* Puntos de Señal (Dots Indicators) solo si hay más de 1 promoción */}
      {slides.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 46,
            zIndex: 2,
          }}
        >
          {slides.map((s, idx) => {
            const active = currentIndex === idx
            return (
              <button
                key={s.id}
                type="button"
                className="landing-featured-dot-btn"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ver promoción ${idx + 1}: ${s.name}`}
                title={s.name}
              >
                <span
                  className="landing-featured-dot-pill"
                  style={{
                    width: active ? 28 : 10,
                    background: active
                      ? 'linear-gradient(135deg, #e42926, #c81e1e)'
                      : 'rgba(15, 20, 30, 0.2)',
                    boxShadow: active
                      ? '0 2px 8px rgba(228, 41, 38, 0.45)'
                      : 'none',
                  }}
                />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
