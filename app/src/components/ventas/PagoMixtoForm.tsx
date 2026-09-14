import type { MetodoPago, RegistrarVentaPagoInput } from '../../types/ventaPago'
import { centavos, sonPagosValidos } from '../../utils/pagoMixto'
import { formatearCOP } from '../../utils/moneda'
import { Button } from '../ui/Button'
import { IconoCruz } from '../ui/IconosFormas'

interface PagoMixtoFormProps {
  /** Total de la venta en curso */
  total: number
  pagos: RegistrarVentaPagoInput[]
  onChange: (pagos: RegistrarVentaPagoInput[]) => void
}

type CategoriaPago = 'efectivo' | 'transferencias' | 'rappi' | 'mixto'
type SubOpcionTransferencia = 'nequi' | 'bre_b' | 'datafono' | 'transferencia_bancaria'

interface MetodoOpcion {
  id: string
  label: string
  metodoPago: MetodoPago
  subMetodo?: string
}

const OPCIONES_METODOS: MetodoOpcion[] = [
  { id: 'efectivo', label: 'Efectivo', metodoPago: 'efectivo' },
  { id: 'nequi', label: 'Nequi', metodoPago: 'nequi', subMetodo: 'Nequi' },
  { id: 'bre_b', label: 'Bre-B', metodoPago: 'transferencia_qr', subMetodo: 'Bre-B' },
  { id: 'datafono', label: 'Datáfono', metodoPago: 'tarjeta', subMetodo: 'Datáfono' },
  { id: 'transferencia_bancaria', label: 'Transferencia Bancaria', metodoPago: 'transferencia_qr', subMetodo: 'Transferencia Bancaria' },
  { id: 'credito_rappi', label: 'Rappi', metodoPago: 'credito_rappi' },
]

