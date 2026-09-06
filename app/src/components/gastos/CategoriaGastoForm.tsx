import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CrearCategoriaGastoInput } from '../../types/categoriaGasto'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface CategoriaGastoFormProps {
  onCrear: (input: CrearCategoriaGastoInput) => Promise<void>
}

export function CategoriaGastoForm({ onCrear }: CategoriaGastoFormProps) {
  const [nombre, setNombre] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const ok = await confirmar({
      titulo: 'Crear categoría de gasto',
      mensaje: `¿Confirmas crear la categoría de gasto "${nombre}"?`,
      textoConfirmar: 'Crear categoría',
      varianteConfirmar: 'primary',
    })
    if (!ok) return
    setEnviando(true)
    try {
      await onCrear({ nombre })
      setNombre('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría de gasto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'flex-end',
        marginBottom: 16,
      }}
    >
      <div style={{ flex: '1 1 280px' }}>
        <Input
          label="Nombre de la categoría"
          id="nombre_categoria_gasto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Compra, Servicio, Nómina, Arriendo…"
          containerStyle={{ marginBottom: 0 }}
          required
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={enviando || !nombre.trim()}
        style={{
          height: 44,
          borderRadius: 12,
          whiteSpace: 'nowrap',
        }}
      >
        {enviando ? 'Creando…' : '+ Crear categoría'}
      </Button>

      {error && (
        <p role="alert" style={{ width: '100%', margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
          {error}
        </p>
      )}
    </form>
  )
}
