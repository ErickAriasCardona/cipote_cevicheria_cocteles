import type { CierreCaja } from '../../types/cierreCaja'
import type { TransferenciaTurno } from '../../services/transferenciasService'
import { StatusPill } from '../ui/StatusPill'
import { etiquetaDiferenciaDinero } from '../../utils/formatoCierreCaja'
import { formatearCOP } from '../../utils/moneda'
import { IconoCheck } from '../ui/IconosFormas'

interface BalanceTransferenciasCierreProps {
  cierre: CierreCaja
  transferencias: TransferenciaTurno[]
  cargandoTransferencias?: boolean
}

export function BalanceTransferenciasCierre({
  cierre,
  transferencias,
  cargandoTransferencias = false,
}: BalanceTransferenciasCierreProps) {
  const exitosas = transferencias.filter((t) => t.pago.estadoTransferencia === 'exitosa')
  const pendientes = transferencias.filter((t) => t.pago.estadoTransferencia === 'pendiente')
  const rechazadas = transferencias.filter((t) => t.pago.estadoTransferencia === 'rechazada_cancelada')

  const montoExitosas = exitosas.reduce((sum, t) => sum + Number(t.pago.monto), 0)
  const montoPendientes = pendientes.reduce((sum, t) => sum + Number(t.pago.monto), 0)
  const montoRechazadas = rechazadas.reduce((sum, t) => sum + Number(t.pago.monto), 0)

  const otrosMedios = Number(cierre.totalTarjeta) + Number(cierre.totalNequi) + Number(cierre.totalRappi)
  const gastosCaja = Number(cierre.totalGastosCaja ?? 0)
  const efectivoEsperado = Math.max(0, Number(cierre.totalEfectivo) - gastosCaja)

  const esDiferenciaPositivaOSinDiferencia = cierre.diferencia >= 0
  const colorResultado = esDiferenciaPositivaOSinDiferencia ? 'var(--green-text)' : 'var(--red-text)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tarjetas comparativas de Efectivo vs Transferencias vs Otros */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {/* Tarjeta 1: Efectivo */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--input-border)',
            background: 'var(--sheen), var(--input-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Efectivo en Caja
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
              }}
            >
              Físico
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Ventas en efectivo:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatearCOP(cierre.totalEfectivo)}
            </span>
          </div>

          {gastosCaja > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--amber-text)' }}>
              <span>(-) Gastos de caja:</span>
              <span style={{ fontWeight: 700 }}>
                -{formatearCOP(gastosCaja)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Efectivo esperado:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatearCOP(efectivoEsperado)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Dinero contado:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatearCOP(cierre.dineroContado)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              paddingTop: 6,
              borderTop: '1px solid var(--hr-line)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Cuadre efectivo:</span>
            <span style={{ fontWeight: 800, color: colorResultado }}>
              {etiquetaDiferenciaDinero(cierre.diferencia)}
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Transferencias y QR */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--input-border)',
            background: 'var(--sheen), var(--input-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Transferencias / QR
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(56, 139, 253, 0.15)',
                color: 'var(--brand-blue)',
              }}
            >
              Bancos / Apps
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Exitosas (sumadas):</span>
            <span style={{ fontWeight: 700, color: 'var(--green-text)' }}>
              {formatearCOP(cierre.totalTransferenciaExitosa ?? montoExitosas)} ({exitosas.length})
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Pendientes (no sumadas):</span>
            <span
              style={{
                fontWeight: 700,
                color: montoPendientes > 0 ? 'var(--amber-text)' : 'var(--text-secondary)',
              }}
            >
              {formatearCOP(montoPendientes)} ({pendientes.length})
            </span>
          </div>
          {montoRechazadas > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Rechazadas:</span>
              <span style={{ fontWeight: 600, color: 'var(--red-text)' }}>
                {formatearCOP(montoRechazadas)} ({rechazadas.length})
              </span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              paddingTop: 6,
              borderTop: '1px solid var(--hr-line)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total transferencias:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatearCOP(cierre.totalTransferenciaExitosa)}
            </span>
          </div>
        </div>

        {/* Tarjeta 3: Otros Medios Electrónicos y Total */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--input-border)',
            background: 'var(--sheen), var(--input-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Otros Canales & Total
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
              }}
            >
              Digitales
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Datáfono / Nequi / Rappi:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatearCOP(otrosMedios)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total esperado ventas:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatearCOP(cierre.totalEsperado)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              paddingTop: 6,
              borderTop: '1px solid var(--hr-line)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Efectivo + Transf.:</span>
            <span style={{ fontWeight: 800, color: 'var(--brand-blue)' }}>
              {formatearCOP(Number(cierre.totalEfectivo) + Number(cierre.totalTransferenciaExitosa))}
            </span>
          </div>
        </div>
      </div>

      {/* Desglose individual de los 5 métodos de pago según ventas */}
      <div
        style={{
          padding: 16,
          borderRadius: 14,
          border: '1px solid var(--input-border)',
          background: 'var(--sheen), var(--input-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Ventas por Método de Pago
          </h4>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Total ventas: {formatearCOP(cierre.totalEsperado)}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Efectivo</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
              {formatearCOP(cierre.totalEfectivo)}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(56, 139, 253, 0.05)', border: '1px solid rgba(56, 139, 253, 0.25)' }}>
            <div style={{ fontSize: 11, color: 'var(--brand-blue)', fontWeight: 600 }}>Transferencia bancaria</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
              {formatearCOP(cierre.totalTransferenciaExitosa)}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(65, 175, 224, 0.08)', border: '1px solid rgba(65, 175, 224, 0.25)' }}>
            <div style={{ fontSize: 11, color: 'var(--brand-blue)', fontWeight: 600 }}>Nequi</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
              {formatearCOP(cierre.totalNequi)}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255, 68, 31, 0.05)', border: '1px solid rgba(255, 68, 31, 0.25)' }}>
            <div style={{ fontSize: 11, color: '#ff441f', fontWeight: 600 }}>Rappi</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
              {formatearCOP(cierre.totalRappi)}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ fontSize: 11, color: 'var(--brand-green)', fontWeight: 600 }}>Datáfono</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
              {formatearCOP(cierre.totalTarjeta)}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta si quedaron transferencias pendientes sin confirmar */}
      {pendientes.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(217, 119, 6, 0.12)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            color: 'var(--text-primary)',
          }}
        >
          <div>
            <strong>Atención:</strong> En este turno quedaron{' '}
            <strong>{pendientes.length} transferencia(s) pendiente(s)</strong> por un total de{' '}
            <strong>{formatearCOP(montoPendientes)}</strong>. Por regla de negocio (RN-007), no fueron sumadas
            al total esperado del cierre.
          </div>
        </div>
      )}

      {/* Trazabilidad detallada de transferencias del turno */}
      <div>
        <h4
          style={{
            margin: '0 0 10px',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Trazabilidad de transferencias del turno
        </h4>

        {cargandoTransferencias ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Consultando transferencias del turno…
          </p>
        ) : transferencias.length === 0 ? (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            No se realizaron pagos por transferencia/QR durante este turno.
          </div>
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: '1px solid var(--input-border)',
              background: 'var(--sheen), var(--input-bg)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--hr-line)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    color: 'var(--text-faint)',
                  }}
                >
                  <th style={{ padding: '8px 12px' }}>Hora</th>
                  <th style={{ padding: '8px 12px' }}>Venta</th>
                  <th style={{ padding: '8px 12px' }}>Monto Transf.</th>
                  <th style={{ padding: '8px 12px' }}>Estado</th>
                  <th style={{ padding: '8px 12px' }}>Impacto en Cierre</th>
                </tr>
              </thead>
              <tbody>
                {transferencias.map((t) => {
                  const est = t.pago.estadoTransferencia ?? 'pendiente'
                  const variant =
                    est === 'exitosa' ? 'positive' : est === 'pendiente' ? 'neutral' : 'destructive'
                  const label =
                    est === 'exitosa'
                      ? 'Exitosa'
                      : est === 'pendiente'
                        ? 'Pendiente'
                        : 'Rechazada'

                  return (
                    <tr key={t.pago.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                        {new Date(t.venta.createdAt).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                        Venta ({t.venta.cantidad} {t.venta.cantidad === 1 ? 'vaso' : 'vasos'} — {formatearCOP(t.venta.total)})
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatearCOP(t.pago.monto)}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <StatusPill variant={variant}>{label}</StatusPill>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 11.5 }}>
                        {est === 'exitosa' ? (
                          <span style={{ color: 'var(--green-text)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <IconoCheck size={12} strokeWidth={2.4} />
                            <span>Contabilizada en total</span>
                          </span>
                        ) : est === 'pendiente' ? (
                          <span style={{ color: 'var(--amber-text)', fontWeight: 600 }}>
                            Excluida (Pendiente)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--red-text)', fontWeight: 600 }}>
                            Excluida (Rechazada)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
