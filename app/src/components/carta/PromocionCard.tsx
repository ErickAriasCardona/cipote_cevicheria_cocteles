import { useRef, useState } from 'react'
import type { PromocionConDetalle } from '../../types/promocion'
import { fmtCOP } from '../../config/landing'
import { storageService } from '../../services/storageService'
import { promocionesService } from '../../services/promocionesService'
import { useConfirmacion } from '../../hooks/useConfirmacion'

interface PromocionCardProps {
  promocion: PromocionConDetalle
  onActualizada: () => void
  onEliminada: () => void
}

export function PromocionCard({ promocion, onActualizada, onEliminada }: PromocionCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [hoverFoto, setHoverFoto] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendo(true)
    setErrorAccion(null)
    try {
      const url = await storageService.subirImagenCatalogo(file, 'promociones')
      await promocionesService.actualizarImagen(promocion.id, url)
      onActualizada()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleToggleActivo() {
    try {
      await promocionesService.toggleActivo(promocion.id, !promocion.activo)
      onActualizada()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  async function handleEliminar() {
    const ok = await confirmar({
      titulo: 'Eliminar Promoción',
      mensaje: `¿Estás seguro de que deseas eliminar la promoción "${promocion.nombre}"? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar promoción',
      varianteConfirmar: 'destructive',
    })
    if (!ok) return

    try {
      await promocionesService.eliminarPromocion(promocion.id)
      onEliminada()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.35))',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: '1px solid rgba(15, 20, 30, 0.08)',
        borderRadius: 22,
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 14px 34px rgba(15, 20, 30, 0.08)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
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

      {/* Recuadro de Imagen estilo "receta insignia" (Click para subir foto) */}
      <div
        onClick={() => !subiendo && fileInputRef.current?.click()}
        onMouseEnter={() => setHoverFoto(true)}
        onMouseLeave={() => setHoverFoto(false)}
        role="button"
        tabIndex={0}
        aria-label={`Cambiar imagen de ${promocion.nombre}`}
        title="Haz clic para subir o cambiar la imagen de esta promoción"
        style={{
          position: 'relative',
          width: '100%',
          height: 180,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 10px 24px rgba(15, 20, 30, 0.12)',
          background: '#1a1f2c',
          cursor: subiendo ? 'wait' : 'pointer',
        }}
      >
        <img
          src={promocion.imagenUrl || '/landing/coctel_004.jpg'}
          alt={promocion.nombre}
          onError={(e) => {
            e.currentTarget.src = '/landing/coctel_004.jpg'
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.25s ease',
            transform: hoverFoto ? 'scale(1.05)' : 'scale(1)',
          }}
        />

        {/* Overlay para subir foto */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: subiendo
              ? 'rgba(0, 0, 0, 0.65)'
              : hoverFoto
              ? 'rgba(0, 0, 0, 0.45)'
              : 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.5) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            transition: 'background 0.2s ease',
          }}
        >
          {subiendo ? (
            <div
              style={{
                width: 24,
                height: 24,
                border: '2.5px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : (
            <div
              style={{
                opacity: hoverFoto ? 1 : 0.85,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{hoverFoto ? 'Cambiar foto' : 'Subir foto'}</span>
            </div>
          )}
        </div>

        {/* Badge de Estado Activo / Inactivo */}
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: promocion.activo ? 'rgba(46, 158, 91, 0.92)' : 'rgba(120, 120, 130, 0.85)',
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          {promocion.activo ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Tarjeta de Información estilo "receta insignia" */}
      <div
        style={{
          background: 'linear-gradient(165deg, rgba(255,255,255,0.78), rgba(255,255,255,0.48))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(15,20,30,0.08)',
          borderRadius: 16,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h4
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {promocion.nombre}
          </h4>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-red, #e42926)' }}>
            {fmtCOP(promocion.precio)}
          </span>
        </div>

        {/* Desglose de Productos que componen el combo */}
        <div style={{ marginTop: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: 6 }}>
            Productos incluidos en el combo:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {promocion.componentes && promocion.componentes.length > 0 ? (
              promocion.componentes.map((c, idx) => (
                <span
                  key={`${c.productoId}-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 9px',
                    borderRadius: 8,
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  <strong style={{ color: 'var(--brand-blue, #41afe0)' }}>{c.cantidad}x</strong>
                  <span>{c.nombreProducto}</span>
                  {c.etiquetaTamano && (
                    <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', background: 'rgba(15,20,30,0.05)', padding: '1px 5px', borderRadius: 4 }}>
                      {c.etiquetaTamano}
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Sin productos definidos</span>
            )}
          </div>
        </div>
      </div>

      {errorAccion && (
        <span style={{ fontSize: 12, color: '#e42926' }}>{errorAccion}</span>
      )}

      {/* Botones de acción inferiores */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={handleToggleActivo}
          style={{
            padding: '7px 14px',
            borderRadius: 10,
            border: '1px solid var(--input-border)',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
          }}
        >
          {promocion.activo ? 'Desactivar' : 'Activar'}
        </button>

        <button
          type="button"
          onClick={handleEliminar}
          title="Eliminar promoción"
          style={{
            padding: '7px 12px',
            borderRadius: 10,
            border: '1px solid rgba(228, 41, 38, 0.25)',
            background: 'rgba(228, 41, 38, 0.08)',
            color: '#e42926',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
