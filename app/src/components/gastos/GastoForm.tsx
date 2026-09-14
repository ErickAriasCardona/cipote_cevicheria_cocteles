import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CategoriaGasto } from '../../types/categoriaGasto'
import type { CrearGastoInput, OrigenGasto } from '../../types/gasto'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { formatearCOP } from '../../utils/moneda'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface GastoFormProps {
  categoriasActivas: CategoriaGasto[]
  onRegistrar: (input: CrearGastoInput) => Promise<void>
}

export function GastoForm({ categoriasActivas, onRegistrar }: GastoFormProps) {
  const [categoriaId, setCategoriaId] = useState(categoriasActivas[0]?.id ?? '')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [origen, setOrigen] = useState<OrigenGasto>('administracion')
  const [estadoPago, setEstadoPago] = useState<'pagado' | 'no_pagado'>('pagado')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const montoNumerico = Math.round(Number(monto))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!categoriaId) {
      setError('Selecciona una categoría de gasto.')
      return
    }
    if (!Number.isInteger(montoNumerico) || montoNumerico <= 0) {
      setError('El monto debe ser un número entero mayor que cero.')
      return
    }

    const categoria = categoriasActivas.find((c) => c.id === categoriaId)
    const origenEtiqueta = origen === 'caja' ? 'Caja Menor' : 'Administrativa'
    const estadoEtiqueta = estadoPago === 'pagado' ? 'Pagado' : 'No Pagado (Pendiente)'
    const ok = await confirmar({
      titulo: 'Registrar gasto',
      mensaje: `¿Confirmas registrar el gasto "${descripcion}" por ${formatearCOP(montoNumerico)} con Fuente: "${origenEtiqueta}" y Estado: "${estadoEtiqueta}" en la categoría "${categoria?.nombre ?? categoriaId}"?`,
      textoConfirmar: 'Registrar gasto',
      varianteConfirmar: 'primary',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onRegistrar({ categoriaId, descripcion, monto: montoNumerico, fecha, origen, estadoPago })
      setDescripcion('')
      setMonto('')
      setEstadoPago('pagado')
      setFecha(new Date().toISOString().slice(0, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el gasto.')
    } finally {
      setEnviando(false)
    }
  }

  if (categoriasActivas.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
        Todavía no hay ninguna categoría de gasto activa: crea al menos una en el catálogo de
        arriba antes de registrar un gasto.
      </p>
    )
  }

  const opcionesCategorias = categoriasActivas.map((c) => ({
    value: c.id,
    label: c.nombre,
  }))

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Select
          label="Categoría"
          id="categoria_gasto"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          options={opcionesCategorias}
        />

        <Select
          label="Fuente de Pago (¿De dónde se pagó?)"
          id="origen_gasto"
          value={origen}
          onChange={(e) => setOrigen(e.target.value as OrigenGasto)}
          options={[
            { value: 'administracion', label: 'Administrativa (Caja General / Bancos)' },
            { value: 'caja', label: 'Caja Menor (Caja de Turno / Efectivo POS)' },
          ]}
        />

        <Select
          label="Estado de Pago"
          id="estado_pago_gasto"
          value={estadoPago}
          onChange={(e) => setEstadoPago(e.target.value as 'pagado' | 'no_pagado')}
          options={[
            { value: 'pagado', label: 'Pagado (Desembolsado)' },
            { value: 'no_pagado', label: 'No Pagado (Pendiente / Por Pagar)' },
          ]}
        />

        <Input
          label="Descripción"
          id="descripcion_gasto"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalle del gasto"
          required
        />

        <Input
          label="Monto ($)"
          id="monto_gasto"
          type="number"
          min="1"
          step="1"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0"
          required
        />

        <Input
          label="Fecha"
          id="fecha_gasto"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
          {error}
        </p>
      )}

      <div>
        <Button type="submit" variant="primary" size="md" disabled={enviando}>
          {enviando ? 'Registrando…' : 'Registrar Gasto'}
        </Button>
      </div>
    </form>
  )
}
