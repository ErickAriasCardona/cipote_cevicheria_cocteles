import { useState } from 'react'
import type { ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { formatearCOP } from '../../utils/moneda'

interface ProductoTamanoPrecioTableProps {
  filas: ProductoTamanoPrecio[]
  tamanosVaso: TamanoVaso[]
  onActualizarPrecio: (tamanoVasoId: string, precio: number) => void
  onCambiarActivo: (tamanoVasoId: string, activo: boolean) => void
  onEliminar: (tamanoVasoId: string, etiqueta: string) => Promise<void>
}

function etiquetaTamano(tamanosVaso: TamanoVaso[], tamanoVasoId: string): string {
  const tamano = tamanosVaso.find((t) => t.id === tamanoVasoId)
  return tamano ? tamano.etiqueta : tamanoVasoId
}

function IconoPower() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function IconoTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

interface FilaProps {
  fila: ProductoTamanoPrecio
  etiqueta: string
  onActualizarPrecio: ProductoTamanoPrecioTableProps['onActualizarPrecio']
  onCambiarActivo: ProductoTamanoPrecioTableProps['onCambiarActivo']
  onEliminar: ProductoTamanoPrecioTableProps['onEliminar']
}

function FilaProductoTamanoPrecio({ fila, etiqueta, onActualizarPrecio, onCambiarActivo, onEliminar }: FilaProps) {
  const { confirmar } = useConfirmacion()
  const [precio, setPrecio] = useState(String(fila.precio))
  const precioNumerico = Number(precio)

  async function handleGuardarPrecio() {
    const ok = await confirmar({
      titulo: 'Actualizar precio',
      mensaje: `¿Confirmas cambiar el precio de "${etiqueta}" de ${formatearCOP(fila.precio)} a ${formatearCOP(precioNumerico)}?`,
      textoConfirmar: 'Guardar',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    onActualizarPrecio(fila.tamanoVasoId, precioNumerico)
  }

  async function handleCambiarActivo() {
    const siguienteActivo = !fila.activo
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Reactivar tamaño' : 'Desactivar tamaño',
      mensaje: siguienteActivo
        ? `¿Confirmas reactivar el tamaño "${etiqueta}" para este producto?`
        : `¿Confirmas desactivar el tamaño "${etiqueta}"? No estará disponible para venta, pero conserva el histórico de precio.`,
      textoConfirmar: siguienteActivo ? 'Reactivar' : 'Desactivar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(fila.tamanoVasoId, siguienteActivo)
  }

  async function handleEliminar() {
    const ok = await confirmar({
      titulo: 'Eliminar tamaño',
      mensaje: `¿Confirmas eliminar permanentemente la presentación "${etiqueta}" de este producto?`,
      textoConfirmar: 'Eliminar',
      varianteConfirmar: 'destructive',
    })
    if (!ok) return
    await onEliminar(fila.tamanoVasoId, etiqueta)
  }

  const precioCambio = Number.isFinite(precioNumerico) && precioNumerico > 0 && precioNumerico !== fila.precio

  return (
    <tr style={{ borderBottom: '1px solid var(--hr-line)' }}>
      <td style={{ padding: '8px 6px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
        {etiqueta}
      </td>
      <td style={{ padding: '8px 6px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="number"
            min="0"
            step="1"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            style={{
              width: 76,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 6,
              padding: '4px 6px',
              fontSize: 12,
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
            style={{ padding: '3px 7px', fontSize: 11, height: 28 }}
          >
            Guardar
          </Button>
        </div>
      </td>
      <td style={{ padding: '8px 6px' }}>
        <button
          type="button"
          className={`btn-estado-toggle ${fila.activo ? 'activo' : 'inactivo'}`}
          onClick={handleCambiarActivo}
          style={{ padding: '3px 8px', fontSize: 11.5 }}
          title={fila.activo ? 'Desactivar presentación' : 'Reactivar presentación'}
        >
          <IconoPower />
          <span>{fila.activo ? 'Activo' : 'Inactivo'}</span>
        </button>
      </td>
      <td style={{ padding: '8px 6px' }}>
        {/* Botón Eliminar (Trash) */}
        <button
          type="button"
          title="Eliminar presentación"
          onClick={handleEliminar}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <IconoTrash />
        </button>
      </td>
    </tr>
  )
}

export function ProductoTamanoPrecioTable({
  filas,
  tamanosVaso,
  onActualizarPrecio,
  onCambiarActivo,
  onEliminar,
}: ProductoTamanoPrecioTableProps) {
  if (filas.length === 0) {
    return (
      <div
        style={{
          padding: '22px 18px',
          borderRadius: 12,
          border: '1.5px dashed var(--dashed-border)',
          background: 'var(--dashed-bg)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}
      >
        <p style={{ margin: '0 0 3px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Sin presentaciones configuradas
        </p>
        <p style={{ margin: 0, fontSize: 12 }}>
          Este producto aún no tiene presentaciones activas. Usa el formulario de abajo para agregar la primera.
        </p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr
            style={{
              borderBottom: '2px solid var(--hr-line)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: 'var(--text-faint)',
            }}
          >
            <th style={{ padding: '8px 8px' }}>Presentación</th>
            <th style={{ padding: '8px 8px' }}>Precio de Venta ($)</th>
            <th style={{ padding: '8px 8px' }}>Estado</th>
            <th style={{ padding: '8px 8px', minWidth: 80 }}>Acciones</th>
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
              onEliminar={onEliminar}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
