import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ComboTamanoPrecioInput } from '../../types/productoTamanoPrecio'
import type { ComboUnidad } from '../../utils/unidadMedida'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { IconoCheck } from '../ui/IconosFormas'
import { formatearCOP } from '../../utils/moneda'

interface ProductoTamanoPrecioFormProps {
  productoId: string
  nombreProducto: string
  /** Combinaciones (tipoUnidad, valorUnidad) todavía no configuradas para
   * este producto, derivadas en vivo de `insumos` para la categoría del
   * producto (ver `utils/unidadMedida.combosUnidadPorCategoria` y
   * `ProductosTable.obtenerCombosDisponibles`). */
  combosDisponibles: ComboUnidad[]
  onCrear: (input: ComboTamanoPrecioInput) => Promise<void>
}

function claveCombo(combo: { tipoUnidad: string; valorUnidad: number }): string {
  return `${combo.tipoUnidad}|${combo.valorUnidad}`
}

export function ProductoTamanoPrecioForm({
  productoId,
  nombreProducto,
  combosDisponibles,
  onCrear,
}: ProductoTamanoPrecioFormProps) {
  const [claveSeleccionada, setClaveSeleccionada] = useState(
    combosDisponibles[0] ? claveCombo(combosDisponibles[0]) : '',
  )
  const [precio, setPrecio] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const claveActual = combosDisponibles.some((c) => claveCombo(c) === claveSeleccionada)
    ? claveSeleccionada
    : (combosDisponibles[0] ? claveCombo(combosDisponibles[0]) : '')
  const comboSeleccionado = combosDisponibles.find((c) => claveCombo(c) === claveActual)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const precioNumerico = Number(precio)
    if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
      setError('El precio debe ser un número mayor que cero.')
      return
    }
    if (!comboSeleccionado) return
    const ok = await confirmar({
      titulo: 'Agregar presentación',
      mensaje: `¿Confirmas agregar el tamaño "${comboSeleccionado.etiqueta}" con precio ${formatearCOP(precioNumerico)} a "${nombreProducto}"?`,
      textoConfirmar: 'Agregar',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    setEnviando(true)
    try {
      await onCrear({
        productoId,
        tipoUnidad: comboSeleccionado.tipoUnidad,
        valorUnidad: comboSeleccionado.valorUnidad,
        precio: precioNumerico,
      })
      setPrecio('')
      const siguiente = combosDisponibles.find((c) => claveCombo(c) !== claveActual)
      if (siguiente) setClaveSeleccionada(claveCombo(siguiente))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el tamaño y precio.')
    } finally {
      setEnviando(false)
    }
  }

  if (combosDisponibles.length === 0) {
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
        <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconoCheck size={20} color="#10b981" strokeWidth={2.6} />
        </div>
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
    // form-add-row-container: establece el contexto de Container Query que
    // usa .form-add-row en index.css (ver comentario ahí) para decidir según
    // el ancho real disponible, no el de la ventana, si el botón cabe en la
    // misma fila o pasa a ocupar el ancho completo debajo.
    <div className="form-add-row-container" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

      <form onSubmit={handleSubmit} className="form-add-row">
        <div className="form-add-row-field">
          <Select
            label="Tamaño o presentación"
            id="ptp_combo_unidad"
            value={claveActual}
            onChange={(e) => setClaveSeleccionada(e.target.value)}
            options={combosDisponibles.map((combo) => ({
              value: claveCombo(combo),
              label: combo.etiqueta,
            }))}
          />
        </div>

        <div className="form-add-row-field form-add-row-field--narrow-lg">
          <Input
            label="Precio de venta ($)"
            id="ptp_precio"
            type="number"
            min="0"
            step="1"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Ej: 14000"
            required
          />
        </div>

        <Button
          type="submit"
          variant="blue"
          disabled={enviando || !claveActual || !precio}
          className="form-add-row-btn"
          style={{ height: 42, borderRadius: 10, padding: '0 20px', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          {enviando ? 'Guardando…' : '+ Agregar presentación'}
        </Button>
      </form>
    </div>
  )
}
