import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { formatearCOP } from '../../utils/moneda'
import { ventasService } from '../../services/ventasService'
import { insumosService } from '../../services/insumosService'

interface AperturaCajaFormProps {
  /** Nombre del cajero autenticado, solo para mostrar (HU-02.1 CA-02: el
   * cajero se asocia automáticamente al usuario autenticado, no es un campo
   * elegible). */
  nombreCajero: string
  onAbrir: (dineroInicial: number) => Promise<void>
}

/**
 * Formulario de apertura de caja (BD-03.2, RF-02.1/HU-02.1). Cada envío crea
 * un turno real en `turnos_caja` vía `cajaService.abrirCaja`.
 */
export function AperturaCajaForm({ nombreCajero, onAbrir }: AperturaCajaFormProps) {
  const [dineroInicial, setDineroInicial] = useState('')
  const [vasosApertura, setVasosApertura] = useState<{ id: string; etiqueta: string; stock: number }[]>([])
  const [cargandoVasos, setCargandoVasos] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  useEffect(() => {
    let activo = true
    async function cargarVasos() {
      try {
        const [tamanos, insumos] = await Promise.all([
          ventasService.listarTamanosVasoActivos(),
          insumosService.listarInsumos(),
        ])
        if (!activo) return
        const ordenOnzas: Record<string, number> = { '7oz': 7, '9oz': 9, '12oz': 12, '16oz': 16 }
        const vasosFisicos = tamanos
          .filter((t) => t.tipo === 'vaso' && t.insumoId)
          .map((t) => {
            const insumo = insumos.find((i) => i.id === t.insumoId)
            const unidadesDia =
              insumo?.stockMinimoDiario && insumo.stockMinimoDiario > 0
                ? Math.round(insumo.stockMinimoDiario)
                : insumo
                  ? Math.round(insumo.stockActual)
                  : 0
            return {
              id: t.id,
              etiqueta: `Vaso ${t.etiqueta} (${t.categoria === 'ceviche' ? 'Ceviche' : 'Granizado'})`,
              stock: unidadesDia,
              categoria: t.categoria ?? 'ceviche',
              onzas: t.onzas ?? ordenOnzas[t.etiqueta] ?? 0,
            }
          })
          .sort((a, b) => {
            if (a.categoria !== b.categoria) {
              return a.categoria === 'ceviche' ? -1 : 1
            }
            return a.onzas - b.onzas
          })
        setVasosApertura(vasosFisicos)
      } catch (err) {
        console.error('Error cargando vasos para apertura:', err)
      } finally {
        if (activo) setCargandoVasos(false)
      }
    }
    cargarVasos()
    return () => {
      activo = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const monto = Number(dineroInicial)
    if (!Number.isFinite(monto) || monto < 0) {
      setError('El dinero inicial debe ser un número no negativo.')
      return
    }

    const ok = await confirmar({
      titulo: 'Abrir caja',
      mensaje: `¿Confirmas abrir caja con un dinero inicial de ${formatearCOP(monto)}? Esta acción inicia un turno y no se puede deshacer desde aquí.`,
      textoConfirmar: 'Abrir caja',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onAbrir(monto)
      setDineroInicial('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la caja.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <GlassCard style={{ maxWidth: 500, margin: '20px auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
        Apertura de caja
      </h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: 12,
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>Cajero responsable:</span>
        <strong style={{ color: 'var(--text-primary)' }}>{nombreCajero}</strong>
      </div>

      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <Input
          id="dinero_inicial"
          label="Dinero inicial en caja (COP)"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          value={dineroInicial}
          onChange={(e) => setDineroInicial(e.target.value)}
          required
        />

        <div
          style={{
            marginTop: 16,
            marginBottom: 16,
            padding: '14px 16px',
            borderRadius: 12,
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Inventario de vasos del día (Mostrador)
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(56, 139, 253, 0.15)',
                color: 'var(--brand-blue)',
              }}
            >
              Stock del Día
            </span>
          </div>

          {cargandoVasos ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Cargando inventario de vasos…</p>
          ) : vasosApertura.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {vasosApertura.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12.5,
                    padding: '4px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{v.etiqueta}:</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{v.stock} unidades (Día)</strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              Sin tamaños de vaso activos configurados.
            </p>
          )}

          <p style={{ margin: '10px 0 0', fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Inicias tu turno con las existencias operativas asignadas para el día. Si requieres abastecer más vasos durante la jornada, podrás registrarlos con el botón <strong>&quot;+ Ingresar Vasos&quot;</strong>.
          </p>
        </div>

        {error && (
          <p role="alert" style={{ margin: '8px 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--red-text)' }}>
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" fullWidth size="lg" disabled={enviando} style={{ marginTop: 4 }}>
          {enviando ? 'Abriendo caja…' : 'Abrir caja'}
        </Button>
      </form>
    </GlassCard>
  )
}
