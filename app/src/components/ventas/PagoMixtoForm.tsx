import type { MetodoPago, RegistrarVentaPagoInput } from '../../types/ventaPago'
import { centavos, sonPagosValidos } from '../../utils/pagoMixto'
import { Button } from '../ui/Button'

interface PagoMixtoFormProps {
  /** Total de la venta en curso (cantidad × precio del producto elegido). */
  total: number
  pagos: RegistrarVentaPagoInput[]
  onChange: (pagos: RegistrarVentaPagoInput[]) => void
}

const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  nequi: 'Nequi',
  credito_rappi: 'Crédito Rappi',
  transferencia_qr: 'Transferencia / QR',
}

const METODOS_PAGO = Object.keys(ETIQUETAS_METODO_PAGO) as MetodoPago[]

/**
 * Selector de método(s) de pago con distribución de montos (RF-03.3/03.4,
 * pago mixto). Validación en vivo de RN-006 replicando en centavos.
 */
export function PagoMixtoForm({ total, pagos, onChange }: PagoMixtoFormProps) {
  const sumaCentavos = pagos.reduce((acc, pago) => acc + centavos(pago.monto || 0), 0)
  const totalCentavos = centavos(total)
  const diferenciaCentavos = totalCentavos - sumaCentavos
  const cuadra = sonPagosValidos(total, pagos)

  function actualizarPago(indice: number, cambios: Partial<RegistrarVentaPagoInput>) {
    onChange(pagos.map((pago, i) => (i === indice ? { ...pago, ...cambios } : pago)))
  }

  function agregarPago() {
    onChange([...pagos, { metodoPago: 'efectivo', monto: 0 }])
  }

  function quitarPago(indice: number) {
    onChange(pagos.filter((_, i) => i !== indice))
  }

  const fmt = (n: number) =>
    '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          marginBottom: 10,
        }}
      >
        Forma de Pago
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pagos.map((pago, indice) => {
          const esEfectivo = pago.metodoPago === 'efectivo'
          const monto = pago.monto || 0
          const recibido = pago.pagaCon !== undefined ? pago.pagaCon : monto
          const devuelta = Math.max(0, Math.round((recibido - monto) * 100) / 100)
          const falta = Math.max(0, Math.round((monto - recibido) * 100) / 100)
          const esInsuficiente = pago.pagaCon !== undefined && pago.pagaCon < monto

          return (
            <div
              key={indice}
              style={{
                background:
                  'var(--sheen), linear-gradient(150deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                border: '1px solid var(--hr-line)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Fila: Selector de Método de pago y Monto (solo si no es efectivo o hay múltiples métodos) */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor={`pago_metodo_${indice}`}
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 5,
                    }}
                  >
                    Método de pago
                  </label>
                  <select
                    id={`pago_metodo_${indice}`}
                    value={pago.metodoPago}
                    onChange={(e) => {
                      const nuevoMetodo = e.target.value as MetodoPago
                      actualizarPago(indice, {
                        metodoPago: nuevoMetodo,
                        pagaCon: nuevoMetodo === 'efectivo' ? (pago.pagaCon ?? pago.monto) : undefined,
                      })
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      borderRadius: 9,
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      fontFamily: 'var(--sans)',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    {METODOS_PAGO.map((metodo) => (
                      <option key={metodo} value={metodo}>
                        {ETIQUETAS_METODO_PAGO[metodo]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Si no es efectivo, mostrar campo de monto */}
                {!esEfectivo && (
                  <div style={{ width: 120 }}>
                    <label
                      htmlFor={`pago_monto_${indice}`}
                      style={{
                        display: 'block',
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: 5,
                      }}
                    >
                      Monto
                    </label>
                    <input
                      id={`pago_monto_${indice}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={pago.monto || ''}
                      onChange={(e) => {
                        const nuevoMonto = Number(e.target.value)
                        actualizarPago(indice, { monto: nuevoMonto })
                      }}
                      style={{
                        width: '100%',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        borderRadius: 9,
                        padding: '9px 12px',
                        color: 'var(--text-primary)',
                        fontSize: 13.5,
                        fontWeight: 700,
                        fontFamily: 'var(--sans)',
                        boxSizing: 'border-box',
                        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                        outline: 'none',
                      }}
                      required
                    />
                  </div>
                )}

                {pagos.length > 1 && (
                  <div style={{ paddingTop: 20 }}>
                    <button
                      type="button"
                      onClick={() => quitarPago(indice)}
                      title="Quitar método"
                      style={{
                        width: 34,
                        height: 38,
                        borderRadius: 9,
                        border: '1px solid var(--dashed-border)',
                        color: 'var(--dashed-color)',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
                        background: 'var(--dashed-bg)',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Si es EFECTIVO: 2 COLUMNAS (RECIBIDO y DEVUELTA), un solo input editable */}
              {esEfectivo && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    alignItems: 'start',
                    marginTop: 2,
                  }}
                >
                  {/* Columna 1: Recibido */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 5,
                      }}
                    >
                      <label
                        htmlFor={`pago_recibido_${indice}`}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Recibido
                      </label>
                      <button
                        type="button"
                        onClick={() => actualizarPago(indice, { pagaCon: monto })}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--brand-blue)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Exacto
                      </button>
                    </div>

                    <div style={{ position: 'relative', width: '100%' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-faint)',
                        }}
                      >
                        $
                      </span>
                      <input
                        id={`pago_recibido_${indice}`}
                        type="number"
                        min="0"
                        step="100"
                        placeholder={String(monto)}
                        value={pago.pagaCon ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value)
                          actualizarPago(indice, { pagaCon: val })
                        }}
                        style={{
                          width: '100%',
                          height: 42,
                          paddingLeft: 26,
                          paddingRight: 10,
                          background: 'var(--input-bg)',
                          border: esInsuficiente
                            ? '1px solid var(--red-text)'
                            : '1px solid var(--input-border)',
                          borderRadius: 9,
                          color: 'var(--text-primary)',
                          fontSize: 14.5,
                          fontWeight: 700,
                          fontFamily: 'var(--sans)',
                          outline: 'none',
                          boxSizing: 'border-box',
                          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                        }}
                      />
                    </div>

                    {/* Chips rápidos de billetes debajo del input de recibido */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {[10000, 20000, 50000, 100000].map((billete) => {
                        if (billete < monto && billete !== 10000) return null
                        const activo = pago.pagaCon === billete
                        return (
                          <button
                            key={billete}
                            type="button"
                            onClick={() => actualizarPago(indice, { pagaCon: billete })}
                            style={{
                              padding: '2px 7px',
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              background: activo
                                ? 'rgba(46, 158, 91, 0.25)'
                                : 'rgba(255, 255, 255, 0.05)',
                              color: activo ? 'var(--green-text)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            ${billete >= 1000 ? `${billete / 1000}k` : billete}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Columna 2: Devuelta */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: 5,
                      }}
                    >
                      Devuelta
                    </label>
                    <div
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 12px',
                        background:
                          devuelta > 0
                            ? 'var(--sheen), linear-gradient(135deg, rgba(46, 158, 91, 0.22), rgba(46, 158, 91, 0.08))'
                            : esInsuficiente
                              ? 'rgba(228, 41, 38, 0.12)'
                              : 'var(--input-bg)',
                        border:
                          devuelta > 0
                            ? '1px solid rgba(46, 158, 91, 0.4)'
                            : esInsuficiente
                              ? '1px solid rgba(228, 41, 38, 0.35)'
                              : '1px solid var(--input-border)',
                        color:
                          devuelta > 0
                            ? 'var(--green-text)'
                            : esInsuficiente
                              ? 'var(--red-text)'
                              : 'var(--text-primary)',
                        fontSize: esInsuficiente ? 12 : 16,
                        fontWeight: 800,
                        fontFamily: 'var(--sans)',
                        boxSizing: 'border-box',
                        boxShadow: devuelta > 0 ? '0 0 10px rgba(46, 158, 91, 0.15)' : 'none',
                      }}
                    >
                      {esInsuficiente ? `Faltan ${fmt(falta)}` : fmt(devuelta)}
                    </div>

                    {devuelta > 0 && (
                      <span
                        style={{
                          display: 'block',
                          marginTop: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--green-text)',
                          textAlign: 'center',
                        }}
                      >
                        Cambio a entregar
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Banner de concordancia / discrepancia: solo visible si no cuadra o hay pago mixto múltiple */}
      {(!cuadra || pagos.length > 1) && (
        <div
          style={{
            margin: '12px 0',
            padding: '9px 12px',
            borderRadius: 10,
            fontSize: 12.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: cuadra
              ? '1px solid rgba(46, 158, 91, 0.3)'
              : '1px solid rgba(228, 41, 38, 0.3)',
            color: cuadra ? 'var(--green-text)' : 'var(--red-text)',
            background: cuadra
              ? 'rgba(46, 158, 91, 0.08)'
              : 'rgba(228, 41, 38, 0.08)',
          }}
        >
          {pagos.length === 0
            ? 'Agrega al menos un método de pago.'
            : cuadra
              ? 'La suma de los métodos coincide con el total.'
              : diferenciaCentavos > 0
                ? `Faltan ${fmt(diferenciaCentavos / 100)} por distribuir.`
                : `Sobran ${fmt(Math.abs(diferenciaCentavos) / 100)} respecto al total.`}
        </div>
      )}

      <Button
        type="button"
        variant="dashed"
        fullWidth
        size="sm"
        onClick={agregarPago}
        style={{ marginTop: 12, marginBottom: 14 }}
      >
        + Dividir pago / Pago mixto
      </Button>

      <div
        style={{
          borderTop: '1px solid var(--hr-line)',
          paddingTop: 12,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: 13,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Total a cobrar:</span>
          <strong style={{ color: 'var(--text-primary)' }}>{fmt(total)}</strong>
        </div>
        {pagos.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Suma distribuida:</span>
            <strong style={{ color: cuadra ? 'var(--green-text)' : 'var(--text-primary)' }}>
              {fmt(sumaCentavos / 100)}
            </strong>
          </div>
        )}
      </div>
    </div>
  )
}
