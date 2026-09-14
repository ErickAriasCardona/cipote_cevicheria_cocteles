import { useEffect, useState } from 'react'
import { useCarrito } from '../../hooks/useCarrito'
import { WHATSAPP_NUMBER, fmtCOP } from '../../config/landing'
import { IconoCruz, IconoMinus, IconoPlus, IconoTrash, IconoWhatsApp } from '../ui/IconosFormas'

export function CartDrawer() {
  const { items, total, drawerOpen, setDrawerOpen, inc, dec, remove } = useCarrito()

  const [tipoEntrega, setTipoEntrega] = useState<'Domicilio' | 'Recoge en local'>('Domicilio')
  const [direccion, setDireccion] = useState('')
  const [nombreRecibe, setNombreRecibe] = useState('')
  const [contactoRecibe, setContactoRecibe] = useState('')
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [efectivoConQuePaga, setEfectivoConQuePaga] = useState('')

  useEffect(() => {
    if (!drawerOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [drawerOpen, setDrawerOpen])

  if (!drawerOpen) return null

  const isDomicilio = tipoEntrega === 'Domicilio'
  const isEfectivo = metodoPago === 'Efectivo'
  const conQuePagaNum = parseFloat(efectivoConQuePaga) || 0

  let vueltasNote = ''
  if (isEfectivo && efectivoConQuePaga) {
    if (conQuePagaNum >= total) {
      vueltasNote = `Vueltas: ${fmtCOP(conQuePagaNum - total)}`
    } else {
      vueltasNote = 'El monto es menor al total del pedido.'
    }
  }

  function finalizarPedido() {
    if (items.length === 0) return

    const lines = items
      .map((it) => `• ${it.name} (${it.size}) x${it.qty} — ${fmtCOP(it.unitPrice * it.qty)}`)
      .join('\n')

    const entregaLine = isDomicilio
      ? `Domicilio — ${direccion.trim() || '(dirección sin especificar)'}`
      : 'Recoge en local'

    let pagoLine = metodoPago
    if (isEfectivo && efectivoConQuePaga) {
      pagoLine += ` (paga con ${fmtCOP(conQuePagaNum)}${conQuePagaNum >= total ? `, vueltas ${fmtCOP(conQuePagaNum - total)}` : ''})`
    }

    const msg = `¡Hola! Quiero hacer este pedido en Cipote Ceviche Cocteles:\n\n${lines}\n\nTotal: ${fmtCOP(total)}\n\nEntrega: ${entregaLine}\nRecibe: ${nombreRecibe.trim() || '(sin nombre)'}\nContacto: ${contactoRecibe.trim() || '(sin contacto)'}\nMétodo de pago: ${pagoLine}\n\n¿Me confirman disponibilidad y tiempo de entrega? Gracias!`

    const a = document.createElement('a')
    a.href = `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg).replace(/%20/g, '+')}&type=phone_number&app_absent=0`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const CHIP_BASE = {
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700 as const,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    border: 'none',
    transition: 'all 0.15s ease',
  }

  const CHIP_ACTIVE = {
    background: 'var(--sec-active-bg)',
    color: 'var(--sec-active-color)',
    boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
  }

  const CHIP_INACTIVE = {
    background: 'var(--opt-inactive-bg)',
    color: 'var(--opt-inactive-color)',
  }

  return (
    <>
      {/* Overlay */}
      <div
        role="presentation"
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--modal-overlay)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1300,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tu pedido"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          height: '100vh',
          width: 'min(390px, 92vw)',
          background: 'var(--modal-bg)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderLeft: '1px solid var(--glass-border)',
          boxShadow: 'var(--modal-shadow)',
          zIndex: 1310,
          padding: '24px 20px',
          overflowY: 'auto',
          boxSizing: 'border-box',
          fontFamily: "'Inter', sans-serif",
          color: 'var(--text-primary)',
          animation: 'drawerIn 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800 }}>Tu pedido</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar pedido"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
            }}
          >
            <IconoCruz size={15} strokeWidth={2.4} />
          </button>
        </div>

        {items.length > 0 ? (
          <>
            {/* Lista de productos en el carrito */}
            <div style={{ marginBottom: 14 }}>
              {items.map((it) => (
                <div
                  key={it.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--hr-line)',
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{it.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      {it.size} · {fmtCOP(it.unitPrice)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => dec(it.key)}
                      aria-label="Disminuir cantidad"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconoMinus size={12} strokeWidth={2.4} />
                    </button>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        minWidth: 16,
                        textAlign: 'center',
                      }}
                    >
                      {it.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => inc(it.key)}
                      aria-label="Aumentar cantidad"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconoPlus size={12} strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(it.key)}
                      title="Eliminar producto"
                      aria-label="Eliminar producto"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        border: '1px solid rgba(228, 41, 38, 0.3)',
                        background: 'rgba(228, 41, 38, 0.08)',
                        color: '#c81e1e',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconoTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Fila Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderTop: '2px solid var(--hr-line)',
                marginTop: 6,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{fmtCOP(total)}</span>
            </div>

            {/* Subformulario de checkout */}
            <div
              style={{
                borderTop: '1px solid var(--hr-line)',
                paddingTop: 16,
                marginTop: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                  display: 'block',
                }}
              >
                Entrega
              </span>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['Domicilio', 'Recoge en local'] as const).map((v) => {
                  const active = tipoEntrega === v
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTipoEntrega(v)}
                      style={{
                        ...CHIP_BASE,
                        ...(active ? CHIP_ACTIVE : CHIP_INACTIVE),
                      }}
                    >
                      {v}
                    </button>
                  )
                })}
              </div>

              {isDomicilio && (
                <>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      color: 'var(--text-secondary)',
                      margin: '6px 0 4px',
                    }}
                  >
                    Dirección de domicilio
                  </label>
                  <input
                    type="text"
                    placeholder="Calle, casa/apto, barrio..."
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: "'Inter', sans-serif",
                      boxSizing: 'border-box',
                      boxShadow: 'var(--input-shadow)',
                    }}
                  />
                </>
              )}

              <label
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  margin: '10px 0 4px',
                }}
              >
                Nombre de quien recibe
              </label>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombreRecibe}
                onChange={(e) => setNombreRecibe(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box',
                  boxShadow: 'var(--input-shadow)',
                }}
              />

              <label
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  margin: '10px 0 4px',
                }}
              >
                Contacto de quien recibe
              </label>
              <input
                type="text"
                placeholder="Número de contacto"
                value={contactoRecibe}
                onChange={(e) => setContactoRecibe(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box',
                  boxShadow: 'var(--input-shadow)',
                }}
              />

              <label
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  margin: '10px 0 4px',
                }}
              >
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box',
                  boxShadow: 'var(--input-shadow)',
                  cursor: 'pointer',
                }}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>

              {isEfectivo && (
                <>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      color: 'var(--text-secondary)',
                      margin: '10px 0 4px',
                    }}
                  >
                    ¿Con cuánto vas a pagar?
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 50000"
                    value={efectivoConQuePaga}
                    onChange={(e) => setEfectivoConQuePaga(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: "'Inter', sans-serif",
                      boxSizing: 'border-box',
                      boxShadow: 'var(--input-shadow)',
                    }}
                  />
                  {vueltasNote && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: conQuePagaNum >= total ? '#1f8a4c' : '#c81e1e',
                      }}
                    >
                      {vueltasNote}
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={finalizarPedido}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 999,
                background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                boxShadow:
                  'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 12px 26px rgba(228, 41, 38, 0.35)',
                marginTop: 14,
                transition: 'transform 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <IconoWhatsApp size={18} />
              <span>Finalizar pedido por WhatsApp</span>
            </button>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 11,
                color: 'rgba(24, 27, 34, 0.5)',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              Se abrirá WhatsApp con tu pedido y tus datos de entrega ya redactados — solo debes
              revisarlo y enviarlo.
            </p>
          </>
        ) : (
          <p
            style={{
              fontSize: 13,
              color: 'rgba(24, 27, 34, 0.55)',
              textAlign: 'center',
              marginTop: 40,
              lineHeight: 1.5,
            }}
          >
            Todavía no agregaste nada. Toca el + en un producto para armar tu pedido.
          </p>
        )}
      </div>
    </>
  )
}

