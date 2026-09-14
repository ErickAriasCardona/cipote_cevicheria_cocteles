import { useState } from 'react'
import type { ProductoCarta } from '../../types/carta'
import { fmtCOP } from '../../config/landing'
import { useCarrito } from '../../hooks/useCarrito'
import { IconoCheck, IconoPlus } from '../ui/IconosFormas'

export interface ProductoMenuCardProps {
  producto: ProductoCarta
  minWidth?: number | string
  maxWidth?: number | string
}

export function ProductoMenuCard({ producto, minWidth, maxWidth }: ProductoMenuCardProps) {
  const { addToCart } = useCarrito()

  // Selección inicial de tamaño
  const [tamanoSelIndex, setTamanoSelIndex] = useState<number>(() => {
    if (!producto.tamanos || producto.tamanos.length === 0) return -1
    // Priorizar 12oz si existe, si no el primero
    const idx12 = producto.tamanos.findIndex((t) => t.etiqueta.toLowerCase() === '12oz')
    return idx12 >= 0 ? idx12 : 0
  })

  const [agregadoAnim, setAgregadoAnim] = useState(false)

  const tieneTamanos = producto.tamanos && producto.tamanos.length > 0
  const tamanoActual = tieneTamanos && tamanoSelIndex >= 0 ? producto.tamanos[tamanoSelIndex] : null
  const precioActual = tamanoActual ? tamanoActual.precio : producto.precioDirecto ?? 0
  const etiquetaActual = tamanoActual ? tamanoActual.etiqueta : 'Unidad'

  function handleAdd() {
    addToCart({
      id: producto.id,
      name: producto.nombre,
      size: etiquetaActual,
      unitPrice: precioActual,
    })
    setAgregadoAnim(true)
    setTimeout(() => setAgregadoAnim(false), 800)
  }

  return (
    <div
      data-tilt="1"
      style={{
        animation: 'fadeInUp 0.7s ease both',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        background: 'var(--sheen), var(--glass-bg)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid var(--glass-border)',
        borderRadius: 24,
        boxShadow: 'var(--glass-shadow)',
        padding: '52px 20px 22px',
        textAlign: 'center',
        position: 'relative',
        minWidth: minWidth ?? 260,
        maxWidth: maxWidth ?? 'none',
        flex: minWidth ? `0 0 ${typeof minWidth === 'number' ? `${minWidth}px` : minWidth}` : '1 1 auto',
        boxSizing: 'border-box',
        scrollSnapAlign: 'start',
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
          boxShadow: '0 12px 26px rgba(15, 20, 30, 0.2), inset 0 0 0 4px rgba(255, 255, 255, 0.7)',
          background: 'var(--card-bg)',
        }}
      >
        <img
          src={producto.imagenUrl || '/landing/coctel_001.jpg'}
          alt={producto.nombre}
          onError={(e) => {
            e.currentTarget.src = '/landing/coctel_001.jpg'
          }}
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
          background: 'var(--tabs-wrap-bg)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 999,
          padding: '5px 10px',
          boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="#E42926">
          <path d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 14.9 4.4 18l1.4-6.2L1 7.5l6.4-.6z" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          {producto.rating}
        </span>
      </div>

      <h3
        style={{
          margin: '14px 0 4px',
          fontSize: 16.5,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {producto.nombre}
      </h3>

      <p
        style={{
          margin: '0 0 10px',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          minHeight: 32,
          lineHeight: 1.3,
        }}
      >
        {producto.descripcion}
      </p>

      {/* Chips de selección de tamaño */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          minHeight: 28,
          alignItems: 'center',
        }}
      >
        {tieneTamanos ? (
          producto.tamanos.map((sz, idx) => {
            const active = tamanoSelIndex === idx
            return (
              <button
                key={sz.tamanoVasoId}
                type="button"
                onClick={() => setTamanoSelIndex(idx)}
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
                    ? 'var(--sec-active-bg)'
                    : 'var(--opt-inactive-bg)',
                  color: active ? 'var(--sec-active-color)' : 'var(--opt-inactive-color)',
                  boxShadow: active ? 'inset 0 1px 0 var(--pill-highlight)' : 'none',
                }}
              >
                {sz.etiqueta}
              </button>
            )
          })
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', padding: '4px 8px' }}>
            Presentación única
          </span>
        )}
      </div>

      {/* Precio y Botón de adición (+) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTop: '1px solid var(--hr-line)',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
          {fmtCOP(precioActual)}
        </span>
        <button
          type="button"
          onClick={handleAdd}
          title={`Agregar ${producto.nombre} (${etiquetaActual}) al pedido`}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: agregadoAnim
              ? 'linear-gradient(160deg, #2e9e5b, #1f8a4c)'
              : 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: agregadoAnim ? 14 : 16,
            fontWeight: 700,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 10px rgba(228, 41, 38, 0.3)',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, background 0.2s ease',
            transform: agregadoAnim ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {agregadoAnim ? <IconoCheck size={16} strokeWidth={2.6} /> : <IconoPlus size={16} strokeWidth={2.6} />}
        </button>
      </div>
    </div>
  )
}
