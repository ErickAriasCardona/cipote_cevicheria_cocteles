import { useEffect, useState, useMemo } from 'react'
import type { Insumo } from '../../types/insumo'
import type { MovimientoInventario, TipoMovimientoInventario } from '../../types/movimientoInventario'
import { movimientosInventarioService } from '../../services/movimientosInventarioService'

interface KardexMovimientosTableProps {
  insumos: Insumo[]
}

function formatearFechaHora(isoString: string): string {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoString
  }
}

function IconoFlechaArriba() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

function IconoCarrito() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function IconoCierre() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconoApertura() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
}

function IconoAjuste() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconoRefrescar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

export function KardexMovimientosTable({ insumos }: KardexMovimientosTableProps) {
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [insumoFiltro, setInsumoFiltro] = useState<string>('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoMovimientoInventario | 'todos'>('todos')
  const [busqueda, setBusqueda] = useState<string>('')
  const [limite, setLimite] = useState<number>(100)

  const cargarMovimientos = async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await movimientosInventarioService.listarKardexMovimientos({
        insumoId: insumoFiltro || undefined,
        tipoMovimiento: tipoFiltro,
        limite,
      })
      setMovimientos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los movimientos del Kardex.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarMovimientos()
  }, [insumoFiltro, tipoFiltro, limite])

  // Filtrado local por búsqueda de texto (responsable, observaciones, insumo)
  const movimientosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return movimientos
    const q = busqueda.toLowerCase().trim()
    return movimientos.filter((m) => {
      const nom = (m.insumoNombre ?? '').toLowerCase()
      const obs = (m.observaciones ?? '').toLowerCase()
      const usr = (m.usuarioNombre ?? '').toLowerCase()
      return nom.includes(q) || obs.includes(q) || usr.includes(q)
    })
  }, [movimientos, busqueda])

  const renderBadgeTipo = (tipo: TipoMovimientoInventario) => {
    switch (tipo) {
      case 'ingreso_vasos':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(46, 158, 91, 0.15)',
              color: 'var(--green-text)',
              border: '1px solid rgba(46, 158, 91, 0.3)',
            }}
          >
            <IconoFlechaArriba />
            Ingreso Turno
          </span>
        )
      case 'venta':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(65, 175, 224, 0.12)',
              color: 'var(--brand-blue)',
              border: '1px solid rgba(65, 175, 224, 0.3)',
            }}
          >
            <IconoCarrito />
            Venta (POS)
          </span>
        )
      case 'conteo_cierre':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(65, 175, 224, 0.15)',
              color: '#41afe0',
              border: '1px solid rgba(65, 175, 224, 0.3)',
            }}
          >
            <IconoCierre />
            Cierre Caja
          </span>
        )
      case 'conteo_apertura':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <IconoApertura />
            Apertura Caja
          </span>
        )
      case 'inventario_inicial':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(120, 120, 130, 0.15)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(120, 120, 130, 0.3)',
            }}
          >
            <IconoAjuste />
            Inv. Inicial
          </span>
        )
      case 'ajuste_manual':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--amber-text)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <IconoAjuste />
            Ajuste Manual
          </span>
        )
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controles de Filtros */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--hr-line)',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1, minWidth: 280 }}>
          {/* Búsqueda rápida */}
          <input
            type="text"
            placeholder="Buscar por insumo, responsable, nota..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              padding: '7px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid var(--hr-line)',
              background: 'var(--surface-sunken, rgba(0, 0, 0, 0.2))',
              color: 'var(--text-primary)',
              minWidth: 220,
              outline: 'none',
            }}
          />

          {/* Selector de Insumo */}
          <select
            value={insumoFiltro}
            onChange={(e) => setInsumoFiltro(e.target.value)}
            style={{
              padding: '7px 10px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid var(--hr-line)',
              background: 'var(--surface-sunken, rgba(0, 0, 0, 0.2))',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="">Todos los insumos</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} ({i.tipo})
              </option>
            ))}
          </select>

          {/* Selector de Tipo de Movimiento */}
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value as TipoMovimientoInventario | 'todos')}
            style={{
              padding: '7px 10px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid var(--hr-line)',
              background: 'var(--surface-sunken, rgba(0, 0, 0, 0.2))',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="todos">Todos los movimientos</option>
            <option value="ingreso_vasos">Ingresos en turno (Cajera)</option>
            <option value="venta">Ventas POS (Salidas)</option>
            <option value="conteo_cierre">Cierres de Caja (Diferencias)</option>
            <option value="conteo_apertura">Aperturas de Caja</option>
            <option value="inventario_inicial">Inventario Inicial</option>
            <option value="ajuste_manual">Ajustes Manuales</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Límite de registros */}
          <select
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
            style={{
              padding: '7px 10px',
              fontSize: 12.5,
              borderRadius: 8,
              border: '1px solid var(--hr-line)',
              background: 'var(--surface-sunken, rgba(0, 0, 0, 0.2))',
              color: 'var(--text-secondary)',
              outline: 'none',
            }}
          >
            <option value={50}>Últimos 50</option>
            <option value={100}>Últimos 100</option>
            <option value={200}>Últimos 200</option>
          </select>

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={cargarMovimientos}
            disabled={cargando}
            title="Recargar movimientos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid rgba(65, 175, 224, 0.3)',
              background: 'rgba(65, 175, 224, 0.1)',
              color: 'var(--brand-blue)',
              cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.6 : 1,
            }}
          >
            <IconoRefrescar />
            {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(228, 41, 38, 0.12)',
            border: '1px solid rgba(228, 41, 38, 0.3)',
            borderRadius: 8,
            color: 'var(--brand-red)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Tabla de Movimientos */}
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
              <th style={{ padding: '10px 12px' }}>Fecha y Hora</th>
              <th style={{ padding: '10px 12px' }}>Insumo</th>
              <th style={{ padding: '10px 12px' }}>Tipo Movimiento</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Cantidad</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Stock Resultante</th>
              <th style={{ padding: '10px 12px' }}>Responsable</th>
              <th style={{ padding: '10px 12px' }}>Detalle / Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: 13.5,
                  }}
                >
                  {cargando
                    ? 'Cargando registros del Kardex...'
                    : 'No se encontraron movimientos con los filtros aplicados.'}
                </td>
              </tr>
            ) : (
              movimientosFiltrados.map((m) => {
                const esPositivo = m.cantidad > 0
                const esNegativo = m.cantidad < 0
                const unidad = m.insumoUnidad ?? 'ud'
                const cantRedondeada = Math.round(m.cantidad)
                const stockRedondeado = Math.round(m.stockResultante)

                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--hr-line)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Fecha y Hora */}
                    <td
                      style={{
                        padding: '11px 12px',
                        fontSize: 12.5,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatearFechaHora(m.createdAt)}
                    </td>

                    {/* Insumo */}
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                        {m.insumoNombre}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {m.insumoTipo} · {unidad}
                      </div>
                    </td>

                    {/* Tipo de Movimiento */}
                    <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                      {renderBadgeTipo(m.tipoMovimiento)}
                    </td>

                    {/* Cantidad con signo */}
                    <td
                      style={{
                        padding: '11px 12px',
                        textAlign: 'right',
                        fontSize: 13.5,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        color: esPositivo
                          ? 'var(--brand-green)'
                          : esNegativo
                            ? 'var(--brand-red)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {esPositivo ? `+${cantRedondeada}` : `${cantRedondeada}`} {unidad}
                    </td>

                    {/* Stock Resultante */}
                    <td
                      style={{
                        padding: '11px 12px',
                        textAlign: 'right',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {stockRedondeado} {unidad}
                    </td>

                    {/* Responsable */}
                    <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.usuarioNombre}
                      </div>
                      {m.usuarioRol && (
                        <div style={{ fontSize: 10.5, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 700 }}>
                          {m.usuarioRol}
                        </div>
                      )}
                    </td>

                    {/* Observaciones */}
                    <td
                      style={{
                        padding: '11px 12px',
                        fontSize: 12.5,
                        color: 'var(--text-secondary)',
                        maxWidth: 280,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal',
                      }}
                    >
                      {m.observaciones || '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
