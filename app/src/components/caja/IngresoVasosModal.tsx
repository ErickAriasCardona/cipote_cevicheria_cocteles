import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { insumosService } from '../../services/insumosService'
import { ventasService } from '../../services/ventasService'
import { movimientosInventarioService } from '../../services/movimientosInventarioService'
import type { MovimientoInventario } from '../../types/movimientoInventario'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { IconoCruz } from '../ui/IconosFormas'

interface IngresoVasosModalProps {
  usuarioId: string
  abierto: boolean
  onCerrar: () => void
  onIngresoExitoso?: () => void
}

interface VasoOpcion {
  id: string
  insumoId: string
  etiqueta: string
  stockDia: number
  categoria: string
  onzas: number
}

export function IngresoVasosModal({
  usuarioId,
  abierto,
  onCerrar,
  onIngresoExitoso,
}: IngresoVasosModalProps) {
  const [vasos, setVasos] = useState<VasoOpcion[]>([])
  const [insumoId, setInsumoId] = useState('')
  const [cantidad, setCantidad] = useState('50')
  const [observaciones, setObservaciones] = useState('')
  const [historial, setHistorial] = useState<MovimientoInventario[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  useEffect(() => {
    if (!abierto) return
    cargarDatos()
  }, [abierto])

  async function cargarDatos() {
    setCargando(true)
    setError(null)
    try {
      const [tamanos, todosInsumos, ingresos] = await Promise.all([
        ventasService.listarTamanosVasoActivos(),
        insumosService.listarInsumos(),
        movimientosInventarioService.listarIngresosVasos(20),
      ])
      const ordenOnzas: Record<string, number> = { '7oz': 7, '9oz': 9, '12oz': 12, '16oz': 16 }
      const vasosFisicos: VasoOpcion[] = tamanos
        .filter((t) => t.tipo === 'vaso' && t.insumoId)
        .map((t) => {
          const insumo = todosInsumos.find((i) => i.id === t.insumoId)
          const unidadesDia =
            insumo?.stockMinimoDiario && insumo.stockMinimoDiario > 0
              ? Math.round(insumo.stockMinimoDiario)
              : insumo
                ? Math.round(insumo.stockActual)
                : 0
          const nombreInsumo = insumo?.nombre?.trim() || (t.etiqueta ? `Vaso ${t.etiqueta}` : 'Vaso')
          const categoriaTexto = t.categoria === 'ceviche' ? 'Ceviche' : 'Granizado'
          return {
            id: t.id,
            insumoId: t.insumoId!,
            etiqueta: `${nombreInsumo} (${categoriaTexto})`,
            stockDia: unidadesDia,
            categoria: t.categoria ?? 'ceviche',
            onzas: t.onzas ?? ordenOnzas[t.etiqueta] ?? 0,
          }
        })
        .sort((a, b) => {
          if (a.categoria !== b.categoria) {
            return a.categoria === 'ceviche' ? -1 : 1
          }
          return a.onzas - b.onzas
        })

      setVasos(vasosFisicos)
      if (vasosFisicos.length > 0) {
        setInsumoId((prev) => (prev && vasosFisicos.some((v) => v.insumoId === prev) ? prev : vasosFisicos[0].insumoId))
      }
      setHistorial(ingresos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos de vasos.')
    } finally {
      setCargando(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setExito(null)

    const cantNum = Math.round(Number(cantidad))
    if (!insumoId) {
      setError('Selecciona un tipo de vaso.')
      return
    }
    if (!Number.isInteger(cantNum) || cantNum <= 0) {
      setError('La cantidad debe ser un número entero mayor a cero.')
      return
    }

    setGuardando(true)
    try {
      await movimientosInventarioService.registrarIngresoVasos({
        insumoId,
        cantidad: cantNum,
        usuarioId,
        observaciones: observaciones.trim() || 'Ingreso de vasos para venta en turno (Stock del Día)',
      })
      setExito(`Se agregaron ${cantNum} unidades al Stock del Día exitosamente.`)
      setCantidad('50')
      setObservaciones('')
      await cargarDatos()
      onIngresoExitoso?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el ingreso de vasos.')
    } finally {
      setGuardando(false)
    }
  }

  if (!abierto) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--modal-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--modal-bg)',
          border: '1px solid var(--modal-border)',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: 'var(--modal-shadow)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Ingreso de Vasos para Venta
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Registra la recepción de vasos para la venta en tu turno (se refleja únicamente en el Stock del Día).
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <IconoCruz size={18} strokeWidth={2.4} />
          </button>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--red-text)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {error}
          </p>
        )}
        {exito && (
          <p style={{ color: 'var(--green-text)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {exito}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select
            id="ingreso_vaso_id"
            label="Tipo de Vaso (Apertura de Turno)"
            value={insumoId}
            onChange={(e) => setInsumoId(e.target.value)}
            required
            options={vasos.map((v) => ({
              value: v.insumoId,
              label: `${v.etiqueta} — Stock del Día: ${v.stockDia} unds`,
            }))}
          >
            {vasos.map((v) => (
              <option
                key={v.insumoId}
                value={v.insumoId}
                label={`${v.etiqueta} — Stock del Día: ${v.stockDia} unds`}
              >
                {`${v.etiqueta} — Stock del Día: ${v.stockDia} unds`}
              </option>
            ))}
          </Select>

          <Input
            id="ingreso_cantidad_vasos"
            type="number"
            min="1"
            step="1"
            label="Cantidad de vasos a ingresar (Stock del Día)"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />

          <Input
            id="ingreso_observaciones_vasos"
            type="text"
            label="Observación o motivo (opcional)"
            placeholder="Ej: Reposición de bodega, paquete de 50 unds"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <Button type="button" variant="secondary" onClick={onCerrar} disabled={guardando}>
              Cerrar
            </Button>
            <Button type="submit" variant="primary" disabled={guardando || cargando || vasos.length === 0}>
              {guardando ? 'Guardando…' : 'Registrar Ingreso'}
            </Button>
          </div>
        </form>

        {/* Historial reciente de ingresos de vasos */}
        <div style={{ marginTop: 24, borderTop: '1px solid var(--hr-line)', paddingTop: 18 }}>
          <h3
            style={{
              margin: '0 0 10px',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Historial de Ingresos Recientes
          </h3>

          {historial.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
              No hay ingresos registrados recientemente.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {historial.map((h) => {
                const vasoEncontrado = vasos.find((v) => v.insumoId === h.insumoId)
                const nombreVaso = vasoEncontrado ? vasoEncontrado.etiqueta : 'Vaso'
                return (
                  <div
                    key={h.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--hr-line)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12.5,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        +{h.cantidad} {nombreVaso}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {new Date(h.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} • {h.observaciones ?? 'Sin nota'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--green-text)', fontWeight: 700 }}>
                      Stock del Día: {h.stockResultante} unds
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
