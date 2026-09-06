import { Fragment, useCallback, useEffect, useState } from 'react'
import { cajaService } from '../../services/cajaService'
import { ventasService } from '../../services/ventasService'
import { transferenciasService } from '../../services/transferenciasService'
import type { TransferenciaTurno } from '../../services/transferenciasService'
import type { CierreCaja, ConteoVasoCierre } from '../../types/cierreCaja'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { etiquetaDiferenciaDinero, etiquetaDiferenciaVasos } from '../../utils/formatoCierreCaja'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { StatusPill } from '../../components/ui/StatusPill'
import { BalanceTransferenciasCierre } from '../../components/caja/BalanceTransferenciasCierre'

/**
 * Consulta de cierres de caja para el Administrador (CU-02.3/CU-04.4).
 */
export function CierresCajaPage() {
  const [cierres, setCierres] = useState<CierreCaja[]>([])
  const [tamanosVaso, setTamanosVaso] = useState<TamanoVaso[]>([])
  const [conteoPorTurno, setConteoPorTurno] = useState<Record<string, ConteoVasoCierre[]>>({})
  const [transferenciasPorTurno, setTransferenciasPorTurno] = useState<Record<string, TransferenciaTurno[]>>({})
  const [cargandoTransf, setCargandoTransf] = useState<Record<string, boolean>>({})
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaCierres, listaTamanosVaso] = await Promise.all([
        cajaService.listarCierres(),
        ventasService.listarTamanosVasoActivos(),
      ])
      setCierres(listaCierres)
      setTamanosVaso(listaTamanosVaso)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el listado de cierres.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  async function handleVerDetalle(turnoId: string) {
    if (turnoSeleccionado === turnoId) {
      setTurnoSeleccionado(null)
      return
    }
    setTurnoSeleccionado(turnoId)

    if (!conteoPorTurno[turnoId]) {
      try {
        const conteo = await cajaService.listarConteoVasosCierre(turnoId)
        setConteoPorTurno((actual) => ({ ...actual, [turnoId]: conteo }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle de vasos.')
      }
    }

    if (!transferenciasPorTurno[turnoId]) {
      setCargandoTransf((prev) => ({ ...prev, [turnoId]: true }))
      transferenciasService
        .listarTransferenciasTurno(turnoId)
        .then((transfs) => {
          setTransferenciasPorTurno((actual) => ({ ...actual, [turnoId]: transfs }))
        })
        .catch((err) => {
          console.error('Error al cargar transferencias del turno:', err)
        })
        .finally(() => {
          setCargandoTransf((prev) => ({ ...prev, [turnoId]: false }))
        })
    }
  }

  function etiquetaTamano(tamanoVasoId: string): string {
    const tamano = tamanosVaso.find((t) => t.id === tamanoVasoId)
    return tamano ? tamano.etiqueta : tamanoVasoId
  }

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Historial de Cierres de Caja
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Auditoría de turnos cerrados, balance de dinero y cuadre de vasos.
          </p>
        </div>

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        <GlassCard padding={20}>
          {cargando ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando cierres…</p>
          ) : cierres.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>
              Todavía no hay ningún cierre de caja registrado.
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
                    <th style={{ padding: '10px 10px' }}>Fecha cierre</th>
                    <th style={{ padding: '10px 10px' }}>Efectivo</th>
                    <th style={{ padding: '10px 10px' }}>Transferencias</th>
                    <th style={{ padding: '10px 10px' }}>Otros canales</th>
                    <th style={{ padding: '10px 10px' }}>Dinero contado</th>
                    <th style={{ padding: '10px 10px' }}>Total esperado</th>
                    <th style={{ padding: '10px 10px' }}>Resultado</th>
                    <th style={{ padding: '10px 10px' }}>Observaciones</th>
                    <th style={{ padding: '10px 10px' }}>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {cierres.map((cierre) => {
                    const esCuadrado = cierre.diferencia === 0
                    const otros =
                      Number(cierre.totalTarjeta) +
                      Number(cierre.totalNequi) +
                      Number(cierre.totalRappi)

                    return (
                      <Fragment key={cierre.id}>
                        <tr style={{ borderBottom: '1px solid var(--hr-line)' }}>
                          <td style={{ padding: '14px 10px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {new Date(cierre.fechaCierre).toLocaleString('es-CO')}
                          </td>
                          <td style={{ padding: '14px 10px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            ${Number(cierre.totalEfectivo).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 10px', fontSize: 13.5, fontWeight: 700, color: 'var(--brand-blue)' }}>
                            ${Number(cierre.totalTransferenciaExitosa).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 10px', fontSize: 13, color: 'var(--text-secondary)' }}>
                            ${otros.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 10px', fontSize: 13, color: 'var(--text-primary)' }}>
                            ${Number(cierre.dineroContado).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 10px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            ${Number(cierre.totalEsperado).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <StatusPill variant={esCuadrado ? 'positive' : 'destructive'}>
                              {etiquetaDiferenciaDinero(cierre.diferencia)}
                            </StatusPill>
                          </td>
                          <td
                            style={{
                              padding: '14px 10px',
                              fontSize: 12.5,
                              color: 'var(--text-secondary)',
                              maxWidth: 130,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={cierre.observaciones || ''}
                          >
                            {cierre.observaciones || '—'}
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <Button
                              type="button"
                              variant={turnoSeleccionado === cierre.turnoId ? 'secondary' : 'blue'}
                              size="sm"
                              onClick={() => handleVerDetalle(cierre.turnoId)}
                            >
                              {turnoSeleccionado === cierre.turnoId ? 'Ocultar' : 'Ver balance'}
                            </Button>
                          </td>
                        </tr>
                        {turnoSeleccionado === cierre.turnoId && (
                          <tr>
                            <td
                              colSpan={9}
                              style={{
                                padding: '24px 20px',
                                background: 'rgba(56, 139, 253, 0.03)',
                                borderBottom: '2px solid var(--hr-line)',
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* 1. Balance Financiero: Efectivo vs Transferencias */}
                                <div>
                                  <h3
                                    style={{
                                      margin: '0 0 14px',
                                      fontSize: 15,
                                      fontWeight: 800,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    Balance financiero del turno (Efectivo vs Transferencias)
                                  </h3>
                                  <BalanceTransferenciasCierre
                                    cierre={cierre}
                                    transferencias={transferenciasPorTurno[cierre.turnoId] || []}
                                    cargandoTransferencias={Boolean(cargandoTransf[cierre.turnoId])}
                                  />
                                </div>

                                {/* 2. Control de Vasos por Tamaño */}
                                <div>
                                  <h3
                                    style={{
                                      margin: '0 0 12px',
                                      fontSize: 15,
                                      fontWeight: 800,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    Control de vasos por tamaño
                                  </h3>
                                  {conteoPorTurno[cierre.turnoId] ? (
                                    <div
                                      style={{
                                        borderRadius: 12,
                                        border: '1px solid var(--input-border)',
                                        background: 'var(--sheen), var(--input-bg)',
                                        overflowX: 'auto',
                                      }}
                                    >
                                      <table
                                        style={{
                                          width: '100%',
                                          borderCollapse: 'collapse',
                                          textAlign: 'left',
                                          fontSize: 12.5,
                                        }}
                                      >
                                        <thead>
                                          <tr
                                            style={{
                                              borderBottom: '2px solid var(--hr-line)',
                                              fontSize: 11,
                                              fontWeight: 700,
                                              textTransform: 'uppercase',
                                              letterSpacing: '0.3px',
                                              color: 'var(--text-faint)',
                                            }}
                                          >
                                            <th style={{ padding: '8px 12px' }}>Tamaño</th>
                                            <th style={{ padding: '8px 12px' }}>Teórico</th>
                                            <th style={{ padding: '8px 12px' }}>Físico</th>
                                            <th style={{ padding: '8px 12px' }}>Diferencia</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {conteoPorTurno[cierre.turnoId].map((conteo) => (
                                            <tr key={conteo.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
                                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                                                {etiquetaTamano(conteo.tamanoVasoId)}
                                              </td>
                                              <td style={{ padding: '8px 12px' }}>{conteo.cantidadTeorica}</td>
                                              <td style={{ padding: '8px 12px' }}>{conteo.cantidadFisica}</td>
                                              <td style={{ padding: '8px 12px' }}>
                                                <StatusPill variant={conteo.diferencia === 0 ? 'positive' : 'destructive'}>
                                                  {etiquetaDiferenciaVasos(conteo.diferencia)}
                                                </StatusPill>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p style={{ margin: 4, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                                      Cargando detalle de vasos…
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
