import type { Insumo } from '../../types/insumo'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface InsumosTableProps {
  insumos: Insumo[]
  onCambiarActivo: (id: string, activo: boolean) => void
}

export function InsumosTable({ insumos, onCambiarActivo }: InsumosTableProps) {
  const { confirmar } = useConfirmacion()

  async function handleCambiarActivo(insumo: Insumo) {
    const siguienteActivo = !insumo.activo
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Activar insumo' : 'Desactivar insumo',
      mensaje: siguienteActivo
        ? `¿Confirmas activar el insumo "${insumo.nombre}"?`
        : `¿Confirmas desactivar el insumo "${insumo.nombre}"?`,
      textoConfirmar: siguienteActivo ? 'Activar' : 'Desactivar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(insumo.id, siguienteActivo)
  }

  if (insumos.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '16px 0', fontSize: 14 }}>
        Todavía no hay insumos registrados.
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
            <th style={{ padding: '10px 12px' }}>Nombre</th>
            <th style={{ padding: '10px 12px' }}>Tipo</th>
            <th style={{ padding: '10px 12px' }}>Unidad</th>
            <th style={{ padding: '10px 12px' }}>Stock actual</th>
            <th style={{ padding: '10px 12px' }}>Estado</th>
            <th style={{ padding: '10px 12px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {insumos.map((insumo) => (
            <tr key={insumo.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
              <td style={{ padding: '14px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                {insumo.nombre}
              </td>
              <td style={{ padding: '14px 12px' }}>
                <StatusPill variant={insumo.tipo === 'vaso' ? 'role' : 'neutral'}>
                  {insumo.tipo === 'vaso' ? 'Vaso' : 'Otro'}
                </StatusPill>
              </td>
              <td style={{ padding: '14px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                {insumo.unidadMedida}
              </td>
              <td style={{ padding: '14px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--brand-blue)' }}>
                {insumo.stockActual}
              </td>
              <td style={{ padding: '14px 12px' }}>
                <StatusPill variant={insumo.activo ? 'positive' : 'destructive'}>
                  {insumo.activo ? 'Activo' : 'Inactivo'}
                </StatusPill>
              </td>
              <td style={{ padding: '14px 12px' }}>
                <Button
                  type="button"
                  variant={insumo.activo ? 'destructive' : 'activate'}
                  size="sm"
                  onClick={() => handleCambiarActivo(insumo)}
                >
                  {insumo.activo ? 'Desactivar' : 'Activar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
