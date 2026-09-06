import type { Gasto } from '../../types/gasto'
import { StatusPill } from '../ui/StatusPill'

interface GastosTableProps {
  gastos: Gasto[]
}

export function GastosTable({ gastos }: GastosTableProps) {
  if (gastos.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '14px 0', fontSize: 13.5 }}>
        Todavía no hay gastos registrados.
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
            <th style={{ padding: '10px 12px' }}>Categoría</th>
            <th style={{ padding: '10px 12px' }}>Descripción</th>
            <th style={{ padding: '10px 12px' }}>Monto</th>
          </tr>
        </thead>
        <tbody>
          {gastos.map((gasto) => (
            <tr key={gasto.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
              <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                {gasto.fecha}
              </td>
              <td style={{ padding: '12px' }}>
                <StatusPill variant="neutral">{gasto.categoriaNombre}</StatusPill>
              </td>
              <td style={{ padding: '12px', fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>
                {gasto.descripcion}
              </td>
              <td style={{ padding: '12px', fontSize: 13.5, fontWeight: 700, color: 'var(--brand-red)' }}>
                ${gasto.monto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
