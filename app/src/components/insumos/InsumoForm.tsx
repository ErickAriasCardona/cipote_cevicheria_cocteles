import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CrearInsumoInput, TipoInsumo } from '../../types/insumo'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface InsumoFormProps {
  onCrear: (input: CrearInsumoInput) => Promise<void>
}

const TIPOS: { value: TipoInsumo; label: string }[] = [
  { value: 'otro', label: 'Otro insumo' },
  { value: 'vaso', label: 'Vaso' },
]

export function InsumoForm({ onCrear }: InsumoFormProps) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoInsumo>('otro')
  const [unidadMedida, setUnidadMedida] = useState('unidad')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const ok = await confirmar({
      titulo: 'Crear insumo',
      mensaje: `¿Confirmas crear el insumo "${nombre}" (${tipo === 'vaso' ? 'Vaso' : 'Otro'}, unidad: ${unidadMedida})?`,
      textoConfirmar: 'Crear insumo',
    })
    if (!ok) return
    setEnviando(true)
    try {
      await onCrear({ nombre, tipo, unidadMedida })
      setNombre('')
      setTipo('otro')
      setUnidadMedida('unidad')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el insumo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <GlassCard padding={22}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nuevo Insumo</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <Input
            label="Nombre del insumo"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Vaso 7oz, Camarón crudo..."
            required
          />

          <Select
            label="Tipo de insumo"
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoInsumo)}
            options={TIPOS}
          />

          <Input
            label="Unidad de medida"
            id="unidad_medida"
            value={unidadMedida}
            onChange={(e) => setUnidadMedida(e.target.value)}
            placeholder="unidad, gramo, kg..."
            required
          />
        </div>

        {error && (
          <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
            {error}
          </p>
        )}

        <div>
          <Button type="submit" variant="primary" size="md" disabled={enviando}>
            {enviando ? 'Creando…' : 'Crear Insumo'}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