export function PagoMixtoForm({ total, pagos, onChange }: PagoMixtoFormProps) {
  // Detectar categoría activa
  let categoriaActiva: CategoriaPago = 'efectivo'
  if (pagos.length > 1) {
    categoriaActiva = 'mixto'
  } else if (pagos.length === 1) {
    const primer = pagos[0]
    if (primer.metodoPago === 'efectivo') {
      categoriaActiva = 'efectivo'
    } else if (primer.metodoPago === 'credito_rappi') {
      categoriaActiva = 'rappi'
    } else {
      categoriaActiva = 'transferencias'
    }
  }

  // Detectar subopción activa de transferencias
  const primerPago = pagos[0]
  let subTransferenciaActiva: SubOpcionTransferencia = 'nequi'
  if (primerPago) {
    if (primerPago.subMetodo === 'Bre-B') subTransferenciaActiva = 'bre_b'
    else if (primerPago.subMetodo === 'Datáfono' || primerPago.metodoPago === 'tarjeta') subTransferenciaActiva = 'datafono'
    else if (primerPago.subMetodo === 'Transferencia Bancaria') subTransferenciaActiva = 'transferencia_bancaria'
    else if (primerPago.metodoPago === 'nequi') subTransferenciaActiva = 'nequi'
  }

  const sumaCentavos = pagos.reduce((acc, pago) => acc + centavos(pago.monto || 0), 0)
  const totalCentavos = centavos(total)
  const diferenciaCentavos = totalCentavos - sumaCentavos
  const cuadra = sonPagosValidos(total, pagos)

  // Cálculos para desglose de efectivo y devuelta
  const pagosEfectivo = pagos.filter((p) => p.metodoPago === 'efectivo')
  const totalEfectivoCobrado = pagosEfectivo.reduce((acc, p) => acc + (p.monto || 0), 0)
  const totalEfectivoRecibido = pagosEfectivo.reduce((acc, p) => acc + (p.pagaCon ?? p.monto ?? 0), 0)
  const totalDevuelta = Math.max(0, Math.round(totalEfectivoRecibido - totalEfectivoCobrado))
  const tieneEfectivo = pagosEfectivo.length > 0

  // Pagos por transferencia que requieren aprobación
  const pagosTransferencia = pagos.filter((p) =>
    p.metodoPago === 'transferencia_qr' ||
    p.metodoPago === 'nequi' ||
    p.subMetodo === 'Nequi' ||
    p.subMetodo === 'Bre-B' ||
    p.subMetodo === 'Transferencia Bancaria'
  )
  const totalTransferencias = pagosTransferencia.reduce((acc, p) => acc + (p.monto || 0), 0)
  const tieneTransferencias = pagosTransferencia.length > 0

  function etiquetaMetodoPago(pago: RegistrarVentaPagoInput): string {
    if (pago.subMetodo) return pago.subMetodo
    if (pago.metodoPago === 'efectivo') return 'Efectivo'
    if (pago.metodoPago === 'nequi') return 'Nequi'
    if (pago.metodoPago === 'credito_rappi') return 'Rappi'
    if (pago.metodoPago === 'tarjeta') return 'Datáfono'
    return 'Transferencia QR'
  }

  function seleccionarCategoria(cat: CategoriaPago) {
    if (cat === 'efectivo') {
      onChange([{ metodoPago: 'efectivo', monto: total, pagaCon: total }])
    } else if (cat === 'transferencias') {
      seleccionarSubTransferencia(subTransferenciaActiva)
    } else if (cat === 'rappi') {
      onChange([{ metodoPago: 'credito_rappi', monto: total }])
    } else if (cat === 'mixto') {
      const mitad = Math.round(total / 2)
      onChange([
        { metodoPago: 'efectivo', monto: mitad, pagaCon: mitad },
        { metodoPago: 'nequi', monto: total - mitad, subMetodo: 'Nequi' },
      ])
    }
  }

  function seleccionarSubTransferencia(sub: SubOpcionTransferencia) {
    if (sub === 'nequi') {
      onChange([{ metodoPago: 'nequi', monto: total, subMetodo: 'Nequi' }])
    } else if (sub === 'bre_b') {
      onChange([{ metodoPago: 'transferencia_qr', monto: total, subMetodo: 'Bre-B' }])
    } else if (sub === 'datafono') {
      onChange([{ metodoPago: 'tarjeta', monto: total, subMetodo: 'Datáfono' }])
    } else if (sub === 'transferencia_bancaria') {
      onChange([{ metodoPago: 'transferencia_qr', monto: total, subMetodo: 'Transferencia Bancaria' }])
    }
  }

  function actualizarPago(indice: number, cambios: Partial<RegistrarVentaPagoInput>) {
    onChange(pagos.map((pago, i) => (i === indice ? { ...pago, ...cambios } : pago)))
  }

  function agregarPagoMixto() {
    const restante = Math.max(0, Math.round(diferenciaCentavos / 100))
    onChange([...pagos, { metodoPago: 'efectivo', monto: restante, pagaCon: restante }])
  }

  function quitarPago(indice: number) {
    onChange(pagos.filter((_, i) => i !== indice))
  }

  return (
    <div style={{ marginTop: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12.5,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          marginBottom: 10,
        }}
      >
        Método de Pago
      </label>

      {/* Pestañas Principales de Pago */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          onClick={() => seleccionarCategoria('efectivo')}
          style={{
            padding: '10px 6px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: categoriaActiva === 'efectivo'
              ? '2px solid var(--brand-blue)'
              : '1px solid var(--card-border)',
            background: categoriaActiva === 'efectivo'
              ? 'rgba(56, 126, 245, 0.16)'
              : 'var(--card-bg)',
            color: categoriaActiva === 'efectivo'
              ? 'var(--brand-blue)'
              : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          Efectivo
        </button>

        <button
          type="button"
          onClick={() => seleccionarCategoria('transferencias')}
          style={{
            padding: '10px 6px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: categoriaActiva === 'transferencias'
              ? '2px solid var(--brand-blue)'
              : '1px solid var(--card-border)',
            background: categoriaActiva === 'transferencias'
              ? 'rgba(56, 126, 245, 0.16)'
              : 'var(--card-bg)',
            color: categoriaActiva === 'transferencias'
              ? 'var(--brand-blue)'
              : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          Transferencias
        </button>

        <button
          type="button"
          onClick={() => seleccionarCategoria('rappi')}
          style={{
            padding: '10px 6px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: categoriaActiva === 'rappi'
              ? '2px solid var(--brand-blue)'
              : '1px solid var(--card-border)',
            background: categoriaActiva === 'rappi'
              ? 'rgba(56, 126, 245, 0.16)'
              : 'var(--card-bg)',
            color: categoriaActiva === 'rappi'
              ? 'var(--brand-blue)'
              : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          Rappi
        </button>

        <button
          type="button"
          onClick={() => seleccionarCategoria('mixto')}
          style={{
            padding: '10px 6px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: categoriaActiva === 'mixto'
              ? '2px solid var(--brand-blue)'
              : '1px solid var(--card-border)',
            background: categoriaActiva === 'mixto'
              ? 'rgba(56, 126, 245, 0.16)'
              : 'var(--card-bg)',
            color: categoriaActiva === 'mixto'
              ? 'var(--brand-blue)'
              : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          Mixto
        </button>
      </div>

      {/* Sub-opciones de Transferencias */}
      {categoriaActiva === 'transferencias' && (
        <div
          style={{
            marginBottom: 14,
            padding: '12px',
            borderRadius: 12,
            background: 'var(--input-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Tipo de transferencia o terminal:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { id: 'nequi', label: 'Nequi' },
              { id: 'bre_b', label: 'Bre-B' },
              { id: 'datafono', label: 'Datáfono' },
              { id: 'transferencia_bancaria', label: 'Transferencia Bancaria' },
            ].map((opc) => {
              const activo = subTransferenciaActiva === opc.id
              return (
                <button
                  key={opc.id}
                  type="button"
                  onClick={() => seleccionarSubTransferencia(opc.id as SubOpcionTransferencia)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: activo
                      ? '2px solid var(--brand-blue)'
                      : '1px solid var(--card-border)',
                    background: activo
                      ? 'rgba(56, 126, 245, 0.2)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: activo ? 'var(--brand-blue)' : 'var(--text-primary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opc.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Cuerpo de Pagos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pagos.map((pago, indice) => {
          const esEfectivo = pago.metodoPago === 'efectivo'
          const monto = pago.monto || 0
          const recibido = pago.pagaCon !== undefined ? pago.pagaCon : monto
          const devuelta = Math.max(0, Math.round(recibido - monto))
          const falta = Math.max(0, Math.round(monto - recibido))
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
              {/* En modo Mixto, selector de método y campo de monto editable para CADA método */}
              {categoriaActiva === 'mixto' && (
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
                      Método #{indice + 1}
                    </label>
                    <select
                      id={`pago_metodo_${indice}`}
                      value={
                        pago.subMetodo === 'Bre-B'
                          ? 'bre_b'
                          : pago.subMetodo === 'Datáfono'
                            ? 'datafono'
                            : pago.subMetodo === 'Transferencia Bancaria'
                              ? 'transferencia_bancaria'
                              : pago.metodoPago === 'nequi'
                                ? 'nequi'
                                : pago.metodoPago === 'credito_rappi'
                                  ? 'credito_rappi'
                                  : 'efectivo'
                      }
                      onChange={(e) => {
                        const seleccion = e.target.value
                        const encontrado = OPCIONES_METODOS.find((o) => o.id === seleccion)
                        if (encontrado) {
                          actualizarPago(indice, {
                            metodoPago: encontrado.metodoPago,
                            subMetodo: encontrado.subMetodo,
                            pagaCon: encontrado.metodoPago === 'efectivo' ? monto : undefined,
                          })
                        }
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
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      {OPCIONES_METODOS.map((metodo) => (
                        <option key={metodo.id} value={metodo.id}>
                          {metodo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campo de Monto: VISIBLE Y EDITABLE PARA TODOS LOS MÉTODOS EN MIXTO */}
                  <div style={{ width: 140 }}>
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
                      Monto a cobrar
                    </label>
                    <input
                      id={`pago_monto_${indice}`}
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0"
                      value={pago.monto || ''}
                      onChange={(e) => {
                        const nuevoMonto = Math.max(0, Math.round(Number(e.target.value) || 0))
                        actualizarPago(indice, {
                          monto: nuevoMonto,
                          pagaCon: esEfectivo ? nuevoMonto : undefined,
                        })
                      }}
                      style={{
                        width: '100%',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        borderRadius: 9,
                        padding: '9px 12px',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: 'var(--sans)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      required
                    />
                  </div>

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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--dashed-bg)',
                        }}
                        aria-label="Quitar pago"
                      >
                        <IconoCruz size={13} strokeWidth={2.4} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Si es EFECTIVO (sea directo o renglón en Mixto): Recibido y Devuelta */}
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
                        Efectivo Recibido
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
                        step="1"
                        placeholder={String(monto)}
                        value={pago.pagaCon ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Math.round(Number(e.target.value))
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
                        }}
                      />
                    </div>

                    {/* Botones de billetes rápidos */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {[10000, 20000, 50000, 100000].map((billete) => {
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
                      }}
                    >
                      {esInsuficiente ? `Faltan ${formatearCOP(falta)}` : formatearCOP(devuelta)}
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

      {/* Botón y Banner en Pago Mixto */}
      {categoriaActiva === 'mixto' && (
        <>
          <Button
            type="button"
            variant="dashed"
            fullWidth
            size="sm"
            onClick={agregarPagoMixto}
            style={{ marginTop: 12, marginBottom: 10 }}
          >
            + Agregar método de pago
          </Button>

          <div
            style={{
              margin: '8px 0 12px',
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
            {cuadra
              ? 'La suma de los métodos coincide exactamente con el total.'
              : diferenciaCentavos > 0
                ? `Faltan ${formatearCOP(diferenciaCentavos / 100)} por distribuir.`
                : `Sobran ${formatearCOP(Math.abs(diferenciaCentavos) / 100)} respecto al total.`}
          </div>
        </>
      )}

      {/* Resumen Total, Métodos de Pago y Devuelta */}
      <div
        style={{
          borderTop: '1px solid var(--hr-line)',
          paddingTop: 14,
          marginTop: 14,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 13,
        }}
      >
        {/* Desglose de métodos seleccionados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'var(--text-faint)',
              marginBottom: 2,
            }}
          >
            Métodos seleccionados:
          </div>
          {pagos.map((p, idx) => {
            const esTransf =
              p.metodoPago === 'transferencia_qr' ||
              p.metodoPago === 'nequi' ||
              p.subMetodo === 'Nequi' ||
              p.subMetodo === 'Bre-B' ||
              p.subMetodo === 'Transferencia Bancaria'
            const esEfec = p.metodoPago === 'efectivo'
            const dev = esEfec && p.pagaCon !== undefined ? Math.max(0, Math.round((p.pagaCon || 0) - (p.monto || 0))) : 0

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '3px 0',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--brand-blue, #41afe0)' }}>•</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{etiquetaMetodoPago(p)}:</strong>
                  <span>{formatearCOP(p.monto || 0)}</span>
                  {esEfec && p.pagaCon !== undefined && p.pagaCon > (p.monto || 0) && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                      (Recibe {formatearCOP(p.pagaCon)} | Devuelta {formatearCOP(dev)})
                    </span>
                  )}
                </div>
                {esTransf && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#b45309',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    Pendiente
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: '1px dashed var(--hr-line)', margin: '2px 0' }} />

        {/* Totales */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Total a cobrar:</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: 16 }}>
            {formatearCOP(total)}
          </strong>
        </div>

        {pagos.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Suma distribuida:</span>
            <strong style={{ color: cuadra ? 'var(--green-text)' : 'var(--red-text)', fontSize: 15 }}>
              {formatearCOP(sumaCentavos / 100)}
            </strong>
          </div>
        )}

        {tieneEfectivo && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Efectivo recibido:</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>
              {formatearCOP(totalEfectivoRecibido)}
            </strong>
          </div>
        )}

        {/* Banner destacado de Devuelta / Cambio a entregar */}
        {tieneEfectivo && totalDevuelta > 0 && (
          <div
            style={{
              marginTop: 4,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(46, 158, 91, 0.12)',
              border: '1.5px solid rgba(46, 158, 91, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(46, 158, 91, 0.12)',
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--green-text)', letterSpacing: 0.4 }}>
                Cambio / Devuelta a entregar:
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Recibido {formatearCOP(totalEfectivoRecibido)} - Cobrado {formatearCOP(totalEfectivoCobrado)}
              </div>
            </div>
            <strong style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-text)' }}>
              {formatearCOP(totalDevuelta)}
            </strong>
          </div>
        )}

        {/* Aviso de validación para Transferencias */}
        {tieneTransferencias && (
          <div
            style={{
              marginTop: 4,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: 12,
              lineHeight: 1.45,
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <strong style={{ color: '#d97706', fontSize: 12.5 }}>
                Valor por Transferencia: {formatearCOP(totalTransferencias)}
              </strong>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#b45309',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                Requiere Aprobación
              </span>
            </div>
            <div>
              <strong>Aviso a cajera:</strong> Este valor queda en estado <em>Pendiente</em> y debe ser validado con comprobante en el módulo de <strong>Transferencias</strong> para que ingrese al balance final de caja.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
