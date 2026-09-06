import { useState } from 'react'
import type { EstadoTransferencia } from '../../types/ventaPago'
import type { TransferenciaTurno } from '../../services/transferenciasService'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface TransferenciasListProps {
  transferencias: TransferenciaTurno[]
  onCambiarEstado: (pagoId: string, nuevoEstado: EstadoTransferencia) => void
}

const ESTADOS: EstadoTransferencia[] = ['pendiente', 'exitosa', 'rechazada_cancelada']

const ETIQUETAS_ESTADO: Record<EstadoTransferencia, string> = {
  pendiente: 'Pendiente',
  exitosa: 'Exitosa',
  rechazada_cancelada: 'Rechazada/Cancelada',
}

interface FilaTransferenciaProps {
  transferencia: TransferenciaTurno
  onCambiarEstado: TransferenciasListProps['onCambiarEstado']
}

function FilaTransferencia({ transferencia, onCambiarEstado }: FilaTransferenciaProps) {
  const { confirmar } = useConfirmacion()
  const { pago, venta } = transferencia
  const estadoActual = pago.estadoTransferencia ?? 'pendiente'
  const [estado, setEstado] = useState<EstadoTransferencia>(estadoActual)

  async function handleGuardar() {
    const ok = await confirmar({
      titulo: 'Cambiar estado de transferencia',
      mensaje: `¿Confirmas cambiar el estado de esta transferencia de "${ETIQUETAS_ESTADO[estadoActual]}" a "${ETIQUETAS_ESTADO[estado]}"?`,
      textoConfirmar: 'Cambiar estado',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    onCambiarEstado(pago.id, estado)
  }

  const fmt = (n: number) =>
    '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const pillVariant =
    estadoActual === 'exitosa'
      ? 'positive'
      : estadoActual === 'rechazada_cancelada'
        ? 'destructive'
        : 'neutral'

  return (
    <tr style={{ borderBottom: '1px solid var(--hr-line)' }}>
      <td style={{ padding: '14px 8px', fontSize: 13, color: 'var(--text-primary)' }}>
        {new Date(venta.createdAt).toLocaleString('es-CO')}
      </td>
      <td style={{ padding: '14px 8px', fontSize: 13, color: 'var(--text-primary)' }}>
        {venta.cantidad}
      </td>
      <td style={{ padding: '14px 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        {fmt(venta.total)}
      </td>
      <td style={{ padding: '14px 8px', fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)' }}>
        {fmt(pago.monto)}
      </td>
      <td style={{ padding: '14px 8px' }}>
        <StatusPill variant={pillVariant}>{ETIQUETAS_ESTADO[estadoActual]}</StatusPill>
      </td>
      <td style={{ padding: '14px 8px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoTransferencia)}
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12.5,
              color: 'var(--text-primary)',
              fontFamily: 'var(--sans)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {ESTADOS.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_ESTADO[valor]}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant={estado !== estadoActual ? 'blue' : 'secondary'}
            size="sm"
            onClick={handleGuardar}
            disabled={estado === estadoActual}
          >
            Guardar
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function TransferenciasList({ transferencias, onCambiarEstado }: TransferenciasListProps) {
  if (transferencias.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '20px 0', fontSize: 14 }}>
        No hay transferencias/QR registradas en este turno.
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
            <th style={{ padding: '10px 8px' }}>Fecha venta</th>
            <th style={{ padding: '10px 8px' }}>Cantidad</th>
            <th style={{ padding: '10px 8px' }}>Total venta</th>
            <th style={{ padding: '10px 8px' }}>Monto transferido</th>
            <th style={{ padding: '10px 8px' }}>Estado actual</th>
            <th style={{ padding: '10px 8px' }}>Cambiar estado</th>
          </tr>
        </thead>
        <tbody>
          {transferencias.map((transferencia) => (
            <FilaTransferencia
              key={transferencia.pago.id}
              transferencia={transferencia}
              onCambiarEstado={onCambiarEstado}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
