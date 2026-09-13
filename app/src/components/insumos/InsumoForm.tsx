import { useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import type { ActualizarInsumoInput, CategoriaVasoInsumo, CrearInsumoInput, Insumo, TipoInsumo } from '../../types/insumo'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { TIPOS_UNIDAD_PRESET, formatearUnidad } from '../../utils/unidadMedida'

interface InsumoFormProps {
  tiposPersonalizados?: string[]
  tiposUnidadPersonalizados?: string[]
  insumosExistentes?: Insumo[]
  onCrear: (input: CrearInsumoInput) => Promise<void>
  onActualizar?: (id: string, input: ActualizarInsumoInput) => Promise<void>
}

export function InsumoForm({
  tiposPersonalizados = [],
  tiposUnidadPersonalizados = [],
  insumosExistentes = [],
  onCrear,
  onActualizar,
}: InsumoFormProps) {
  // El selector identifica al insumo por `id`, no por `nombre`: desde que la
  // unicidad real es (nombre, tipo, unidad_medida), pueden existir varias
  // presentaciones distintas con el mismo nombre (ej. "Limón" en kg y
  // "Limón" en unidad) y hace falta un identificador inequívoco para
  // saber cuál de ellas se está editando/restockeando.
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState('__nuevo__')
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('otro')
  const [nuevoTipoNombre, setNuevoTipoNombre] = useState('')
  const [tipoUnidadSeleccionado, setTipoUnidadSeleccionado] = useState('unidad')
  const [nuevoTipoUnidadNombre, setNuevoTipoUnidadNombre] = useState('')
  const [valorUnidad, setValorUnidad] = useState('1')
  const [stockActual, setStockActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [stockMinimoDiario, setStockMinimoDiario] = useState('0')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const conteoPorNombre = useMemo(() => {
    const conteo = new Map<string, number>()
    for (const i of insumosExistentes) {
      conteo.set(i.nombre, (conteo.get(i.nombre) ?? 0) + 1)
    }
    return conteo
  }, [insumosExistentes])

  const opcionesNombre = useMemo(() => {
    const ordenados = [...insumosExistentes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    return [
      ...ordenados.map((i) => {
        // Si el nombre se repite (misma materia prima, distinta presentación),
        // se aclara tipo + unidad en la etiqueta para no elegir la fila equivocada.
        const esAmbiguo = (conteoPorNombre.get(i.nombre) ?? 0) > 1
        return {
          value: i.id,
          label: esAmbiguo ? `${i.nombre} (${i.tipo} · ${i.unidadMedida})` : i.nombre,
        }
      }),
      { value: '__nuevo__', label: '+ Agregar nuevo nombre...' },
    ]
  }, [insumosExistentes, conteoPorNombre])

  const opcionesTipo = [
    { value: 'otro', label: 'Otro' },
    ...tiposPersonalizados.map((t) => ({ value: t, label: t })),
    { value: '__nuevo__', label: '+ Agregar nuevo tipo...' },
  ]

  const opcionesTipoUnidad = [
    ...TIPOS_UNIDAD_PRESET,
    ...tiposUnidadPersonalizados
      .filter((t) => !TIPOS_UNIDAD_PRESET.some((preset) => preset.value === t))
      .map((t) => ({ value: t, label: t })),
    { value: '__nuevo__', label: '+ Agregar nuevo tipo de unidad...' },
  ]

  const esNuevo = insumoSeleccionadoId === '__nuevo__'
  const insumoSeleccionado = esNuevo
    ? null
    : insumosExistentes.find((i) => i.id === insumoSeleccionadoId) ?? null

  function handleCambioNombreSeleccionado(val: string) {
    setInsumoSeleccionadoId(val)
    setError(null)
    setExito(null)

    if (val === '__nuevo__') {
      setNombreNuevo('')
      setTipoSeleccionado('otro')
      setNuevoTipoNombre('')
      setTipoUnidadSeleccionado('unidad')
      setNuevoTipoUnidadNombre('')
      setValorUnidad('1')
      setStockActual('0')
      setStockMinimo('0')
      setStockMinimoDiario('0')
    } else {
      const insumoEncontrado = insumosExistentes.find((i) => i.id === val)
      if (insumoEncontrado) {
        // Nota: si el insumo seleccionado es un remanente del mecanismo legado
        // `tipo:'vaso'` (ver limpieza del desplegable más abajo), su tipo real
        // ('vaso') ya no tiene opción propia en `opcionesTipo`; se preserva tal
        // cual en el estado (comportamiento igual al de cualquier tipo dinámico
        // no listado) para no perder datos si no se toca este campo al guardar.
        if (insumoEncontrado.tipo === 'otro') {
          setTipoSeleccionado('otro')
        } else {
          setTipoSeleccionado(insumoEncontrado.tipo)
        }
        setNuevoTipoNombre('')
        setTipoUnidadSeleccionado(insumoEncontrado.tipoUnidad)
        setNuevoTipoUnidadNombre('')
        setValorUnidad(String(insumoEncontrado.valorUnidad ?? 1))
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

    const nombreFinal = esNuevo ? nombreNuevo.trim() : (insumoSeleccionado?.nombre ?? '').trim()
    if (!nombreFinal) {
      setError('Escribe o selecciona el nombre del insumo.')
      return
    }

    if (tipoSeleccionado === '__nuevo__' && nuevoTipoNombre.trim() === '') {
      setError('Escribe el nombre del nuevo tipo de insumo.')
      return
    }

    if (tipoUnidadSeleccionado === '__nuevo__' && nuevoTipoUnidadNombre.trim() === '') {
      setError('Escribe el nombre del nuevo tipo de unidad.')
      return
    }

    const valorUnidadNum = Number(valorUnidad)
    if (!Number.isFinite(valorUnidadNum) || valorUnidadNum <= 0) {
      setError('El valor de unidad debe ser un número mayor que cero.')
      return
    }

    const stockActualNum = Math.max(0, Number(stockActual) || 0)
    const stockMinimoNum = Math.max(0, Number(stockMinimo) || 0)
    const stockMinimoDiarioNum = Math.max(0, Number(stockMinimoDiario) || 0)

    let tipoFinal: TipoInsumo = 'otro'
    let categoriaVasoFinal: CategoriaVasoInsumo | null = null
    let detalleTipo = 'Otro'

    if (tipoSeleccionado === '__nuevo__') {
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

    const tipoUnidadFinal = (tipoUnidadSeleccionado === '__nuevo__' ? nuevoTipoUnidadNombre : tipoUnidadSeleccionado)
      .trim()
      .toLowerCase()
    const etiquetaUnidadFinal = formatearUnidad(tipoUnidadFinal, valorUnidadNum)

    if (esNuevo) {
      // Unicidad real: nombre + tipo + tipo de unidad + valor de unidad
      // (misma materia prima puede tener presentaciones distintas, ej.
      // "Limón"/fruta en 1kg y "Limón"/fruta en 1unidad — deben poder
      // coexistir). Refleja el constraint
      // `insumos_nombre_tipo_tipounidad_valorunidad_key` de la BD.
      const yaExiste = insumosExistentes.some(
        (i) =>
          i.nombre.trim().toLowerCase() === nombreFinal.toLowerCase() &&
          i.tipo === tipoFinal &&
          i.tipoUnidad.trim().toLowerCase() === tipoUnidadFinal &&
          i.valorUnidad === valorUnidadNum,
      )
      if (yaExiste) {
        setError(
          `Ya existe un insumo "${nombreFinal}" de tipo "${detalleTipo}" en unidad "${etiquetaUnidadFinal}". Selecciónalo de la lista desplegable si deseas editarlo o restockearlo, o cambia el tipo/valor de unidad si es una presentación distinta.`,
        )
        return
      }
    }

    const accionTexto = esNuevo ? 'Crear insumo' : 'Actualizar insumo'
    const ok = await confirmar({
      titulo: accionTexto,
      mensaje: `¿Confirmas ${esNuevo ? 'crear' : 'actualizar'} el insumo "${nombreFinal}" (Tipo: ${detalleTipo}, unidad: ${etiquetaUnidadFinal}, stock actual: ${stockActualNum}, mín. general: ${stockMinimoNum}, mín. diario: ${stockMinimoDiarioNum})?`,
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
          tipoUnidad: tipoUnidadFinal,
          valorUnidad: valorUnidadNum,
          stockActual: stockActualNum,
          stockMinimo: stockMinimoNum,
          stockMinimoDiario: stockMinimoDiarioNum,
        })
        setNombreNuevo('')
        setInsumoSeleccionadoId('__nuevo__')
        setTipoSeleccionado('otro')
        setNuevoTipoNombre('')
        setTipoUnidadSeleccionado('unidad')
        setNuevoTipoUnidadNombre('')
        setValorUnidad('1')
        setStockActual('0')
        setStockMinimo('0')
        setStockMinimoDiario('0')
        setExito(`¡Insumo "${nombreFinal}" creado exitosamente!`)
      } else if (insumoSeleccionado && onActualizar) {
        await onActualizar(insumoSeleccionado.id, {
          nombre: nombreFinal,
          tipo: tipoFinal,
          categoriaVaso: categoriaVasoFinal,
          tipoUnidad: tipoUnidadFinal,
          valorUnidad: valorUnidadNum,
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
          tipoUnidad: tipoUnidadFinal,
          valorUnidad: valorUnidadNum,
          stockActual: stockActualNum,
          stockMinimo: stockMinimoNum,
          stockMinimoDiario: stockMinimoDiarioNum,
        })
        setExito(`¡Insumo "${nombreFinal}" guardado exitosamente!`)
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
            {esNuevo
              ? 'Nuevo Insumo'
              : `Editar / Restock Insumo: ${insumoSeleccionado?.nombre ?? ''}`}
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
            value={insumoSeleccionadoId}
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

          <Select
            label="Tipo de unidad"
            id="tipo_unidad"
            value={tipoUnidadSeleccionado}
            onChange={(e) => setTipoUnidadSeleccionado(e.target.value)}
            options={opcionesTipoUnidad}
            containerStyle={{ marginBottom: 0 }}
            labelStyle={labelUniformeStyle}
          />

          {tipoUnidadSeleccionado === '__nuevo__' && (
            <Input
              label="Nombre del nuevo tipo de unidad"
              id="nuevo_tipo_unidad_nombre"
              value={nuevoTipoUnidadNombre}
              onChange={(e) => setNuevoTipoUnidadNombre(e.target.value)}
              placeholder="Ej: cc, docena..."
              required
              containerStyle={{ marginBottom: 0 }}
              labelStyle={labelUniformeStyle}
            />
          )}

          <Input
            label="Valor de unidad"
            id="valor_unidad"
            type="number"
            min="0.01"
            step="0.01"
            value={valorUnidad}
            onChange={(e) => setValorUnidad(e.target.value)}
            placeholder="Ej: 9, 400, 1..."
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
