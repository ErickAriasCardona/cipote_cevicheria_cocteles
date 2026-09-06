import type { Producto } from '../../types/producto'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface ProductosTableProps {
  productos: Producto[]
  conteoTamanosActivos: Map<string, number>
  productoSeleccionadoId: string
  onSeleccionar: (id: string) => void
  onCambiarActivo: (id: string, activo: boolean) => void
}

interface FilaProductoProps {
  producto: Producto
  tamanosActivos: number
  seleccionado: boolean
  onSeleccionar: ProductosTableProps['onSeleccionar']
  onCambiarActivo: ProductosTableProps['onCambiarActivo']
}

function FilaProducto({ producto, tamanosActivos, seleccionado, onSeleccionar, onCambiarActivo }: FilaProductoProps) {
  const { confirmar } = useConfirmacion()

  async function handleCambiarActivo() {
    const siguienteActivo = !producto.activo
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Activar producto' : 'Desactivar producto',
      mensaje: siguienteActivo
        ? `¿Confirmas activar el producto "${producto.nombre}"?`
        : `¿Confirmas desactivar el producto "${producto.nombre}"?`,
      textoConfirmar: siguienteActivo ? 'Activar' : 'Desactivar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(producto.id, siguienteActivo)
  }

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--hr-line)',
        background: seleccionado ? 'var(--blue-tint)' : 'transparent',
        transition: 'background 0.2s ease',
      }}
    >
      <td style={{ padding: '14px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
        {producto.nombre}
      </td>
      <td style={{ padding: '14px 12px', fontSize: 12.5, color: 'var(--text-secondary)' }}>
        {producto.precioLegado !== null
          ? `$${producto.precioLegado.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
          : '—'}
      </td>
      <td style={{ padding: '14px 12px' }}>
        <StatusPill variant={tamanosActivos > 0 ? 'positive' : 'neutral'}>
          {tamanosActivos > 0
            ? `${tamanosActivos} tamaño(s)`
            : 'Sin tamaños'}
        </StatusPill>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <StatusPill variant={producto.activo ? 'positive' : 'destructive'}>
          {producto.activo ? 'Activo' : 'Inactivo'}
        </StatusPill>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            type="button"
            variant={seleccionado ? 'manageActive' : 'manageInactive'}
            size="sm"
            onClick={() => onSeleccionar(producto.id)}
          >
            {seleccionado ? '✓ Gestionando' : 'Gestionar tamaños y precios'}
          </Button>
          <Button
            type="button"
            variant={producto.activo ? 'destructive' : 'activate'}
            size="sm"
            onClick={handleCambiarActivo}
          >
            {producto.activo ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function ProductosTable({
  productos,
  conteoTamanosActivos,
  productoSeleccionadoId,
  onSeleccionar,
  onCambiarActivo,
}: ProductosTableProps) {
  if (productos.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '16px 0', fontSize: 14 }}>
        Todavía no hay productos registrados.
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
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
            <th style={{ padding: '10px 12px' }}>Nombre</th>
            <th style={{ padding: '10px 12px' }}>Ref. anterior</th>
            <th style={{ padding: '10px 12px' }}>Tamaños</th>
            <th style={{ padding: '10px 12px' }}>Estado</th>
            <th style={{ padding: '10px 12px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <FilaProducto
              key={producto.id}
              producto={producto}
              tamanosActivos={conteoTamanosActivos.get(producto.id) ?? 0}
              seleccionado={producto.id === productoSeleccionadoId}
              onSeleccionar={onSeleccionar}
              onCambiarActivo={onCambiarActivo}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
