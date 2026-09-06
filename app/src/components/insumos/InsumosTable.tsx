import { useState } from 'react'
import type { Insumo } from '../../types/insumo'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface InsumosTableProps {
  insumos: Insumo[]
  onCambiarActivo: (id: string, activo: boolean) => void
  onActualizarStockMinimo?: (id: string, stockMinimo: number) => void
}

interface FilaInsumoProps {
  insumo: Insumo
  onCambiarActivo: (insumo: Insumo) => void
  onActualizarStockMinimo?: (id: string, stockMinimo: number) => void
}

function FilaInsumo({ insumo, onCambiarActivo, onActualizarStockMinimo }: FilaInsumoProps) {
  const [stockMinimo, setStockMinimo] = useState(String(insumo.stockMinimo ?? 0))
  const stockMinimoNum = Math.max(0, Number(stockMinimo) || 0)
  const hayCambio = Number.isFinite(stockMinimoNum) && stockMinimoNum !== (insumo.stockMinimo ?? 0)

  const esBajoStock =
    insumo.activo &&
    insumo.stockMinimo > 0 &&
    insumo.stockActual <= insumo.stockMinimo

  function handleGuardarStockMinimo() {
    if (!onActualizarStockMinimo || !hayCambio) return
    onActualizarStockMinimo(insumo.id, stockMinimoNum)
  }

  return (
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
        <span>{insumo.stockActual}</span>
        {esBajoStock && (
          <span
            style={{
              display: 'inline-block',
              marginLeft: 8,
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 6,
              background: 'rgba(228, 41, 38, 0.15)',
              color: 'var(--brand-red)',
              border: '1px solid rgba(228, 41, 38, 0.3)',
            }}
          >
            ⚠️ Bajo
          </span>
        )}
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            style={{
              width: 72,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              padding: '6px 8px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--sans)',
              outline: 'none',
            }}
          />
          {onActualizarStockMinimo && (
            <Button
              type="button"
              variant={hayCambio ? 'blue' : 'secondary'}
              size="sm"
              onClick={handleGuardarStockMinimo}
              disabled={!hayCambio}
              style={{ padding: '5px 10px', fontSize: 11.5 }}
            >
              Guardar
            </Button>
          )}
        </div>
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
          onClick={() => onCambiarActivo(insumo)}
        >
          {insumo.activo ? 'Desactivar' : 'Activar'}
        </Button>
      </td>
    </tr>
  )
}

export function InsumosTable({ insumos, onCambiarActivo, onActualizarStockMinimo }: InsumosTableProps) {
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
            <th style={{ padding: '10px 12px' }}>Stock mínimo</th>
            <th style={{ padding: '10px 12px' }}>Estado</th>
            <th style={{ padding: '10px 12px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {insumos.map((insumo) => (
            <FilaInsumo
              key={insumo.id}
              insumo={insumo}
              onCambiarActivo={handleCambiarActivo}
              onActualizarStockMinimo={onActualizarStockMinimo}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
