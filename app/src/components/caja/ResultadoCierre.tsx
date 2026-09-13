import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type { CerrarCajaResultado } from '../../types/cierreCaja'
import { transferenciasService } from '../../services/transferenciasService'
import type { TransferenciaTurno } from '../../services/transferenciasService'
import { etiquetaDiferenciaVasos } from '../../utils/formatoCierreCaja'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { BalanceTransferenciasCierre } from './BalanceTransferenciasCierre'

interface ResultadoCierreProps {
  resultado: CerrarCajaResultado
  tamanosVaso: TamanoVaso[]
}

/**
 * Pantalla de resultado de cierre (BD-06.5, RF-02.3/HU-02.3 + RF-04.4/
 * HU-04.4). Incluye balance detallado de efectivo vs transferencias y trazabilidad.
 */
export function ResultadoCierre({ resultado, tamanosVaso }: ResultadoCierreProps) {
  const { cierre, conteoVasos } = resultado
  const [transferencias, setTransferencias] = useState<TransferenciaTurno[]>([])
  const [cargandoTransf, setCargandoTransf] = useState(true)

  useEffect(() => {
    let activo = true
    transferenciasService
      .listarTransferenciasTurno(cierre.turnoId)
      .then((data) => {
        if (activo) setTransferencias(data)
      })
      .catch((err) => {
        console.error('Error cargando transferencias del turno:', err)
      })
      .finally(() => {
        if (activo) setCargandoTransf(false)
      })
    return () => {
      activo = false
    }
  }, [cierre.turnoId])

  function etiquetaTamano(tamanoVasoId: string): string {
    const tamano = tamanosVaso.find((t) => t.id === tamanoVasoId)
    return tamano ? tamano.etiqueta : tamanoVasoId
  }

  return (
    // Ticket responsive 2026-09-12 (tarea 3): mismo ajuste que CierreCajaForm
    // -- el grid de 3 tarjetas de BalanceTransferenciasCierre (minmax 260px)
    // se apretaba contra el borde en mobile angosto (~375px) con el padding
    // fijo de 36px por lado. clamp() lo reduce de forma continua sin tocar
    // el aspecto en desktop/tablet.
    <GlassCard style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px, 5vw, 36px)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)',
          }}
        >
          Resultado del cierre de caja
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          Fecha: {new Date(cierre.fechaCierre).toLocaleString('es-CO')}
        </p>
      </div>

      {/* Balance financiero: Efectivo vs Transferencias vs Otros Medios */}
      <div style={{ marginBottom: 26 }}>
        <BalanceTransferenciasCierre
          cierre={cierre}
          transferencias={transferencias}
          cargandoTransferencias={cargandoTransf}
        />
      </div>


      {cierre.observaciones && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--input-bg)', marginBottom: 24, fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Observaciones: </span>
          <span style={{ color: 'var(--text-primary)' }}>{cierre.observaciones}</span>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Control de vasos por tamaño
        </h3>
        <div
          style={{
            borderRadius: 14,
            border: '1px solid var(--input-border)',
            background: 'var(--sheen), var(--input-bg)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                <th style={{ padding: '10px 12px' }}>Tamaño</th>
                <th style={{ padding: '10px 12px' }}>Teórico</th>
                <th style={{ padding: '10px 12px' }}>Físico</th>
                <th style={{ padding: '10px 12px' }}>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {conteoVasos.map((conteo) => {
                const dif = conteo.diferencia
                const colorDif = dif === 0 ? 'var(--text-primary)' : dif < 0 ? 'var(--red-text)' : 'var(--green-text)'
                return (
                  <tr key={conteo.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {etiquetaTamano(conteo.tamanoVasoId)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {conteo.cantidadTeorica}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {conteo.cantidadFisica}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: colorDif }}>
                      {etiquetaDiferenciaVasos(conteo.diferencia)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p
        style={{
          margin: '0 0 24px',
          fontSize: 12.5,
          color: 'var(--text-faint)',
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        Este cierre ya quedó guardado y es definitivo: no se puede editar (RN-004).
      </p>

      <Link to="/cajero" style={{ textDecoration: 'none', display: 'block' }}>
        <Button variant="secondary" fullWidth size="lg">
          Volver al panel de caja
        </Button>
      </Link>
    </GlassCard>
  )
}
