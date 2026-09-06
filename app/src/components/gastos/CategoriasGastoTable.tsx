import type { CategoriaGasto } from '../../types/categoriaGasto'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface CategoriasGastoTableProps {
  categorias: CategoriaGasto[]
  onCambiarActivo: (id: string, activo: boolean) => void
}

export function CategoriasGastoTable({ categorias, onCambiarActivo }: CategoriasGastoTableProps) {
  const { confirmar } = useConfirmacion()

  async function handleCambiarActivo(categoria: CategoriaGasto) {
    const siguienteActivo = !categoria.activo
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Activar categoría' : 'Desactivar categoría',
      mensaje: siguienteActivo
        ? `¿Confirmas activar la categoría de gasto "${categoria.nombre}"?`
        : `¿Confirmas desactivar la categoría de gasto "${categoria.nombre}"? Los gastos ya registrados con ella no se ven afectados.`,
      textoConfirmar: siguienteActivo ? 'Activar' : 'Desactivar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(categoria.id, siguienteActivo)
  }

  if (categorias.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '14px 0', fontSize: 13.5 }}>
        Todavía no hay categorías de gasto registradas.
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
            <th style={{ padding: '10px 12px' }}>Estado</th>
            <th style={{ padding: '10px 12px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((categoria) => (
            <tr key={categoria.id} style={{ borderBottom: '1px solid var(--hr-line)' }}>
              <td style={{ padding: '12px', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                {categoria.nombre}
              </td>
              <td style={{ padding: '12px' }}>
                <StatusPill variant={categoria.activo ? 'positive' : 'destructive'}>
                  {categoria.activo ? 'Activa' : 'Inactiva'}
                </StatusPill>
              </td>
              <td style={{ padding: '12px' }}>
                <Button
                  type="button"
                  variant={categoria.activo ? 'destructive' : 'activate'}
                  size="sm"
                  onClick={() => handleCambiarActivo(categoria)}
                >
                  {categoria.activo ? 'Desactivar' : 'Activar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
