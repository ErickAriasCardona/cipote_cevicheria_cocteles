import { useMemo, useState } from 'react'
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

type ColumnaOrdenInsumo = 'nombre' | 'tipo' | 'unidad' | 'stockActual' | 'stockMinimo' | 'activo'
type DireccionOrden = 'asc' | 'desc'

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

function IconoSortNeutro() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
      <path d="M7 15l5 5 5-5" />
      <path d="M7 9l5-5 5 5" />
    </svg>
  )
}

function IconoSortAsc() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-blue, #41afe0)' }}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  )
}

function IconoSortDesc() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-blue, #41afe0)' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function getTipoEtiqueta(insumo: Insumo): string {
  if (insumo.tipo === 'vaso') {
    return insumo.categoriaVaso === 'granizado' ? 'Vaso Granizado' : 'Vaso Ceviche/Cóctel'
  }
  if (insumo.tipo === 'otro') return 'Otro'
  return insumo.tipo || ''
}

function getValorUnidadNumerico(insumo: Insumo): number {
  if (typeof insumo.valorUnidad === 'number' && !isNaN(insumo.valorUnidad) && insumo.valorUnidad > 0) {
    return insumo.valorUnidad
  }
  const match = (insumo.unidadMedida || insumo.nombre || '').match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

function getEstadoStock(insumo: Insumo): 'bajo' | 'medio' | 'normal' {
  const stockActualNum = Number(insumo.stockActual) || 0
  const stockMinimoNum = Number(insumo.stockMinimo) || 0
  const stockMinimoDiarioNum = Number(insumo.stockMinimoDiario) || 0

  if (
    (stockMinimoDiarioNum > 0 && stockActualNum <= stockMinimoDiarioNum) ||
    (stockMinimoNum > 0 && stockMinimoDiarioNum === 0 && stockActualNum <= stockMinimoNum) ||
    stockActualNum <= 0
  ) {
    return 'bajo'
  } else if (
    (stockMinimoNum > 0 && stockActualNum <= stockMinimoNum) ||
    (stockMinimoDiarioNum > 0 && stockActualNum <= stockMinimoDiarioNum * 1.5)
  ) {
    return 'medio'
  }
  return 'normal'
}

function FilaInsumo({ insumo, onCambiarActivo, onEditar, onEliminar }: FilaInsumoProps) {
  const estadoStock = getEstadoStock(insumo)

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
              color: 'var(--brand-blue)',
              background: 'rgba(65, 175, 224, 0.12)',
              border: '1px solid rgba(65, 175, 224, 0.3)',
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
      <td style={{ padding: '14px 12px', width: 75, textAlign: 'center' }}>
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
      {/* Columna Acciones: ICONOS de editar y eliminar */}
      <td style={{ padding: '14px 12px', width: 120 }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
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

  // Ordenamiento por defecto: por TIPO y luego por UNIDADES (ascendente)
  const [columnaOrden, setColumnaOrden] = useState<ColumnaOrdenInsumo>('tipo')
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('asc')

  // Filtros interactivos por cada columna
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroUnidad, setFiltroUnidad] = useState('')
  const [filtroStock, setFiltroStock] = useState('')
  const [filtroGenDia, setFiltroGenDia] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // Valores únicos dinámicos para poblar los filtros según los datos reales
  const tiposUnicos = useMemo(() => {
    const set = new Set<string>()
    insumos.forEach((i) => {
      const et = getTipoEtiqueta(i)
      if (et) set.add(et)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [insumos])

  const unidadesUnicas = useMemo(() => {
    const set = new Set<string>()
    insumos.forEach((i) => {
      if (i.unidadMedida) set.add(i.unidadMedida)
    })
    return Array.from(set).sort((a, b) => {
      const numA = parseFloat(a.match(/\d+(\.\d+)?/)?.[0] || '0')
      const numB = parseFloat(b.match(/\d+(\.\d+)?/)?.[0] || '0')
      if (numA !== numB) return numA - numB
      return a.localeCompare(b, 'es')
    })
  }, [insumos])

  const filtrosActivosCount = [
    Boolean(filtroNombre.trim()),
    Boolean(filtroTipo),
    Boolean(filtroUnidad),
    Boolean(filtroStock),
    Boolean(filtroGenDia),
    Boolean(filtroEstado),
  ].filter(Boolean).length

  function handleLimpiarFiltros() {
    setFiltroNombre('')
    setFiltroTipo('')
    setFiltroUnidad('')
    setFiltroStock('')
    setFiltroGenDia('')
    setFiltroEstado('')
  }

  function handleOrdenar(columna: ColumnaOrdenInsumo) {
    if (columnaOrden === columna) {
      setDireccionOrden((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setColumnaOrden(columna)
      setDireccionOrden('asc')
    }
  }

  // Filtrado + Ordenamiento
  const insumosFiltradosYOrdenados = useMemo(() => {
    const filtrados = insumos.filter((item) => {
      // 1. Filtro Nombre
      if (filtroNombre.trim()) {
        const q = filtroNombre.trim().toLowerCase()
        if (!item.nombre.toLowerCase().includes(q)) return false
      }

      // 2. Filtro Tipo
      if (filtroTipo) {
        const et = getTipoEtiqueta(item)
        if (et !== filtroTipo) return false
      }

      // 3. Filtro Unidad
      if (filtroUnidad) {
        if (item.unidadMedida !== filtroUnidad) return false
      }

      // 4. Filtro Stock Actual
      if (filtroStock) {
        const stockNum = Number(item.stockActual) || 0
        const estado = getEstadoStock(item)
        if (filtroStock === 'bajo' && estado !== 'bajo') return false
        if (filtroStock === 'medio' && estado !== 'medio') return false
        if (filtroStock === 'normal' && estado !== 'normal') return false
        if (filtroStock === 'agotado' && stockNum > 0) return false
        if (filtroStock === 'disponible' && stockNum <= 0) return false
      }

      // 5. Filtro Gen / Día
      if (filtroGenDia) {
        const diario = Number(item.stockMinimoDiario) || 0
        const general = Number(item.stockMinimo) || 0
        if (filtroGenDia === 'con_diario' && diario <= 0) return false
        if (filtroGenDia === 'sin_diario' && diario > 0) return false
        if (filtroGenDia === 'con_general' && general <= 0) return false
      }

      // 6. Filtro Estado
      if (filtroEstado) {
        if (filtroEstado === 'activo' && !item.activo) return false
        if (filtroEstado === 'inactivo' && item.activo) return false
      }

      return true
    })

    return filtrados.sort((a, b) => {
      let cmp = 0

      if (columnaOrden === 'tipo') {
        const tipoA = getTipoEtiqueta(a)
        const tipoB = getTipoEtiqueta(b)
        cmp = tipoA.localeCompare(tipoB, 'es', { sensitivity: 'base' })
        // Criterio secundario: orden en unidades (ej. 8oz, 10oz, etc.)
        if (cmp === 0) {
          const uA = getValorUnidadNumerico(a)
          const uB = getValorUnidadNumerico(b)
          cmp = uA - uB
        }
        if (cmp === 0) {
          cmp = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        }
      } else if (columnaOrden === 'nombre') {
        cmp = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        if (cmp === 0) {
          cmp = getValorUnidadNumerico(a) - getValorUnidadNumerico(b)
        }
      } else if (columnaOrden === 'unidad') {
        const uA = getValorUnidadNumerico(a)
        const uB = getValorUnidadNumerico(b)
        cmp = uA - uB
        if (cmp === 0) {
          cmp = getTipoEtiqueta(a).localeCompare(getTipoEtiqueta(b), 'es', { sensitivity: 'base' })
        }
        if (cmp === 0) {
          cmp = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        }
      } else if (columnaOrden === 'stockActual') {
        cmp = (Number(a.stockActual) || 0) - (Number(b.stockActual) || 0)
        if (cmp === 0) {
          cmp = getTipoEtiqueta(a).localeCompare(getTipoEtiqueta(b), 'es', { sensitivity: 'base' })
        }
      } else if (columnaOrden === 'stockMinimo') {
        cmp = (Number(a.stockMinimo) || 0) - (Number(b.stockMinimo) || 0)
        if (cmp === 0) {
          cmp = (Number(a.stockMinimoDiario) || 0) - (Number(b.stockMinimoDiario) || 0)
        }
      } else if (columnaOrden === 'activo') {
        cmp = a.activo === b.activo ? 0 : a.activo ? -1 : 1
        if (cmp === 0) {
          cmp = getTipoEtiqueta(a).localeCompare(getTipoEtiqueta(b), 'es', { sensitivity: 'base' })
        }
      }

      return direccionOrden === 'asc' ? cmp : -cmp
    })
  }, [
    insumos,
    filtroNombre,
    filtroTipo,
    filtroUnidad,
    filtroStock,
    filtroGenDia,
    filtroEstado,
    columnaOrden,
    direccionOrden,
  ])

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

  function renderTh(columna: ColumnaOrdenInsumo, label: string, align: 'left' | 'center' | 'right' = 'left', width?: number | string) {
    const estaActiva = columnaOrden === columna
    return (
      <th
        onClick={() => handleOrdenar(columna)}
        title={`Ordenar por ${label} (${estaActiva && direccionOrden === 'asc' ? 'descendente' : 'ascendente'})`}
        style={{
          padding: '10px 12px 6px',
          textAlign: align,
          width,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s ease',
          color: estaActiva ? 'var(--brand-blue, #41afe0)' : 'var(--text-faint)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
            width: '100%',
          }}
        >
          <span>{label}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {estaActiva ? (
              direccionOrden === 'asc' ? <IconoSortAsc /> : <IconoSortDesc />
            ) : (
              <IconoSortNeutro />
            )}
          </span>
        </div>
      </th>
    )
  }

  const selectStyle = (activo: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '4px 6px',
    fontSize: 11.5,
    borderRadius: 6,
    border: activo ? '1px solid var(--brand-blue, #41afe0)' : '1px solid var(--input-border)',
    background: activo ? 'rgba(65, 175, 224, 0.14)' : 'var(--input-bg)',
    color: activo ? 'var(--brand-blue, #41afe0)' : 'var(--text-primary)',
    fontWeight: activo ? 600 : 400,
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    fontFamily: 'var(--sans)',
  })

  return (
    <div>
      {/* Barra superior de conteo y filtros activos */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 12,
          fontSize: 12.5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Mostrando <strong style={{ color: 'var(--text-primary)' }}>{insumosFiltradosYOrdenados.length}</strong> de {insumos.length} insumos
          </span>
          {filtrosActivosCount > 0 && (
            <span
              style={{
                background: 'rgba(65, 175, 224, 0.15)',
                color: 'var(--brand-blue)',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid rgba(65, 175, 224, 0.3)',
              }}
            >
              {filtrosActivosCount} {filtrosActivosCount === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          )}
        </div>

        {filtrosActivosCount > 0 && (
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand-red, #e42926)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 6px',
              textDecoration: 'underline',
            }}
          >
            Limpiar todos los filtros ✕
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            {/* Fila 1: Encabezados ordenables */}
            <tr
              style={{
                borderBottom: '1px solid var(--hr-line)',
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: 'var(--text-faint)',
              }}
            >
              {renderTh('nombre', 'Nombre', 'left')}
              {renderTh('tipo', 'Tipo', 'left')}
              {renderTh('unidad', 'Unidad', 'left')}
              {renderTh('stockActual', 'Stock actual', 'center', 120)}
              {renderTh('stockMinimo', 'Gen / Día', 'left', 140)}
              {renderTh('activo', 'Estado', 'center', 85)}
              <th style={{ padding: '10px 12px 6px', width: 120, textAlign: 'center', userSelect: 'none' }}>
                Acciones
              </th>
            </tr>

            {/* Fila 2: Filtros por cada columna */}
            <tr
              style={{
                borderBottom: '2px solid var(--hr-line)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              {/* Filtro Nombre */}
              <th style={{ padding: '6px 8px 10px' }}>
                <input
                  type="text"
                  placeholder="Buscar nombre..."
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: 11.5,
                    borderRadius: 6,
                    border: filtroNombre.trim()
                      ? '1px solid var(--brand-blue, #41afe0)'
                      : '1px solid var(--input-border)',
                    background: filtroNombre.trim() ? 'rgba(65, 175, 224, 0.14)' : 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--sans)',
                  }}
                />
              </th>

              {/* Filtro Tipo */}
              <th style={{ padding: '6px 8px 10px' }}>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  style={selectStyle(Boolean(filtroTipo))}
                >
                  <option value="">Todos ({tiposUnicos.length})</option>
                  {tiposUnicos.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </th>

              {/* Filtro Unidad */}
              <th style={{ padding: '6px 8px 10px' }}>
                <select
                  value={filtroUnidad}
                  onChange={(e) => setFiltroUnidad(e.target.value)}
                  style={selectStyle(Boolean(filtroUnidad))}
                >
                  <option value="">Todas ({unidadesUnicas.length})</option>
                  {unidadesUnicas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </th>

              {/* Filtro Stock Actual */}
              <th style={{ padding: '6px 8px 10px', textAlign: 'center' }}>
                <select
                  value={filtroStock}
                  onChange={(e) => setFiltroStock(e.target.value)}
                  style={selectStyle(Boolean(filtroStock))}
                >
                  <option value="">Todos</option>
                  <option value="bajo">🔴 Bajo / Crítico</option>
                  <option value="medio">🟡 Medio / Atención</option>
                  <option value="normal">🟢 Normal</option>
                  <option value="agotado">⚠️ Agotado (0)</option>
                  <option value="disponible">✓ Con stock (&gt;0)</option>
                </select>
              </th>

              {/* Filtro Gen / Día */}
              <th style={{ padding: '6px 8px 10px' }}>
                <select
                  value={filtroGenDia}
                  onChange={(e) => setFiltroGenDia(e.target.value)}
                  style={selectStyle(Boolean(filtroGenDia))}
                >
                  <option value="">Todos</option>
                  <option value="con_diario">Con Mín. Diario</option>
                  <option value="sin_diario">Sin Mín. Diario</option>
                  <option value="con_general">Con Mín. General</option>
                </select>
              </th>

              {/* Filtro Estado */}
              <th style={{ padding: '6px 8px 10px', textAlign: 'center' }}>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={selectStyle(Boolean(filtroEstado))}
                >
                  <option value="">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </th>

              {/* Botón rápido en la celda de acciones */}
              <th style={{ padding: '6px 8px 10px', textAlign: 'center' }}>
                {filtrosActivosCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleLimpiarFiltros}
                    title="Limpiar todos los filtros"
                    style={{
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: 'var(--brand-red, #e42926)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ✕ Limpiar
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>
                    Filtros
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltradosYOrdenados.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <p style={{ margin: '0 0 10px', fontSize: 14 }}>
                    No se encontraron insumos que coincidan con los filtros aplicados.
                  </p>
                  <button
                    type="button"
                    onClick={handleLimpiarFiltros}
                    style={{
                      background: 'rgba(65, 175, 224, 0.12)',
                      border: '1px solid rgba(65, 175, 224, 0.3)',
                      color: 'var(--brand-blue)',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '6px 14px',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    Restablecer filtros
                  </button>
                </td>
              </tr>
            ) : (
              insumosFiltradosYOrdenados.map((insumo) => (
                <FilaInsumo
                  key={insumo.id}
                  insumo={insumo}
                  onCambiarActivo={handleCambiarActivo}
                  onActualizarStockMinimo={onActualizarStockMinimo}
                  onEditar={onEditar}
                  onEliminar={handleEliminar}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
