import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Insumo } from '../../types/insumo'
import type { MomentoConteo, MovimientoInventario, RegistrarConteoInventarioInput } from '../../types/movimientoInventario'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface ConteoInventarioDiarioFormProps {
  insumos: Insumo[]
  usuarioId: string
  conteosRecientes: MovimientoInventario[]
  onRegistrar: (input: RegistrarConteoInventarioInput) => Promise<void>
}

export function ConteoInventarioDiarioForm({
  insumos,
  usuarioId,
  conteosRecientes,
  onRegistrar,
}: ConteoInventarioDiarioFormProps) {
  const [momento, setMomento] = useState<MomentoConteo>('apertura')
  const [insumoId, setInsumoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const insumoSeleccionado = insumos.find((i) => i.id === insumoId)
  const cantidadNum = Number(cantidad)

  const alertaMinimo = (() => {
    if (!insumoSeleccionado || cantidad.trim() === '' || !Number.isFinite(cantidadNum)) return null
    if (insumoSeleccionado.stockMinimoDiario > 0 && cantidadNum <= insumoSeleccionado.stockMinimoDiario) {
      return `Atención: La cantidad contada (${cantidadNum}) está en o por debajo del mínimo diario (${insumoSeleccionado.stockMinimoDiario} ${insumoSeleccionado.unidadMedida}).`
    }
    if (insumoSeleccionado.stockMinimo > 0 && cantidadNum <= insumoSeleccionado.stockMinimo) {
      return `Nota: La cantidad contada (${cantidadNum}) está en o por debajo del mínimo general de almacén (${insumoSeleccionado.stockMinimo} ${insumoSeleccionado.unidadMedida}).`
    }
    return null
  })()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setExito(null)

    if (!insumoId) {
      setError('Selecciona un insumo para el conteo.')
      return
    }
    if (!Number.isFinite(cantidadNum) || cantidadNum < 0) {
      setError('La cantidad contada debe ser un número mayor o igual a cero.')
      return
    }

    const momentoEtiqueta = momento === 'apertura' ? 'Apertura' : 'Cierre'
    const ok = await confirmar({
      titulo: `Registrar Conteo de ${momentoEtiqueta}`,
      mensaje: `¿Confirmas registrar ${cantidadNum} ${insumoSeleccionado?.unidadMedida ?? 'unidades'} en el conteo de ${momentoEtiqueta.toLowerCase()} para "${
        insumoSeleccionado?.nombre ?? 'Insumo'
      }"? El stock actual del insumo quedará fijado a este valor.`,
      textoConfirmar: `Registrar ${momentoEtiqueta}`,
      varianteConfirmar: momento === 'apertura' ? 'blue' : 'primary',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onRegistrar({
        insumoId,
        momento,
        cantidad: cantidadNum,
        usuarioId,
        observaciones: observaciones.trim() === '' ? undefined : observaciones.trim(),
      })
      setExito(`Conteo de ${momentoEtiqueta.toLowerCase()} registrado correctamente para ${insumoSeleccionado?.nombre}.`)
      setCantidad('')
      setObservaciones('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el conteo de inventario.',
      )
    } finally {
      setEnviando(false)
    }
  }

  const opcionesInsumos = [
    { value: '', label: 'Selecciona un insumo para contar…' },
    ...insumos
      .filter((i) => i.activo)
      .map((insumo) => ({
        value: insumo.id,
        label: `${insumo.nombre} (Stock actual: ${insumo.stockActual} ${insumo.unidadMedida})`,
      })),
  ]

  // Mapa rápido de nombres de insumos para el historial
  const mapaInsumos = new Map(insumos.map((i) => [i.id, i]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Selector de Momento de Conteo: Apertura o Cierre */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Momento del Conteo Diario
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setMomento('apertura')}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '10px 16px',
                borderRadius: 10,
                border: momento === 'apertura' ? '2px solid #10b981' : '1px solid var(--border-soft)',
                background: momento === 'apertura' ? 'rgba(16, 185, 129, 0.15)' : 'var(--input-bg)',
                color: momento === 'apertura' ? '#10b981' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              Apertura
            </button>

            <button
              type="button"
              onClick={() => setMomento('cierre')}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '10px 16px',
                borderRadius: 10,
                border: momento === 'cierre' ? '2px solid #6366f1' : '1px solid var(--border-soft)',
                background: momento === 'cierre' ? 'rgba(99, 102, 241, 0.15)' : 'var(--input-bg)',
                color: momento === 'cierre' ? '#818cf8' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              Cierre
            </button>
          </div>
        </div>

        {/* Campos de Insumo y Cantidad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Select
            label="Insumo a contar"
            id="conteo_insumo_id"
            value={insumoId}
            onChange={(e) => {
              setInsumoId(e.target.value)
              setError(null)
              setExito(null)
            }}
            options={opcionesInsumos}
            required
            containerStyle={{ marginBottom: 0 }}
            labelStyle={{ minHeight: 34, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', lineHeight: 1.25 }}
          />

          <Input
            label={`Cantidad física contada (${insumoSeleccionado?.unidadMedida ?? 'unidades'})`}
            id="conteo_cantidad"
            type="number"
            min="0"
            step="0.01"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="0.00"
            required
            containerStyle={{ marginBottom: 0 }}
            labelStyle={{ minHeight: 34, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', lineHeight: 1.25 }}
          />
        </div>

        {/* Info Card del Insumo Seleccionado */}
        {insumoSeleccionado && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(65, 175, 224, 0.08)',
              border: '1px solid rgba(65, 175, 224, 0.25)',
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Stock Actual: </span>
              <strong style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
                {insumoSeleccionado.stockActual} {insumoSeleccionado.unidadMedida}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Mínimo General (Almacén): </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {insumoSeleccionado.stockMinimo} {insumoSeleccionado.unidadMedida}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Mínimo por Día (Caja): </span>
              <strong style={{ color: '#06b6d4' }}>
                {insumoSeleccionado.stockMinimoDiario} {insumoSeleccionado.unidadMedida}
              </strong>
            </div>
          </div>
        )}

        {/* Alerta de Mínimo en tiempo real */}
        {alertaMinimo && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {alertaMinimo}
          </div>
        )}

        <Input
          label="Observaciones o notas (opcional)"
          id="conteo_observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: Stock verificado en almacén y punto de caja..."
        />

        {error && (
          <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
            {error}
          </p>
        )}

        {exito && (
          <p role="status" style={{ margin: 0, color: '#10b981', fontSize: 13, fontWeight: 600 }}>
            {exito}
          </p>
        )}

        <div>
          <Button
            type="submit"
            variant={momento === 'apertura' ? 'blue' : 'primary'}
            disabled={enviando || !insumoId}
            style={{ minWidth: 200 }}
          >
            {enviando
              ? 'Registrando conteo…'
              : `Registrar Conteo de ${momento === 'apertura' ? 'Apertura' : 'Cierre'}`}
          </Button>
        </div>
      </form>

      {/* Historial de Conteos Recientes */}
      {conteosRecientes.length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--hr-line)', paddingTop: 16 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Conteos Registrados Recientemente
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hr-line)', color: 'var(--text-faint)', textTransform: 'uppercase', fontSize: 11 }}>
                  <th style={{ padding: '8px 10px' }}>Fecha / Hora</th>
                  <th style={{ padding: '8px 10px' }}>Insumo</th>
                  <th style={{ padding: '8px 10px' }}>Tipo Conteo</th>
                  <th style={{ padding: '8px 10px' }}>Cantidad</th>
                  <th style={{ padding: '8px 10px' }}>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {conteosRecientes.slice(0, 10).map((c) => {
                  const ins = mapaInsumos.get(c.insumoId)
                  const esApertura = c.tipoMovimiento === 'conteo_apertura' || c.tipoMovimiento === 'inventario_inicial'
                  const fecha = new Date(c.createdAt).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
                      <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{fecha}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ins?.nombre ?? 'Insumo'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: esApertura ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: esApertura ? '#10b981' : '#818cf8',
                            border: esApertura ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          {esApertura ? 'Apertura' : 'Cierre'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--brand-blue)' }}>
                        {c.cantidad} {ins?.unidadMedida ?? 'unidades'}
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                        {c.observaciones ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
