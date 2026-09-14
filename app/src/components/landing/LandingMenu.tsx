import { useState } from 'react'
import { useCarta } from '../../hooks/useCarta'
import { ProductoMenuCard } from './ProductoMenuCard'
import { CartaSlideDrawer } from './CartaSlideDrawer'
import { IconoCarta, IconoDestello, IconoFlechaDerecha } from '../ui/IconosFormas'

export function LandingMenu() {
  const { datos, cargando } = useCarta()
  const [cartaAbierta, setCartaAbierta] = useState(false)

  // Seleccionamos los productos reales disponibles en la carta
  const favoritos = (() => {
    if (!datos || !datos.todos || datos.todos.length === 0) return []
    return datos.todos.slice(0, 6)
  })()

  return (
    <section
      id="menu"
      style={{
        position: 'relative',
        minHeight: '70vh',
        padding: '80px 6% 90px',
        maxWidth: 1180,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Disparador visual atractivo en el borde derecho de la pantalla para abrir la Carta */}
      <div
        onClick={() => setCartaAbierta(true)}
        role="button"
        tabIndex={0}
        aria-label="Abrir carta completa"
        title="Ver la carta completa"
        className="landing-carta-fixed-tab"
        style={{
          display: cartaAbierta ? 'none' : 'flex',
        }}
      >
        <IconoCarta size={18} color="#ffffff" />
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px' }}>
            Ver Carta
          </span>
          <span className="landing-carta-subtext" style={{ fontSize: 10, opacity: 0.9, fontWeight: 600 }}>
            Tocar para ver
          </span>
        </div>
      </div>

      {/* Título de la sección */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 540,
          margin: '0 auto 44px',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(26px, 3.2vw, 34px)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            margin: '0 0 10px',
            color: 'var(--text-primary)',
          }}
        >
          Nuestros favoritos
        </h2>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            margin: 0,
          }}
        >
          Los más pedidos de la casa, disponibles en tus tamaños preferidos.
        </p>
      </div>

      {/* Tarjetas de Favoritos con los estilos exactos de siempre */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '60px 26px',
        }}
      >
        {favoritos.map((prod) => (
          <ProductoMenuCard key={prod.id} producto={prod} />
        ))}
      </div>

      {/* Botón inferior complementario para descubrir toda la carta */}
      <div style={{ textAlign: 'center', marginTop: 44, position: 'relative', zIndex: 1 }}>
        <button
          type="button"
          onClick={() => setCartaAbierta(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 28px',
            borderRadius: 999,
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--sec-active-bg)'
            e.currentTarget.style.color = 'var(--sec-active-color)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--input-bg)'
            e.currentTarget.style.color = 'var(--text-primary)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <IconoDestello size={18} color="var(--brand-blue, #41afe0)" />
          <span>Explorar toda la carta en carrusel</span>
          <IconoFlechaDerecha size={16} />
        </button>
      </div>

      {/* Panel deslizante lateral con la Carta completa */}
      <CartaSlideDrawer
        abierto={cartaAbierta}
        onCerrar={() => setCartaAbierta(false)}
        datos={datos}
        cargando={cargando}
      />
    </section>
  )
}
