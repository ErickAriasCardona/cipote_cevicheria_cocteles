import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { ActualizarInsumoInput, CategoriaVasoInsumo, Insumo, TipoInsumo } from '../../types/insumo'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface InsumoEditarModalProps {
  insumo: Insumo | null
  tiposPersonalizados?: string[]
  abierto: boolean
  onCerrar: () => void
  onGuardar: (id: string, cambios: ActualizarInsumoInput) => Promise<void>
}

export function InsumoEditarModal({
  insumo,
  tiposPersonalizados = [],
  abierto,
  onCerrar,
  onGuardar,
}: InsumoEditarModalProps) {
  const [nombre, setNombre] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('otro')
  const [nuevoTipoNombre, setNuevoTipoNombre] = useState('')
  const [unidadMedida, setUnidadMedida] = useState('unidad')
  const [stockActual, setStockActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [stockMinimoDiario, setStockMinimoDiario] = useState('0')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)

  const opcionesTipo = [
    { value: 'vaso_granizado', label: 'Vaso Granizado' },
    { value: 'vaso_ceviche', label: 'Vaso Ceviche/Cóctel' },
    { value: 'otro', label: 'Otro' },
    ...tiposPersonalizados.map((t) => ({ value: t, label: t })),
    { value: '__nuevo__', label: '+ Agregar nuevo tipo...' },
  ]

  useEffect(() => {
    if (insumo) {
      setNombre(insumo.nombre)
      if (insumo.tipo === 'vaso' && insumo.categoriaVaso === 'granizado') {
        setTipoSeleccionado('vaso_granizado')
      } else if (insumo.tipo === 'vaso') {
        setTipoSeleccionado('vaso_ceviche')
      } else if (insumo.tipo === 'otro') {
        setTipoSeleccionado('otro')
      } else {
        setTipoSeleccionado(insumo.tipo)
      }
      setNuevoTipoNombre('')
      setUnidadMedida(insumo.unidadMedida)
      setStockActual(String(insumo.stockActual ?? 0))
      setStockMinimo(String(insumo.stockMinimo ?? 0))
      setStockMinimoDiario(String(insumo.stockMinimoDiario ?? 0))
      setError(null)
    }
  }, [insumo])

  useEffect(() => {
    if (!abierto) return
    cancelarRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrar()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [abierto, onCerrar])

  if (!abierto || !insumo) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!insumo) return
    setError(null)

    if (tipoSeleccionado === '__nuevo__' && nuevoTipoNombre.trim() === '') {
      setError('Escribe el nombre del nuevo tipo de insumo.')
      return
    }

    const stockActualNum = Number(stockActual)
    const stockMinimoNum = Number(stockMinimo)
    const stockMinimoDiarioNum = Number(stockMinimoDiario)

    if (!Number.isFinite(stockActualNum) || stockActualNum < 0) {
      setError('El stock actual debe ser un número mayor o igual a 0.')
      return
    }
    if (!Number.isFinite(stockMinimoNum) || stockMinimoNum < 0) {
      setError('El stock mínimo general debe ser un número mayor o igual a 0.')
      return
    }
    if (!Number.isFinite(stockMinimoDiarioNum) || stockMinimoDiarioNum < 0) {
      setError('El stock mínimo diario debe ser un número mayor o igual a 0.')
      return
    }

    let tipoFinal: TipoInsumo = 'otro'
    let categoriaVasoFinal: CategoriaVasoInsumo | null = null

    if (tipoSeleccionado === 'vaso_granizado') {
      tipoFinal = 'vaso'
      categoriaVasoFinal = 'granizado'
    } else if (tipoSeleccionado === 'vaso_ceviche') {
      tipoFinal = 'vaso'
      categoriaVasoFinal = 'ceviche'
    } else if (tipoSeleccionado === '__nuevo__') {
      tipoFinal = nuevoTipoNombre.trim()
      categoriaVasoFinal = null
    } else if (tipoSeleccionado === 'otro') {
      tipoFinal = 'otro'
      categoriaVasoFinal = null
    } else {
      tipoFinal = tipoSeleccionado
      categoriaVasoFinal = null
    }

    setGuardando(true)
    try {
      await onGuardar(insumo.id, {
        nombre: nombre.trim(),
        tipo: tipoFinal,
        categoriaVaso: categoriaVasoFinal,
        unidadMedida: unidadMedida.trim(),
        stockActual: stockActualNum,
        stockMinimo: stockMinimoNum,
        stockMinimoDiario: stockMinimoDiarioNum,
      })
      onCerrar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el insumo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="presentation"
      onClick={onCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-editar-insumo-titulo"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-soft)',
          borderRadius: 16,
          boxShadow: 'var(--card-shadow)',
          padding: '24px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'fadeInUp 0.18s ease-out',
        }}
      >
        <div>
          <h3
            id="modal-editar-insumo-titulo"
            style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}
          >
            Editar Insumo
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Modifica los detalles, existencias y umbrales de este insumo.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Nombre del insumo"
            id="edit_nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <Select
            label="Tipo de insumo"
            id="edit_tipo"
            value={tipoSeleccionado}
            onChange={(e) => setTipoSeleccionado(e.target.value)}
            options={opcionesTipo}
          />

          {tipoSeleccionado === '__nuevo__' && (
            <Input
              label="Nombre del nuevo tipo"
              id="edit_nuevo_tipo_nombre"
              value={nuevoTipoNombre}
              onChange={(e) => setNuevoTipoNombre(e.target.value)}
              placeholder="Ej: Empaque, Ingrediente, Salsa..."
              required
            />
          )}

          <Input
            label="Unidad de medida"
            id="edit_unidad_medida"
            value={unidadMedida}
            onChange={(e) => setUnidadMedida(e.target.value)}
            required
          />

          <Input
            label="Stock actual"
            id="edit_stock_actual"
            type="number"
            min="0"
            step="0.01"
            value={stockActual}
            onChange={(e) => setStockActual(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Mín. General (Almacén)"
              id="edit_stock_minimo"
              type="number"
              min="0"
              step="0.01"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              required
              containerStyle={{ marginBottom: 0 }}
              labelStyle={{ minHeight: 22, display: 'flex', alignItems: 'flex-end' }}
            />

            <Input
              label="Mín. Diario (Operativo)"
              id="edit_stock_minimo_diario"
              type="number"
              min="0"
              step="0.01"
              value={stockMinimoDiario}
              onChange={(e) => setStockMinimoDiario(e.target.value)}
              required
              containerStyle={{ marginBottom: 0 }}
              labelStyle={{ minHeight: 22, display: 'flex', alignItems: 'flex-end' }}
            />
          </div>

          {error && (
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button
              ref={cancelarRef}
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
