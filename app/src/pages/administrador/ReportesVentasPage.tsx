import { useCallback, useEffect, useState } from 'react'
import { reportesService } from '../../services/reportesService'
import { agregarVentasPorPeriodo } from '../../utils/agregarVentasPorPeriodo'
import type { Granularidad, PeriodoAgregado, VentaReporte } from '../../types/reporteVentas'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

const GRANULARIDADES: { value: Granularidad; label: string }[] = [
  { value: 'dia', label: 'Por Día' },
  { value: 'semana', label: 'Por Semana' },
  { value: 'mes', label: 'Por Mes' },
]

function primerDiaDelMesIso(): string {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ReportesVentasPage() {
  const [desde, setDesde] = useState(primerDiaDelMesIso())
  const [hasta, setHasta] = useState(hoyIso())
  const [granularidad, setGranularidad] = useState<Granularidad>('dia')
  const [ventas, setVentas] = useState<VentaReporte[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarVentas = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const hastaExclusivo = new Date(`${hasta}T00:00:00.000Z`)
      hastaExclusivo.setUTCDate(hastaExclusivo.getUTCDate() + 1)
      const lista = await reportesService.listarVentasEnRango(
        `${desde}T00:00:00.000Z`,
        hastaExclusivo.toISOString(),
      )
      setVentas(lista)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reporte de ventas.')
    } finally {
      setCargando(false)
    }
  }, [desde, hasta])

  useEffect(() => {
    cargarVentas()
  }, [cargarVentas])

  const periodos: PeriodoAgregado[] = agregarVentasPorPeriodo(ventas, granularidad)
  const totalGeneral = ventas.reduce((suma, venta) => suma + venta.total, 0)

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Reportes de Ventas
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Visualiza el rendimiento comercial agrupado por día, semana o mes.
          </p>
        </div>

        <GlassCard padding={18}>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
            }}
          >
            <Input
              label="Desde"
              id="reporte_desde"
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
            />
            <Input
              label="Hasta"
              id="reporte_hasta"
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
            />
            <Select
              label="Agrupar por"
              id="reporte_granularidad"
              value={granularidad}
              onChange={(e) => setGranularidad(e.target.value as Granularidad)}
              options={GRANULARIDADES}
            />
          </form>
        </GlassCard>

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        {/* Resumen métrico destacado */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <GlassCard tint="red" padding={18}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
              Total Facturado
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-red)', marginTop: 4 }}>
              ${totalGeneral.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </div>
          </GlassCard>

          <GlassCard tint="blue" padding={18}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
              Transacciones
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-blue)', marginTop: 4 }}>
              {ventas.length} ventas
            </div>
          </GlassCard>
        </div>

        <GlassCard padding={20}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
            Desglose por Periodo ({GRANULARIDADES.find((g) => g.value === granularidad)?.label})
          </h3>

          {cargando ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando reporte…</p>
          ) : periodos.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>
              No hay ventas registradas en el rango de fechas seleccionado.
            </p>
          ) : (
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
                    <th style={{ padding: '10px 12px' }}>Periodo</th>
                    <th style={{ padding: '10px 12px' }}>Cantidad de ventas</th>
                    <th style={{ padding: '10px 12px' }}>Total vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {periodos.map((periodo) => (
                    <tr key={periodo.clave} style={{ borderBottom: '1px solid var(--hr-line)' }}>
                      <td style={{ padding: '14px 12px', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {periodo.etiqueta}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                        {periodo.cantidadVentas}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: 14, fontWeight: 700, color: 'var(--brand-red)' }}>
                        ${periodo.totalVendido.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
