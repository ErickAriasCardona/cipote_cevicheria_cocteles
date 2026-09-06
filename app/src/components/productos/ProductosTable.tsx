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

function etiquetaCategoria(categoria: Producto['categoria']): { texto: string; color: string; bg: string } {
  switch (categoria) {
    case 'ceviche':
      return { texto: '🐟 Ceviche/Cóctel', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' }
    case 'bebida':
      return { texto: '🥤 Bebida', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' }
    case 'otro':
    default:
      return { texto: '📦 Otro', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
  }
}

function FilaProducto({ producto, tamanosActivos, seleccionado, onSeleccionar, onCambiarActivo }: FilaProductoProps) {
  const { confirmar } = useConfirmacion()
  const catInfo = etiquetaCategoria(producto.categoria)

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
      <td style={{ padding: '14px 12px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
          {producto.nombre}
        </div>
        {producto.descripcion && (
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
            {producto.descripcion}
          </div>
        )}
      </td>
      <td style={{ padding: '14px 12px' }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            color: catInfo.color,
            backgroundColor: catInfo.bg,
            display: 'inline-block',
          }}
        >
          {catInfo.texto}
        </span>
      </td>
      <td style={{ padding: '14px 12px', fontSize: 13, color: 'var(--text-primary)' }}>
        {producto.categoria === 'otro' ? (
          <strong style={{ color: 'var(--brand-green)', fontSize: 13.5 }}>
            {producto.precio !== null
              ? `$${producto.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
              : '—'}
          </strong>
        ) : (
          <StatusPill variant={tamanosActivos > 0 ? 'positive' : 'neutral'}>
            {tamanosActivos > 0
              ? `${tamanosActivos} presentación(es)`
              : 'Sin tamaños'}
          </StatusPill>
        )}
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
            {producto.categoria === 'otro'
              ? seleccionado
                ? '✓ Seleccionado'
                : 'Ver detalles'
              : seleccionado
              ? '✓ Gestionando'
              : 'Gestionar tamaños y precios'}
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
            <th style={{ padding: '10px 12px' }}>Categoría</th>
            <th style={{ padding: '10px 12px' }}>Precio / Tamaños</th>
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
