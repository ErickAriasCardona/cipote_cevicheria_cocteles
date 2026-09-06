import { useState } from 'react'
import type { Insumo } from '../../types/insumo'
import type { ProductoReceta } from '../../types/productoReceta'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

interface RecetaTableProps {
  reglas: ProductoReceta[]
  insumos: Insumo[]
  onActualizarCantidad: (
    insumoId: string,
    condicion: ProductoReceta['condicion'],
    cantidad: number,
  ) => void
  onCambiarActivo: (
    insumoId: string,
    condicion: ProductoReceta['condicion'],
    activo: boolean,
  ) => void
}

const ETIQUETAS_CONDICION: Record<ProductoReceta['condicion'], string> = {
  siempre: 'Siempre',
  para_llevar: 'Para llevar',
  consumo_lugar: 'Consumo en el lugar',
}

function nombreInsumo(insumos: Insumo[], insumoId: string): string {
  return insumos.find((insumo) => insumo.id === insumoId)?.nombre ?? insumoId
}

interface FilaRecetaProps {
  regla: ProductoReceta
  nombre: string
  onActualizarCantidad: RecetaTableProps['onActualizarCantidad']
  onCambiarActivo: RecetaTableProps['onCambiarActivo']
}

function FilaReceta({ regla, nombre, onActualizarCantidad, onCambiarActivo }: FilaRecetaProps) {
  const { confirmar } = useConfirmacion()
  const [cantidad, setCantidad] = useState(String(regla.cantidad))
  const cantidadNumerica = Number(cantidad)

  async function handleGuardarCantidad() {
    const ok = await confirmar({
      titulo: 'Actualizar cantidad',
      mensaje: `¿Confirmas cambiar la cantidad de "${nombre}" (${ETIQUETAS_CONDICION[regla.condicion]}) de ${regla.cantidad} a ${cantidadNumerica}? Afecta el descuento automático de inventario en ventas.`,
      textoConfirmar: 'Guardar',
      varianteConfirmar: 'blue',
    })
    if (!ok) return
    onActualizarCantidad(regla.insumoId, regla.condicion, cantidadNumerica)
  }

  async function handleCambiarActivo() {
    const siguienteActivo = !regla.activo
    const ok = await confirmar({
      titulo: siguienteActivo ? 'Activar regla de receta' : 'Desactivar regla de receta',
      mensaje: siguienteActivo
        ? `¿Confirmas activar la regla de "${nombre}" (${ETIQUETAS_CONDICION[regla.condicion]})?`
        : `¿Confirmas desactivar la regla de "${nombre}" (${ETIQUETAS_CONDICION[regla.condicion]})?`,
      textoConfirmar: siguienteActivo ? 'Activar' : 'Desactivar',
      varianteConfirmar: siguienteActivo ? 'activate' : 'destructive',
    })
    if (!ok) return
    onCambiarActivo(regla.insumoId, regla.condicion, siguienteActivo)
  }

  const cantidadCambio = cantidadNumerica !== regla.cantidad && Number.isFinite(cantidadNumerica) && cantidadNumerica > 0

  return (
    <tr style={{ borderBottom: '1px solid var(--hr-line)' }}>
      <td style={{ padding: '14px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
        {nombre}
      </td>
      <td style={{ padding: '14px 12px' }}>
        <StatusPill variant={regla.condicion === 'siempre' ? 'role' : 'neutral'}>
          {ETIQUETAS_CONDICION[regla.condicion]}
        </StatusPill>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            style={{
              width: 80,
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
            variant={cantidadCambio ? 'blue' : 'secondary'}
            size="sm"
            onClick={handleGuardarCantidad}
            disabled={!cantidadCambio}
          >
            Guardar
          </Button>
        </div>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <StatusPill variant={regla.activo ? 'positive' : 'destructive'}>
          {regla.activo ? 'Activo' : 'Inactivo'}
        </StatusPill>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <Button
          type="button"
          variant={regla.activo ? 'destructive' : 'activate'}
          size="sm"
          onClick={handleCambiarActivo}
        >
          {regla.activo ? 'Desactivar' : 'Activar'}
        </Button>
      </td>
    </tr>
  )
}

export function RecetaTable({ reglas, insumos, onActualizarCantidad, onCambiarActivo }: RecetaTableProps) {
  if (reglas.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', margin: '14px 0', fontSize: 13.5 }}>
        Este producto todavía no tiene receta configurada.
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
            <th style={{ padding: '10px 12px' }}>Insumo</th>
            <th style={{ padding: '10px 12px' }}>Condición</th>
            <th style={{ padding: '10px 12px' }}>Cantidad</th>
            <th style={{ padding: '10px 12px' }}>Estado</th>
            <th style={{ padding: '10px 12px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reglas.map((regla) => (
            <FilaReceta
              key={`${regla.insumoId}-${regla.condicion}`}
              regla={regla}
              nombre={nombreInsumo(insumos, regla.insumoId)}
              onActualizarCantidad={onActualizarCantidad}
              onCambiarActivo={onCambiarActivo}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
