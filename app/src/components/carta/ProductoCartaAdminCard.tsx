import { useRef, useState } from 'react'
import type { Producto } from '../../types/producto'
import type { ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { fmtCOP } from '../../config/landing'
import { storageService } from '../../services/storageService'
import { productosService } from '../../services/productosService'

interface ProductoCartaAdminCardProps {
  producto: Producto
  precios: ProductoTamanoPrecio[]
  tamanos: TamanoVaso[]
  onImagenActualizada: (productoId: string, nuevaUrl: string) => void
  onToggleEnCarta?: (productoId: string, enCarta: boolean) => void
}

function defaultFoto(categoria: string): string {
  if (categoria === 'ceviche') return '/landing/coctel_002.jpg'
  if (categoria === 'granizado') return '/landing/coctel_001.jpg'
  if (categoria === 'bebida') return '/landing/coctel_003.jpg'
  return '/landing/coctel_005.jpg'
}

export function ProductoCartaAdminCard({
  producto,
  precios,
  tamanos,
  onImagenActualizada,
  onToggleEnCarta,
}: ProductoCartaAdminCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [hoverFoto, setHoverFoto] = useState(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)

  // Filtrar y ordenar precios configurados para este producto
  const preciosProducto = precios
    .filter((p) => p.productoId === producto.id && p.activo)
    .map((ptp) => {
      const tamano = tamanos.find((t) => t.id === ptp.tamanoVasoId)
      return {
        tamanoId: ptp.tamanoVasoId,
        etiqueta: tamano?.etiqueta || 'Vaso',
        onzas: tamano?.onzas,
        precio: ptp.precio,
      }
    })
    .sort((a, b) => (a.onzas && b.onzas ? a.onzas - b.onzas : a.etiqueta.localeCompare(b.etiqueta)))

  // Tamaño seleccionado para previsualizar precio
  const [tamanoSelIndex, setTamanoSelIndex] = useState(0)
  const tieneTamanos = preciosProducto.length > 0
  const tamanoActual = tieneTamanos ? preciosProducto[tamanoSelIndex] || preciosProducto[0] : null
  const precioDisplay = tamanoActual ? tamanoActual.precio : producto.precio ?? producto.precioLegado ?? 0

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendo(true)
    setErrorSubida(null)
    try {
      const url = await storageService.subirImagenCatalogo(file, 'productos')
      await productosService.actualizarProducto(producto.id, { imagenUrl: url })
      onImagenActualizada(producto.id, url)
    } catch (err) {
      setErrorSubida(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const fallbackImg = defaultFoto(producto.categoria)

  return (
    <div
      style={{
        background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: '1px solid rgba(15, 20, 30, 0.08)',
        borderRadius: 24,
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 16px 40px rgba(15, 20, 30, 0.08)',
        padding: '50px 14px 18px',
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Foto circular flotante superior interactiva (Click para cargar imagen) */}
      <div
        onClick={() => !subiendo && fileInputRef.current?.click()}
        onMouseEnter={() => setHoverFoto(true)}
        onMouseLeave={() => setHoverFoto(false)}
        role="button"
        tabIndex={0}
        aria-label={`Cambiar imagen de ${producto.nombre}`}
        title="Clic para subir o cambiar foto"
        style={{
          position: 'absolute',
          top: -36,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 90,
          height: 90,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 12px 26px rgba(15, 20, 30, 0.2), inset 0 0 0 4px rgba(255, 255, 255, 0.7)',
          background: '#fff',
          cursor: subiendo ? 'wait' : 'pointer',
        }}
      >
        <img
          src={producto.imagenUrl || fallbackImg}
          alt={producto.nombre}
          onError={(e) => {
            e.currentTarget.src = fallbackImg
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.2s ease',
            transform: hoverFoto ? 'scale(1.08)' : 'scale(1)',
          }}
        />

        {/* Overlay con ícono de cámara para subir imagen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: subiendo
              ? 'rgba(0, 0, 0, 0.65)'
              : hoverFoto
              ? 'rgba(0, 0, 0, 0.5)'
              : 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            opacity: hoverFoto || subiendo ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          {subiendo ? (
            <div
              style={{
                width: 22,
                height: 22,
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{ fontSize: 9.5, fontWeight: 700, marginTop: 2 }}>Subir</span>
            </>
          )}
        </div>
      </div>

      {/* Badge Estado En Carta (Visible / Oculto) */}
      <button
        type="button"
        onClick={() => onToggleEnCarta?.(producto.id, !producto.enCarta)}
        title={
          producto.enCarta
            ? 'Visible en la carta pública - Clic para ocultar'
            : 'Oculto de la carta pública - Clic para mostrar'
        }
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          background: producto.enCarta ? 'rgba(46, 158, 91, 0.16)' : 'rgba(120, 120, 130, 0.16)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: producto.enCarta
            ? '1px solid rgba(46, 158, 91, 0.35)'
            : '1px solid rgba(120, 120, 130, 0.3)',
          borderRadius: 999,
          padding: '4px 10px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.05)',
          fontSize: 10.5,
          fontWeight: 700,
          color: producto.enCarta ? 'var(--brand-green, #2e9e5b)' : 'var(--text-faint, rgba(24, 27, 34, 0.5))',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          cursor: onToggleEnCarta ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: producto.enCarta ? 'var(--brand-green, #2e9e5b)' : 'var(--text-faint, rgba(24, 27, 34, 0.5))',
          }}
        />
        <span>{producto.enCarta ? 'En Carta' : 'Oculto'}</span>
      </button>

      {/* Badge de Categoría */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(15, 20, 30, 0.08)',
          borderRadius: 999,
          padding: '4px 10px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 10px rgba(15, 20, 30, 0.08)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--brand-blue, #41afe0)',
          textTransform: 'capitalize',
        }}
      >
        {producto.categoria}
      </div>

      {/* Título y descripción */}
      <div>
        <h3
          style={{
            margin: '14px 0 4px',
            fontSize: 17,
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}
        >
          {producto.nombre}
        </h3>

        <p
          style={{
            margin: '0 0 12px',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            minHeight: 32,
            lineHeight: 1.3,
          }}
        >
          {producto.descripcion || 'Producto fresco preparado artesanalmente.'}
        </p>

        {errorSubida && (
          <span style={{ fontSize: 11, color: '#e42926', display: 'block', marginBottom: 6 }}>
            {errorSubida}
          </span>
        )}

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
            preciosProducto.map((sz, idx) => {
              const active = tamanoSelIndex === idx
              return (
                <button
                  key={sz.tamanoId}
                  type="button"
                  onClick={() => setTamanoSelIndex(idx)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--sans)',
                    border: 'none',
                    transition: 'all 0.15s ease',
                    background: active
                      ? 'linear-gradient(160deg, rgba(65,175,224,0.4), rgba(65,175,224,0.18))'
                      : 'rgba(15,20,30,0.05)',
                    color: active ? '#0d3a52' : 'var(--text-secondary)',
                    boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.5)' : 'none',
                  }}
                >
                  {sz.etiqueta}
                </button>
              )
            })
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)' }}>
              Precio único directo
            </span>
          )}
        </div>
      </div>

      {/* Pie con precio */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid rgba(15,20,30,0.06)',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>
            {tamanoActual ? tamanoActual.etiqueta : 'Precio'}
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
            {fmtCOP(precioDisplay)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Cambiar foto del producto"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid var(--input-border)',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Foto</span>
        </button>
      </div>
    </div>
  )
}
