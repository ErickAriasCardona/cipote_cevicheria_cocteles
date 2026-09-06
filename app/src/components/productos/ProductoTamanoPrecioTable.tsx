import { useState } from 'react'
import type { ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface ProductoTamanoPrecioTableProps {
  filas: ProductoTamanoPrecio[]
  tamanosVaso: TamanoVaso[]
  onActualizarPrecio: (tamanoVasoId: string, precio: number) => void
  onCambiarActivo: (tamanoVasoId: string, activo: boolean) => void
}

function etiquetaTamano(tamanosVaso: TamanoVaso[], tamanoVasoId: string): string {
  const tamano = tamanosVaso.find((t) => t.id === tamanoVasoId)
  return tamano ? `${tamano.etiqueta} (${tamano.onzas} oz)` : tamanoVasoId
}

interface FilaProps {
  fila: ProductoTamanoPrecio
  etiqueta: string
  onActualizarPrecio: ProductoTamanoPrecioTableProps['onActualizarPrecio']
  onCambiarActivo: ProductoTamanoPrecioTableProps['onCambiarActivo']
}

function FilaProductoTamanoPrecio({ fila, etiqueta, onActualizarPrecio, onCambiarActivo }: FilaProps) {
  const { confirmar } = useConfirmacion()
  const [precio, setPrecio] = useState(String(fila.precio))
  const precioNumerico = Number(precio)

  async function handleGuardarPrecio() {
    const ok = await confirmar({
      titulo: 'Actualizar precio',
      mensaje: `¿Confirmas cambiar el precio de "${etiqueta}" de $${fila.precio.toFixed(2)} a $${precioNumerico.toFixed(2)}?`,
      textoConfirmar: 'Guardar',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    onActualizarPrecio(fila.tamanoVasoId, precioNumerico)
  }

  async function handleCambiarActivo() {
    const siguienteActivo = !fila.activo
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Reactivar tamaño' : 'Quitar tamaño',
      mensaje: siguienteActivo
        ? `¿Confirmas volver a activar el tamaño "${etiqueta}" para este producto?`
        : `¿Confirmas quitar el tamaño "${etiqueta}" de este producto? Deja de estar disponible para venta, pero conserva el historial de precio.`,
      textoConfirmar: siguienteActivo ? 'Reactivar' : 'Quitar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(fila.tamanoVasoId, siguienteActivo)
  }

  const precioCambio = Number.isFinite(precioNumerico) && precioNumerico > 0 && precioNumerico !== fila.precio

  return (
    <tr style={{ borderBottom: '1px solid var(--hr-line)' }}>
      <td style={{ padding: '12px 10px', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
        {etiqueta}
      </td>
      <td style={{ padding: '12px 10px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            style={{
              width: 90,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--sans)',
              outline: 'none',
            }}
          />
          <Button
            type="button"
            variant={precioCambio ? 'blue' : 'secondary'}
            size="sm"
            onClick={handleGuardarPrecio}
            disabled={!precioCambio}
          >
            Guardar
          </Button>
        </div>
      </td>
      <td style={{ padding: '12px 10px' }}>
        <StatusPill variant={fila.activo ? 'positive' : 'destructive'}>
          {fila.activo ? 'Activo' : 'Inactivo'}
        </StatusPill>
      </td>
      <td style={{ padding: '12px 10px' }}>
        <Button
          type="button"
          variant={fila.activo ? 'destructive' : 'activate'}
          size="sm"
          onClick={handleCambiarActivo}
        >
          {fila.activo ? 'Quitar' : 'Reactivar'}
        </Button>
      </td>
    </tr>
  )
}

export function ProductoTamanoPrecioTable({
  filas,
  tamanosVaso,
  onActualizarPrecio,
  onCambiarActivo,
}: ProductoTamanoPrecioTableProps) {
  if (filas.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '14px 0', fontSize: 13.5 }}>
        Este producto todavía no tiene ningún tamaño con precio configurado.
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
            <th style={{ padding: '8px 10px' }}>Tamaño de vaso</th>
            <th style={{ padding: '8px 10px' }}>Precio</th>
            <th style={{ padding: '8px 10px' }}>Estado</th>
            <th style={{ padding: '8px 10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <FilaProductoTamanoPrecio
              key={fila.tamanoVasoId}
              fila={fila}
              etiqueta={etiquetaTamano(tamanosVaso, fila.tamanoVasoId)}
              onActualizarPrecio={onActualizarPrecio}
              onCambiarActivo={onCambiarActivo}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
