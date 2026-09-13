import type { Insumo } from '../../types/insumo'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { StatusPill } from '../ui/StatusPill'

interface InsumosTableProps {
  insumos: Insumo[]
  onCambiarActivo: (id: string, activo: boolean) => void
  onActualizarStockMinimo?: (id: string, stockMinimo: number) => void
  onEditar: (insumo: Insumo) => void
  onEliminar: (id: string, nombre: string) => Promise<void>
}

interface FilaInsumoProps {
  insumo: Insumo
  onCambiarActivo: (insumo: Insumo) => void
  onActualizarStockMinimo?: (id: string, stockMinimo: number) => void
  onEditar: (insumo: Insumo) => void
  onEliminar: (insumo: Insumo) => void
}

function IconoPower() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function IconoEditar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconoTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function FilaInsumo({ insumo, onCambiarActivo, onEditar, onEliminar }: FilaInsumoProps) {
  const stockActualNum = Number(insumo.stockActual) || 0
  const stockMinimoNum = Number(insumo.stockMinimo) || 0
  const stockMinimoDiarioNum = Number(insumo.stockMinimoDiario) || 0

  let estadoStock: 'bajo' | 'medio' | 'normal' = 'normal'
  if (
    (stockMinimoDiarioNum > 0 && stockActualNum <= stockMinimoDiarioNum) ||
    (stockMinimoNum > 0 && stockMinimoDiarioNum === 0 && stockActualNum <= stockMinimoNum) ||
    stockActualNum <= 0
  ) {
    estadoStock = 'bajo'
  } else if (
    (stockMinimoNum > 0 && stockActualNum <= stockMinimoNum) ||
    (stockMinimoDiarioNum > 0 && stockActualNum <= stockMinimoDiarioNum * 1.5)
  ) {
    estadoStock = 'medio'
  } else {
    estadoStock = 'normal'
  }

  return (
    <tr key={insumo.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
      <td style={{ padding: '14px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
        {insumo.nombre}
      </td>
      <td style={{ padding: '14px 12px' }}>
        {insumo.tipo === 'vaso' ? (
          <span
            style={{
              display: 'inline-block',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              color: insumo.categoriaVaso === 'granizado' ? '#06b6d4' : '#60a5fa',
              background: insumo.categoriaVaso === 'granizado' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(96, 165, 250, 0.12)',
              border: insumo.categoriaVaso === 'granizado' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(96, 165, 250, 0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {insumo.categoriaVaso === 'granizado' ? 'Vaso Granizado' : 'Vaso Ceviche/Cóctel'}
          </span>
        ) : insumo.tipo === 'otro' ? (
          <StatusPill variant="neutral">Otro</StatusPill>
        ) : (
          <span
            style={{
              display: 'inline-block',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              color: '#a855f7',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {insumo.tipo}
          </span>
        )}
      </td>
      <td style={{ padding: '14px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
        {insumo.unidadMedida}
      </td>
      <td style={{ padding: '14px 12px', textAlign: 'center', width: 110 }}>
        <span
          className={
            estadoStock === 'bajo'
              ? 'stock-badge-bajo'
              : estadoStock === 'medio'
              ? 'stock-badge-medio'
              : 'stock-badge-normal'
          }
          title={
            estadoStock === 'bajo'
              ? `Stock Bajo: ${insumo.stockActual} (Mín. Diario: ${insumo.stockMinimoDiario}, Mín. General: ${insumo.stockMinimo})`
              : estadoStock === 'medio'
              ? `Stock Medio: ${insumo.stockActual} (Mín. Diario: ${insumo.stockMinimoDiario}, Mín. General: ${insumo.stockMinimo})`
              : `Stock Normal: ${insumo.stockActual}`
          }
        >
          {insumo.stockActual}
        </span>
      </td>
      <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Gen: <strong style={{ color: 'var(--brand-blue)' }}>{insumo.stockMinimo}</strong>
          {' / '}
          Día: <strong style={{ color: '#06b6d4' }}>{insumo.stockMinimoDiario}</strong>
        </span>
      </td>
      {/* Columna Estado: SOLO ICONO activar/desactivar */}
      <td style={{ padding: '14px 12px', width: 75 }}>
        <button
          type="button"
          onClick={() => onCambiarActivo(insumo)}
          title={insumo.activo ? 'Desactivar insumo (apagar)' : 'Activar insumo (encender)'}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: insumo.activo
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : '1px solid rgba(239, 68, 68, 0.35)',
            background: insumo.activo
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            color: insumo.activo ? '#10b981' : '#ef4444',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <IconoPower />
        </button>
      </td>
      {/* Columna Acciones: ICONOS de editar y eliminar (eliminar: solo Administrador, ver InsumosPage/router) */}
      <td style={{ padding: '14px 12px', width: 120 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            title={`Editar insumo "${insumo.nombre}"`}
            onClick={() => onEditar(insumo)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--brand-blue)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <IconoEditar />
          </button>
          <button
            type="button"
            title={`Eliminar insumo "${insumo.nombre}"`}
            onClick={() => onEliminar(insumo)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <IconoTrash />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function InsumosTable({
  insumos,
  onCambiarActivo,
  onActualizarStockMinimo,
  onEditar,
  onEliminar,
}: InsumosTableProps) {
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

  async function handleEliminar(insumo: Insumo) {
    const ok = await confirmar({
      titulo: 'Eliminar insumo',
      mensaje: `¿Confirmas eliminar permanentemente el insumo "${insumo.nombre}"? Si ya tiene movimientos de inventario, recetas o un tamaño de vaso asociado, la base de datos lo protegerá para no alterar el historial.`,
      textoConfirmar: 'Eliminar',
      varianteConfirmar: 'destructive',
    })
    if (!ok) return
    await onEliminar(insumo.id, insumo.nombre)
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
            <th style={{ padding: '10px 12px', textAlign: 'center', width: 110 }}>Stock actual</th>
            <th style={{ padding: '10px 12px' }}>Gen / Día</th>
            <th style={{ padding: '10px 12px', width: 75 }}>Estado</th>
            <th style={{ padding: '10px 12px', width: 120 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {insumos.map((insumo) => (
            <FilaInsumo
              key={insumo.id}
              insumo={insumo}
              onCambiarActivo={handleCambiarActivo}
              onActualizarStockMinimo={onActualizarStockMinimo}
              onEditar={onEditar}
              onEliminar={handleEliminar}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
