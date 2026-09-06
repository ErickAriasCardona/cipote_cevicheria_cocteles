import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type { CerrarCajaInput } from '../../types/cierreCaja'
import type { TransferenciaTurno } from '../../services/transferenciasService'
import { GlassCard } from '../ui/GlassCard'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'

interface CierreCajaFormProps {
  tamanosVaso: TamanoVaso[]
  transferencias?: TransferenciaTurno[]
  onCerrar: (input: CerrarCajaInput) => Promise<void>
}

/**
 * Formulario de cierre de caja + conteo físico de vasos (BD-06.3/06.4,
 * RF-02.2/HU-02.2 + RF-04.4/HU-04.4).
 */
export function CierreCajaForm({ tamanosVaso, transferencias = [], onCerrar }: CierreCajaFormProps) {
  const [dineroContado, setDineroContado] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [conteoFisico, setConteoFisico] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const pendientes = transferencias.filter((t) => t.pago.estadoTransferencia === 'pendiente')
  const totalMontoPendiente = pendientes.reduce((acc, t) => acc + Number(t.pago.monto), 0)

  function handleCambiarConteo(tamanoVasoId: string, valor: string) {
    setConteoFisico((actual) => ({ ...actual, [tamanoVasoId]: valor }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const monto = Number(dineroContado)
    if (dineroContado.trim() === '' || !Number.isFinite(monto) || monto < 0) {
      setError('El dinero contado debe ser un número mayor o igual a cero.')
      return
    }

    const conteoVasos: { tamanoVasoId: string; cantidadFisica: number }[] = []
    for (const tamano of tamanosVaso) {
      const valorTexto = conteoFisico[tamano.id] ?? ''
      const cantidad = Number(valorTexto)
      if (valorTexto.trim() === '' || !Number.isFinite(cantidad) || cantidad < 0) {
        setError(`Ingresa el conteo físico de vasos "${tamano.etiqueta}" (número mayor o igual a cero).`)
        return
      }
      conteoVasos.push({ tamanoVasoId: tamano.id, cantidadFisica: cantidad })
    }

    const ok = await confirmar({
      titulo: 'Cerrar caja',
      mensaje:
        '¿Confirmas cerrar caja con el dinero contado y el conteo físico de vasos ingresados? ' +
        'Esta acción es definitiva: el resultado no se puede editar después de guardarlo (RN-004).',
      textoConfirmar: 'Cerrar caja',
      varianteConfirmar: 'primary',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onCerrar({
        dineroContado: monto,
        observaciones: observaciones.trim() === '' ? undefined : observaciones.trim(),
        conteoVasos,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la caja.')
    } finally {
      setEnviando(false)
    }
  }

  if (tamanosVaso.length === 0) {
    return (
      <GlassCard style={{ maxWidth: 500, margin: '20px auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          No hay tamaños de vaso activos configurados; no se puede cerrar caja sin conteo.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard style={{ maxWidth: 580, margin: '0 auto', padding: '36px 36px' }}>
      <h2
        style={{
          margin: '0 0 20px',
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.3px',
          color: 'var(--text-primary)',
        }}
      >
        Cerrar caja
      </h2>

      {pendientes.length > 0 && (
        <div
          style={{
            marginBottom: 22,
            padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(217, 119, 6, 0.12)',
            border: '1px solid rgba(217, 119, 6, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              Tienes {pendientes.length} transferencia(s) pendiente(s) por confirmar ($
              {totalMontoPendiente.toLocaleString('es-CO')})
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Por regla de negocio (RN-007), solo las transferencias marcadas como <strong>Exitosa</strong> se sumarán al balance del cierre.
          </p>
          <div style={{ marginTop: 4 }}>
            <Link
              to="/cajero/transferencias"
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--brand-blue)',
                textDecoration: 'underline',
              }}
            >
              Revisar transferencias pendientes antes de cerrar caja →
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          id="cierre_dinero_contado"
          label="Dinero contado físicamente (COP)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={dineroContado}
          onChange={(e) => setDineroContado(e.target.value)}
          required
        />

        <Textarea
          id="cierre_observaciones"
          label="Observaciones (opcional)"
          placeholder="Novedades del turno, motivos de sobrante o faltante..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'block',
              marginBottom: 10,
            }}
          >
            Conteo físico de vasos por tamaño
          </span>

          <div
            style={{
              borderRadius: 14,
              border: '1px solid var(--input-border)',
              background: 'var(--sheen), var(--input-bg)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Tamaño</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Cantidad física contada</th>
                </tr>
              </thead>
              <tbody>
                {tamanosVaso.map((tamano) => (
                  <tr key={tamano.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tamano.etiqueta} ({tamano.onzas} oz)
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                      <input
                        id={`conteo_${tamano.id}`}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={conteoFisico[tamano.id] ?? ''}
                        onChange={(e) => handleCambiarConteo(tamano.id, e.target.value)}
                        style={{
                          width: 100,
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          borderRadius: 8,
                          padding: '7px 10px',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          fontFamily: 'var(--sans)',
                          textAlign: 'right',
                          outline: 'none',
                        }}
                        required
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <p role="alert" style={{ margin: '10px 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--red-text)' }}>
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" fullWidth size="lg" disabled={enviando} style={{ marginTop: 8 }}>
          {enviando ? 'Cerrando caja…' : 'Cerrar caja'}
        </Button>
      </form>
    </GlassCard>
  )
}
