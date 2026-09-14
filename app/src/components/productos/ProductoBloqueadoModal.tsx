import { useEffect, useRef, useState } from 'react'
import type { Producto } from '../../types/producto'
import { Button } from '../ui/Button'

export interface ProductoBloqueadoModalProps {
  abierto: boolean
  producto: Producto | null
  motivo: 'ventas' | 'promocion' | 'otro'
  mensajeDetalle?: string
  onDesactivar: (producto: Producto) => Promise<void>
  onCerrar: () => void
}

function IconoAlerta() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconoCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconoPower() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

export function ProductoBloqueadoModal({
  abierto,
  producto,
  motivo,
  mensajeDetalle,
  onDesactivar,
  onCerrar,
}: ProductoBloqueadoModalProps) {
  const [desactivando, setDesactivando] = useState(false)
  const [exito, setExito] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierto) {
      setExito(false)
      setDesactivando(false)
      return
    }
    botonRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCerrar()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [abierto, onCerrar])

  if (!abierto || !producto) return null

  async function handleDesactivarClick() {
    if (!producto) return
    setDesactivando(true)
    try {
      await onDesactivar(producto)
      setExito(true)
      setTimeout(() => {
        onCerrar()
      }, 1200)
    } catch {
      setDesactivando(false)
    }
  }

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-bloqueo-titulo"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--modal-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--modal-border)',
          borderRadius: 20,
          padding: '28px 26px',
          maxWidth: 480,
          width: '100%',
          boxShadow: 'var(--modal-shadow)',
        }}
      >
        {/* Cabecera con Icono de Alerta */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconoAlerta />
          </div>
          <div>
            <h3
              id="modal-bloqueo-titulo"
              style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}
            >
              No es posible eliminar este producto
            </h3>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--brand-blue)',
                display: 'inline-block',
              }}
            >
              Producto: &quot;{producto.nombre}&quot; ({producto.categoria.toUpperCase()})
            </span>
          </div>
        </div>

        {/* Motivo Explicativo */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            marginBottom: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: 'var(--text-primary)' }}>
            {motivo === 'ventas' ? (
              <>
                Este producto <strong>ya cuenta con ventas registradas en el histórico</strong> del negocio.
                Por trazabilidad contable, fiscal y auditoría de cierres de caja, la base de datos protege este registro
                para evitar descuadres en los balances pasados.
              </>
            ) : motivo === 'promocion' ? (
              <>
                Este producto <strong>está incluido en una o más Promociones / Combos activos</strong> de la carta.
                No se puede eliminar de la base de datos mientras forme parte de promociones vigentes.
              </>
            ) : (
              mensajeDetalle || 'Este producto tiene dependencias activas en el sistema que impiden su eliminación física.'
            )}
          </p>
        </div>

        {/* Qué debes hacer */}
        <div style={{ marginBottom: 22 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            ¿Qué debes hacer?
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>1.</span>
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Desactivar el producto:</strong> Es la solución recomendada. Al apagarlo, no se mostrará en caja para la venta y no afectará ningún historial previo.
              </span>
            </div>
            {motivo === 'promocion' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--brand-blue)', fontWeight: 700 }}>2.</span>
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Retirar de promociones:</strong> Si realmente deseas borrarlo, primero ve al módulo de <strong>Carta / Promociones</strong> y retira este producto de los combos que lo contengan.
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--amber-text)', fontWeight: 700 }}>{motivo === 'promocion' ? '3.' : '2.'}</span>
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Ocultar de la carta:</strong> Si solo quieres que no aparezca en el menú público de clientes pero siga en caja, apaga el interruptor de <strong>Carta</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de Éxito al Desactivar */}
        {exito && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              marginBottom: 16,
              color: '#10b981',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <IconoCheck />
            <span>¡Producto desactivado exitosamente! Ya no estará disponible en caja.</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCerrar}
            disabled={desactivando}
          >
            Entendido, cerrar
          </Button>

          {producto.activo && !exito && (
            <Button
              ref={botonRef}
              type="button"
              variant="primary"
              onClick={handleDesactivarClick}
              disabled={desactivando}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <IconoPower />
              <span>{desactivando ? 'Desactivando…' : 'Desactivar producto ahora'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
