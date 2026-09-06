import { useConfirmacion } from '../../hooks/useConfirmacion'
import type { VentaConEstadoEliminacion } from '../../types/venta'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface VentasAdminTableProps {
  ventas: VentaConEstadoEliminacion[]
  onEliminar: (ventaId: string) => void
  onRestablecer: (ventaId: string) => void
}

interface FilaVentaProps {
  venta: VentaConEstadoEliminacion
  onEliminar: VentasAdminTableProps['onEliminar']
  onRestablecer: VentasAdminTableProps['onRestablecer']
}

function FilaVenta({ venta, onEliminar, onRestablecer }: FilaVentaProps) {
  const { confirmar } = useConfirmacion()

  async function handleEliminar() {
    const ok = await confirmar({
      titulo: 'Eliminar venta',
      mensaje:
        '¿Confirmas eliminar esta venta? Quedará excluida del total del próximo cierre de caja ' +
        'mientras esté eliminada (RN-010). Podrás restablecerla después si fue un error.',
      textoConfirmar: 'Eliminar venta',
      varianteConfirmar: 'destructive',
    })
    if (!ok) return
    onEliminar(venta.id)
  }

  async function handleRestablecer() {
    const ok = await confirmar({
      titulo: 'Restablecer venta',
      mensaje: '¿Confirmas restablecer esta venta? Volverá a incluirse en los totales vigentes.',
      textoConfirmar: 'Restablecer venta',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    onRestablecer(venta.id)
  }

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--hr-line)',
        opacity: venta.eliminado ? 0.72 : 1,
      }}
    >
      <td style={{ padding: '14px 10px', fontSize: 13, color: 'var(--text-secondary)' }}>
        {new Date(venta.createdAt).toLocaleString('es-CO')}
      </td>
      <td style={{ padding: '14px 10px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
        {venta.productoNombre}
      </td>
      <td style={{ padding: '14px 10px', fontSize: 13, color: 'var(--text-primary)' }}>
        {venta.tamanoVasoEtiqueta}
      </td>
      <td style={{ padding: '14px 10px', fontSize: 13, color: 'var(--text-primary)' }}>
        {venta.cantidad}
      </td>
      <td style={{ padding: '14px 10px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
        ${venta.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
      </td>
      <td style={{ padding: '14px 10px', fontSize: 12.5, color: 'var(--text-secondary)' }}>
        {venta.observaciones ? (
          <div style={{ maxWidth: 240, wordBreak: 'break-word' }}>
            {venta.observaciones.includes('Devuelta') ? (
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(46, 158, 91, 0.14)',
                  color: 'var(--green-text)',
                  fontWeight: 600,
                  border: '1px solid rgba(46, 158, 91, 0.3)',
                  fontSize: 11.5,
                }}
              >
                {venta.observaciones}
              </span>
            ) : (
              <span>{venta.observaciones}</span>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--text-faint)' }}>—</span>
        )}
      </td>
      <td style={{ padding: '14px 10px' }}>
        <StatusPill variant={venta.eliminado ? 'destructive' : 'positive'}>
          {venta.eliminado ? 'Eliminada' : 'Activa'}
        </StatusPill>
      </td>
      <td style={{ padding: '14px 10px', fontSize: 11.5, color: 'var(--text-faint)' }}>
        {venta.eliminado
          ? venta.eliminadoEn && `Eliminada: ${new Date(venta.eliminadoEn).toLocaleString('es-CO')}`
          : venta.restablecidoEn &&
            `Restablecida: ${new Date(venta.restablecidoEn).toLocaleString('es-CO')}`}
      </td>
      <td style={{ padding: '14px 10px' }}>
        {venta.eliminado ? (
          <Button type="button" variant="blue" size="sm" onClick={handleRestablecer}>
            Restablecer
          </Button>
        ) : (
          <Button type="button" variant="destructive" size="sm" onClick={handleEliminar}>
            Eliminar
          </Button>
        )}
      </td>
    </tr>
  )
}

export function VentasAdminTable({ ventas, onEliminar, onRestablecer }: VentasAdminTableProps) {
  if (ventas.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '16px 0', fontSize: 14 }}>
        Todavía no hay ventas registradas.
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
            <th style={{ padding: '10px 10px' }}>Fecha</th>
            <th style={{ padding: '10px 10px' }}>Producto</th>
            <th style={{ padding: '10px 10px' }}>Tamaño</th>
            <th style={{ padding: '10px 10px' }}>Cantidad</th>
            <th style={{ padding: '10px 10px' }}>Total</th>
            <th style={{ padding: '10px 10px' }}>Devuelta / Obs.</th>
            <th style={{ padding: '10px 10px' }}>Estado</th>
            <th style={{ padding: '10px 10px' }}>Trazabilidad</th>
            <th style={{ padding: '10px 10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => (
            <FilaVenta
              key={venta.id}
              venta={venta}
              onEliminar={onEliminar}
              onRestablecer={onRestablecer}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
