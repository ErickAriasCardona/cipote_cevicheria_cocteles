import { useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import type { ActualizarInsumoInput, CategoriaVasoInsumo, CrearInsumoInput, Insumo, TipoInsumo } from '../../types/insumo'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface InsumoFormProps {
  tiposPersonalizados?: string[]
  insumosExistentes?: Insumo[]
  onCrear: (input: CrearInsumoInput) => Promise<void>
  onActualizar?: (id: string, input: ActualizarInsumoInput) => Promise<void>
}

export function InsumoForm({
  tiposPersonalizados = [],
  insumosExistentes = [],
  onCrear,
  onActualizar,
}: InsumoFormProps) {
  const [nombreSeleccionado, setNombreSeleccionado] = useState('__nuevo__')
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('otro')
  const [nuevoTipoNombre, setNuevoTipoNombre] = useState('')
  const [unidadMedida, setUnidadMedida] = useState('unidad')
  const [stockActual, setStockActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [stockMinimoDiario, setStockMinimoDiario] = useState('0')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const nombresUnicos = useMemo(() => {
    return Array.from(new Set(insumosExistentes.map((i) => i.nombre).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
  }, [insumosExistentes])

  const opcionesNombre = useMemo(() => {
    return [
      ...nombresUnicos.map((n) => ({ value: n, label: n })),
      { value: '__nuevo__', label: '+ Agregar nuevo nombre...' },
    ]
  }, [nombresUnicos])

  const opcionesTipo = [
    { value: 'vaso_granizado', label: 'Vaso Granizado' },
    { value: 'vaso_ceviche', label: 'Vaso Ceviche/Cóctel' },
    { value: 'otro', label: 'Otro' },
    ...tiposPersonalizados.map((t) => ({ value: t, label: t })),
    { value: '__nuevo__', label: '+ Agregar nuevo tipo...' },
  ]

  const esNuevo = nombreSeleccionado === '__nuevo__'

  function handleCambioNombreSeleccionado(val: string) {
    setNombreSeleccionado(val)
    setError(null)
    setExito(null)

    if (val === '__nuevo__') {
      setNombreNuevo('')
      setTipoSeleccionado('otro')
      setNuevoTipoNombre('')
      setUnidadMedida('unidad')
      setStockActual('0')
      setStockMinimo('0')
      setStockMinimoDiario('0')
    } else {
      const insumoEncontrado = insumosExistentes.find((i) => i.nombre === val)
      if (insumoEncontrado) {
        if (insumoEncontrado.tipo === 'vaso' && insumoEncontrado.categoriaVaso === 'granizado') {
          setTipoSeleccionado('vaso_granizado')
        } else if (insumoEncontrado.tipo === 'vaso') {
          setTipoSeleccionado('vaso_ceviche')
        } else if (insumoEncontrado.tipo === 'otro') {
          setTipoSeleccionado('otro')
        } else {
          setTipoSeleccionado(insumoEncontrado.tipo)
        }
        setNuevoTipoNombre('')
        setUnidadMedida(insumoEncontrado.unidadMedida)
        setStockActual(String(insumoEncontrado.stockActual ?? 0))
        setStockMinimo(String(insumoEncontrado.stockMinimo ?? 0))
        setStockMinimoDiario(String(insumoEncontrado.stockMinimoDiario ?? 0))
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setExito(null)

    const nombreFinal = esNuevo ? nombreNuevo.trim() : nombreSeleccionado.trim()
    if (!nombreFinal) {
      setError('Escribe o selecciona el nombre del insumo.')
      return
    }

    if (esNuevo) {
      const yaExiste = insumosExistentes.some(
        (i) => i.nombre.trim().toLowerCase() === nombreFinal.toLowerCase(),
      )
      if (yaExiste) {
        setError(
          `Ya existe un insumo llamado "${nombreFinal}". Selecciónalo de la lista desplegable si deseas editarlo o restockearlo.`,
        )
        return
      }
    }

    if (tipoSeleccionado === '__nuevo__' && nuevoTipoNombre.trim() === '') {
      setError('Escribe el nombre del nuevo tipo de insumo.')
      return
    }

    const stockActualNum = Math.max(0, Number(stockActual) || 0)
    const stockMinimoNum = Math.max(0, Number(stockMinimo) || 0)
    const stockMinimoDiarioNum = Math.max(0, Number(stockMinimoDiario) || 0)

    let tipoFinal: TipoInsumo = 'otro'
    let categoriaVasoFinal: CategoriaVasoInsumo | null = null
    let detalleTipo = 'Otro'

    if (tipoSeleccionado === 'vaso_granizado') {
      tipoFinal = 'vaso'
      categoriaVasoFinal = 'granizado'
      detalleTipo = 'Vaso Granizado'
    } else if (tipoSeleccionado === 'vaso_ceviche') {
      tipoFinal = 'vaso'
      categoriaVasoFinal = 'ceviche'
      detalleTipo = 'Vaso Ceviche/Cóctel'
    } else if (tipoSeleccionado === '__nuevo__') {
      tipoFinal = nuevoTipoNombre.trim()
      categoriaVasoFinal = null
      detalleTipo = nuevoTipoNombre.trim()
    } else if (tipoSeleccionado === 'otro') {
      tipoFinal = 'otro'
      categoriaVasoFinal = null
      detalleTipo = 'Otro'
    } else {
      tipoFinal = tipoSeleccionado
      categoriaVasoFinal = null
      detalleTipo = tipoSeleccionado
    }

    const accionTexto = esNuevo ? 'Crear insumo' : 'Actualizar insumo'
    const ok = await confirmar({
      titulo: accionTexto,
      mensaje: `¿Confirmas ${esNuevo ? 'crear' : 'actualizar'} el insumo "${nombreFinal}" (Tipo: ${detalleTipo}, unidad: ${unidadMedida}, stock actual: ${stockActualNum}, mín. general: ${stockMinimoNum}, mín. diario: ${stockMinimoDiarioNum})?`,
      textoConfirmar: accionTexto,
    })
    if (!ok) return

    setEnviando(true)
    try {
      if (esNuevo) {
        await onCrear({
          nombre: nombreFinal,
          tipo: tipoFinal,
          categoriaVaso: categoriaVasoFinal,
          unidadMedida: unidadMedida.trim(),
          stockActual: stockActualNum,
          stockMinimo: stockMinimoNum,
          stockMinimoDiario: stockMinimoDiarioNum,
        })
        setNombreNuevo('')
        setNombreSeleccionado('__nuevo__')
        setTipoSeleccionado('otro')
        setNuevoTipoNombre('')
        setUnidadMedida('unidad')
        setStockActual('0')
        setStockMinimo('0')
        setStockMinimoDiario('0')
        setExito(`¡Insumo "${nombreFinal}" creado exitosamente!`)
      } else {
        const insumoExistente = insumosExistentes.find((i) => i.nombre === nombreFinal)
        if (insumoExistente && onActualizar) {
          await onActualizar(insumoExistente.id, {
            nombre: nombreFinal,
            tipo: tipoFinal,
            categoriaVaso: categoriaVasoFinal,
            unidadMedida: unidadMedida.trim(),
            stockActual: stockActualNum,
            stockMinimo: stockMinimoNum,
            stockMinimoDiario: stockMinimoDiarioNum,
          })
          setExito(`¡Insumo "${nombreFinal}" actualizado exitosamente!`)
        } else {
          await onCrear({
            nombre: nombreFinal,
            tipo: tipoFinal,
            categoriaVaso: categoriaVasoFinal,
            unidadMedida: unidadMedida.trim(),
            stockActual: stockActualNum,
            stockMinimo: stockMinimoNum,
            stockMinimoDiario: stockMinimoDiarioNum,
          })
          setExito(`¡Insumo "${nombreFinal}" guardado exitosamente!`)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el insumo.')
    } finally {
      setEnviando(false)
    }
  }

  const labelUniformeStyle = {
    minHeight: 34,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start' as const,
    lineHeight: 1.25,
  }

  return (
    <GlassCard padding={22}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            {esNuevo ? 'Nuevo Insumo' : `Editar / Restock Insumo: ${nombreSeleccionado}`}
          </h3>
          {!esNuevo && (
            <button
              type="button"
              onClick={() => handleCambioNombreSeleccionado('__nuevo__')}
              style={{
                background: 'rgba(65, 175, 224, 0.12)',
                border: '1px solid rgba(65, 175, 224, 0.3)',
                color: 'var(--brand-blue)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: 8,
                transition: 'all 0.15s ease',
              }}
            >
              + Crear nuevo insumo
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <Select
            label="Nombre del insumo"
            id="nombre_select"
            value={nombreSeleccionado}
            onChange={(e) => handleCambioNombreSeleccionado(e.target.value)}
            options={opcionesNombre}
            containerStyle={{ marginBottom: 0 }}
            labelStyle={labelUniformeStyle}
          />

          {esNuevo && (
            <Input
              label="Escribir nuevo nombre"
              id="nombre_nuevo_input"
              value={nombreNuevo}
              onChange={(e) => {
                setNombreNuevo(e.target.value)
                setError(null)
              }}
              placeholder="Ej: Bolsas, Vaso 7oz..."
              required
              containerStyle={{ marginBottom: 0 }}
              labelStyle={labelUniformeStyle}
            />
          )}

          <Select
            label="Tipo de insumo"
            id="tipo"
            value={tipoSeleccionado}
            onChange={(e) => setTipoSeleccionado(e.target.value)}
            options={opcionesTipo}
            containerStyle={{ marginBottom: 0 }}
            labelStyle={labelUniformeStyle}
          />

          {tipoSeleccionado === '__nuevo__' && (
            <Input
              label="Nombre del nuevo tipo"
              id="nuevo_tipo_nombre"
              value={nuevoTipoNombre}
              onChange={(e) => setNuevoTipoNombre(e.target.value)}
              placeholder="Ej: Empaque, Ingrediente, Salsa..."
              required
              containerStyle={{ marginBottom: 0 }}
              labelStyle={labelUniformeStyle}
            />
          )}

          <Input
            label="Unidad de medida"
            id="unidad_medida"
            value={unidadMedida}
            onChange={(e) => setUnidadMedida(e.target.value)}
            placeholder="unidad, gramo, kg..."
            required
            containerStyle={{ marginBottom: 0 }}
            labelStyle={labelUniformeStyle}
          />

          <Input
            label="Stock actual"
            id="stock_actual"
            type="number"
            min="0"
            step="0.01"
            value={stockActual}
            onChange={(e) => setStockActual(e.target.value)}
            placeholder="0"
            containerStyle={{ marginBottom: 0 }}
            labelStyle={labelUniformeStyle}
          />

          <Input
            label="Stock mínimo general (Almacén)"
            id="stock_minimo"
            type="number"
            min="0"
            step="0.01"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            placeholder="Ej: 50"
            containerStyle={{ marginBottom: 0 }}
            labelStyle={labelUniformeStyle}
          />

          <Input
            label="Stock mínimo por día (Operativo)"
            id="stock_minimo_diario"
            type="number"
            min="0"
            step="0.01"
            value={stockMinimoDiario}
            onChange={(e) => setStockMinimoDiario(e.target.value)}
            placeholder="Ej: 10"
            containerStyle={{ marginBottom: 0 }}
            labelStyle={labelUniformeStyle}
          />
        </div>

        {error && (
          <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
            {error}
          </p>
        )}

        {exito && (
          <p role="status" style={{ margin: 0, color: 'var(--brand-green)', fontSize: 13, fontWeight: 600 }}>
            {exito}
          </p>
        )}

        <div>
          <Button type="submit" variant="primary" size="md" disabled={enviando}>
            {enviando
              ? esNuevo
                ? 'Creando…'
                : 'Actualizando…'
              : esNuevo
              ? 'Crear Insumo'
              : 'Actualizar Insumo'}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
