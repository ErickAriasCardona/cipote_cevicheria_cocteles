import type { Gasto } from '../../types/gasto'
import { StatusPill } from '../ui/StatusPill'
import { formatearCOP } from '../../utils/moneda'

interface GastosTableProps {
  gastos: Gasto[]
  onEditar?: (gasto: Gasto) => void
  onVerHistorial?: (gasto: Gasto) => void
}

export function GastosTable({ gastos, onEditar, onVerHistorial }: GastosTableProps) {
  if (gastos.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '14px 0', fontSize: 13.5 }}>
        No hay gastos registrados para los filtros seleccionados.
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr
            style={{
              borderBottom: '2px solid var(--hr-line)',
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: 'var(--text-faint)',
            }}
          >
            <th style={{ padding: '10px 12px' }}>Fecha</th>
            <th style={{ padding: '10px 12px' }}>Fuente de Pago</th>
            <th style={{ padding: '10px 12px' }}>Estado</th>
            <th style={{ padding: '10px 12px' }}>Categoría</th>
            <th style={{ padding: '10px 12px' }}>Descripción</th>
            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Monto</th>
            {(onEditar || onVerHistorial) && (
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {gastos.map((gasto) => (
            <tr key={gasto.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
              <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {gasto.fecha}
              </td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    background:
                      gasto.origen === 'caja'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(56, 126, 245, 0.15)',
                    color:
                      gasto.origen === 'caja'
                        ? 'var(--amber-text)'
                        : 'var(--brand-blue)',
                    border:
                      gasto.origen === 'caja'
                        ? '1px solid rgba(245, 158, 11, 0.3)'
                        : '1px solid rgba(56, 126, 245, 0.3)',
                  }}
                >
                  {gasto.origen === 'caja' ? 'Caja Menor' : 'Administrativa'}
                </span>
              </td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    background:
                      gasto.estadoPago === 'pagado'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      gasto.estadoPago === 'pagado'
                        ? '#10b981'
                        : '#ef4444',
                    border:
                      gasto.estadoPago === 'pagado'
                        ? '1px solid rgba(16, 185, 129, 0.35)'
                        : '1px solid rgba(239, 68, 68, 0.35)',
                  }}
                >
                  {gasto.estadoPago === 'pagado' ? 'Pagado' : 'No Pagado'}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <StatusPill variant="neutral">{gasto.categoriaNombre}</StatusPill>
              </td>
              <td style={{ padding: '12px', fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>
                {gasto.descripcion}
              </td>
              <td style={{ padding: '12px', fontSize: 13.5, fontWeight: 700, color: 'var(--amber-text)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {formatearCOP(gasto.monto)}
              </td>
              {(onEditar || onVerHistorial) && (
                <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    {onEditar && (
                      <button
                        type="button"
                        onClick={() => onEditar(gasto)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--card-border)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        Editar
                      </button>
                    )}
                    {onVerHistorial && (
                      <button
                        type="button"
                        onClick={() => onVerHistorial(gasto)}
                        title="Ver historial de cambios"
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: 'rgba(56, 126, 245, 0.1)',
                          border: '1px solid rgba(56, 126, 245, 0.3)',
                          color: 'var(--brand-blue)',
                          cursor: 'pointer',
                        }}
                      >
                        Historial
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
