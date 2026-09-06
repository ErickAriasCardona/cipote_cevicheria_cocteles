import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CrearProductoTamanoPrecioInput } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface ProductoTamanoPrecioFormProps {
  productoId: string
  nombreProducto: string
  tamanosDisponibles: TamanoVaso[]
  onCrear: (input: CrearProductoTamanoPrecioInput) => Promise<void>
}

export function ProductoTamanoPrecioForm({
  productoId,
  nombreProducto,
  tamanosDisponibles,
  onCrear,
}: ProductoTamanoPrecioFormProps) {
  const [tamanoVasoId, setTamanoVasoId] = useState(tamanosDisponibles[0]?.id ?? '')
  const [precio, setPrecio] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const precioNumerico = Number(precio)
    if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
      setError('El precio debe ser un número mayor que cero.')
      return
    }
    const tamano = tamanosDisponibles.find((t) => t.id === tamanoVasoId)
    const ok = await confirmar({
      titulo: 'Agregar tamaño y precio',
      mensaje: `¿Confirmas agregar el tamaño "${tamano?.etiqueta ?? tamanoVasoId}" con precio $${precioNumerico.toFixed(2)} a "${nombreProducto}"?`,
      textoConfirmar: 'Agregar',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    setEnviando(true)
    try {
      await onCrear({ productoId, tamanoVasoId, precio: precioNumerico })
      setPrecio('')
      const siguiente = tamanosDisponibles.find((t) => t.id !== tamanoVasoId)
      if (siguiente) setTamanoVasoId(siguiente.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el tamaño y precio.')
    } finally {
      setEnviando(false)
    }
  }

  if (tamanosDisponibles.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--brand-green)', fontWeight: 600 }}>
        ✓ Este producto ya tiene configurados todos los tamaños de vaso disponibles.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'flex-end',
        padding: '14px 16px',
        background: 'var(--input-bg)',
        border: '1px dashed var(--input-border)',
        borderRadius: 12,
      }}
    >
      <div style={{ flex: '1 1 200px' }}>
        <Select
          label="Agregar tamaño / presentación"
          id="ptp_tamano_vaso_id"
          value={tamanoVasoId}
          onChange={(e) => setTamanoVasoId(e.target.value)}
          options={tamanosDisponibles.map((tamano) => ({
            value: tamano.id,
            label: tamano.etiqueta,
          }))}
        />
      </div>

      <div style={{ width: 130 }}>
        <Input
          label="Precio ($)"
          id="ptp_precio"
          type="number"
          min="0.01"
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <Button type="submit" variant="blue" size="md" disabled={enviando || !tamanoVasoId || !precio}>
        {enviando ? 'Guardando…' : '+ Agregar tamaño'}
      </Button>

      {error && (
        <p role="alert" style={{ width: '100%', margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
          {error}
        </p>
      )}
    </form>
  )
}
