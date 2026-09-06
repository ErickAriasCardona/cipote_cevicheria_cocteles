import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Insumo } from '../../types/insumo'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface InventarioInicialFormProps {
  insumosVaso: Insumo[]
  onRegistrar: (input: { insumoId: string; cantidad: number; observaciones?: string }) => Promise<void>
}

export function InventarioInicialForm({ insumosVaso, onRegistrar }: InventarioInicialFormProps) {
  const [insumoId, setInsumoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setExito(null)

    const cantidadNumerica = Number(cantidad)
    if (!insumoId) {
      setError('Selecciona un tamaño de vaso.')
      return
    }
    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
      setError('La cantidad contada debe ser un número mayor que cero.')
      return
    }

    const insumoSeleccionado = insumosVaso.find((insumo) => insumo.id === insumoId)
    const ok = await confirmar({
      titulo: 'Registrar inventario inicial',
      mensaje: `¿Confirmas registrar ${cantidadNumerica} unidades de inventario inicial para "${
        insumoSeleccionado?.nombre ?? insumoId
      }"? Esta acción no se puede repetir el mismo día.`,
      textoConfirmar: 'Registrar',
      varianteConfirmar: 'blue',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onRegistrar({
        insumoId,
        cantidad: cantidadNumerica,
        observaciones: observaciones.trim() === '' ? undefined : observaciones.trim(),
      })
      setExito('Inventario inicial registrado correctamente.')
      setInsumoId('')
      setCantidad('')
      setObservaciones('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el inventario inicial de este insumo.',
      )
    } finally {
      setEnviando(false)
    }
  }

  if (insumosVaso.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
        No hay insumos de tipo vaso activos para registrar inventario inicial.
      </p>
    )
  }

  const opcionesInsumos = [
    { value: '', label: 'Selecciona un insumo…' },
    ...insumosVaso.map((insumo) => ({ value: insumo.id, label: insumo.nombre })),
  ]

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Select
          label="Tamaño de vaso (insumo)"
          id="inventario_insumo"
          value={insumoId}
          onChange={(e) => setInsumoId(e.target.value)}
          options={opcionesInsumos}
          required
        />

        <Input
          label="Cantidad contada"
          id="inventario_cantidad"
          type="number"
          min="1"
          step="1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="Ej: 50"
          required
        />

        <Input
          label="Observaciones (opcional)"
          id="inventario_observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Comentarios adicionales"
        />
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
          {error}
        </p>
      )}

      {exito && (
        <p style={{ margin: 0, color: 'var(--brand-green)', fontSize: 13, fontWeight: 600 }}>
          ✓ {exito}
        </p>
      )}

      <div>
        <Button type="submit" variant="blue" size="md" disabled={enviando}>
          {enviando ? 'Registrando…' : 'Registrar Inventario Inicial'}
        </Button>
      </div>
    </form>
  )
}
