import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Insumo } from '../../types/insumo'
import type { CondicionReceta, CrearRecetaInput } from '../../types/productoReceta'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface RecetaFormProps {
  productoId: string
  insumos: Insumo[]
  onCrear: (input: CrearRecetaInput) => Promise<void>
}

const CONDICIONES: CondicionReceta[] = ['siempre', 'para_llevar', 'consumo_lugar']

const ETIQUETAS_CONDICION: Record<CondicionReceta, string> = {
  siempre: 'Siempre',
  para_llevar: 'Para llevar',
  consumo_lugar: 'Consumo en el lugar',
}

export function RecetaForm({ productoId, insumos, onCrear }: RecetaFormProps) {
  const [insumoId, setInsumoId] = useState(insumos[0]?.id ?? '')
  const [condicion, setCondicion] = useState<CondicionReceta>('siempre')
  const [cantidad, setCantidad] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const nombreInsumo = insumos.find((insumo) => insumo.id === insumoId)?.nombre ?? insumoId
    const ok = await confirmar({
      titulo: 'Agregar a la receta',
      mensaje: `¿Confirmas agregar ${cantidad} de "${nombreInsumo}" (${ETIQUETAS_CONDICION[condicion]}) a la receta?`,
      textoConfirmar: 'Agregar',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    setEnviando(true)
    try {
      await onCrear({ productoId, insumoId, condicion, cantidad: Number(cantidad) })
      setCantidad('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la regla de receta.')
    } finally {
      setEnviando(false)
    }
  }

  if (insumos.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
        Registra al menos un insumo antes de configurar la receta.
      </p>
    )
  }

  const opcionesInsumos = insumos.map((i) => ({
    value: i.id,
    label: `${i.nombre} (${i.unidadMedida})`,
  }))

  const opcionesCondicion = CONDICIONES.map((c) => ({
    value: c,
    label: ETIQUETAS_CONDICION[c],
  }))

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'flex-end',
        padding: '16px',
        background: 'var(--input-bg)',
        border: '1px dashed var(--input-border)',
        borderRadius: 12,
      }}
    >
      <div style={{ flex: '1 1 200px' }}>
        <Select
          label="Insumo"
          id="insumo_id"
          value={insumoId}
          onChange={(e) => setInsumoId(e.target.value)}
          options={opcionesInsumos}
        />
      </div>

      <div style={{ flex: '1 1 170px' }}>
        <Select
          label="Condición"
          id="condicion"
          value={condicion}
          onChange={(e) => setCondicion(e.target.value as CondicionReceta)}
          options={opcionesCondicion}
        />
      </div>

      <div style={{ width: 120 }}>
        <Input
          label="Cantidad"
          id="cantidad"
          type="number"
          min="0.001"
          step="0.001"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <Button type="submit" variant="blue" size="md" disabled={enviando || !insumoId || !cantidad}>
        {enviando ? 'Guardando…' : '+ Agregar a la receta'}
      </Button>

      {error && (
        <p role="alert" style={{ width: '100%', margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
          {error}
        </p>
      )}
    </form>
  )
}
