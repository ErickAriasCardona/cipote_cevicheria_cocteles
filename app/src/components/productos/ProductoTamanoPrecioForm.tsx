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

  const idSeleccionado = tamanosDisponibles.some((t) => t.id === tamanoVasoId)
    ? tamanoVasoId
    : tamanosDisponibles[0]?.id ?? ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const precioNumerico = Number(precio)
    if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
      setError('El precio debe ser un número mayor que cero.')
      return
    }
    const tamano = tamanosDisponibles.find((t) => t.id === idSeleccionado)
    const ok = await confirmar({
      titulo: 'Agregar presentación',
      mensaje: `¿Confirmas agregar el tamaño "${tamano?.etiqueta ?? idSeleccionado}" con precio $${precioNumerico.toFixed(2)} a "${nombreProducto}"?`,
      textoConfirmar: 'Agregar',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    setEnviando(true)
    try {
      await onCrear({ productoId, tamanoVasoId: idSeleccionado, precio: precioNumerico })
      setPrecio('')
      const siguiente = tamanosDisponibles.find((t) => t.id !== idSeleccionado)
      if (siguiente) setTamanoVasoId(siguiente.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el tamaño y precio.')
    } finally {
      setEnviando(false)
    }
  }

  if (tamanosDisponibles.length === 0) {
    return (
      <div
        style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18, color: '#10b981', fontWeight: 800 }}>✓</div>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#10b981', fontWeight: 700 }}>
            Todas las presentaciones configuradas
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
            Este producto ya tiene registrados todos los tamaños disponibles de su categoría.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <h5 style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
          + Agregar presentación
        </h5>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
          Selecciona un tamaño disponible e ingresa su precio para activarlo en venta.
        </p>
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--brand-red)', fontWeight: 600 }}>
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 200px', minWidth: 160 }}>
          <Select
            label="Tamaño o presentación"
            id="ptp_tamano_vaso_id"
            value={idSeleccionado}
            onChange={(e) => setTamanoVasoId(e.target.value)}
            options={tamanosDisponibles.map((tamano) => ({
              value: tamano.id,
              label: tamano.etiqueta,
            }))}
          />
        </div>

        <div style={{ width: 170 }}>
          <Input
            label="Precio de venta ($)"
            id="ptp_precio"
            type="number"
            min="0.01"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Ej: 14000"
            required
          />
        </div>

        <Button
          type="submit"
          variant="blue"
          disabled={enviando || !idSeleccionado || !precio}
          style={{ height: 42, borderRadius: 10, padding: '0 20px', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          {enviando ? 'Guardando…' : '+ Agregar presentación'}
        </Button>
      </form>
    </div>
  )
}
