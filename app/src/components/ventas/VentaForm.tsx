import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import type { Producto } from '../../types/producto'
import type { ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type { RegistrarVentaInput, TipoEntrega } from '../../types/venta'
import type { RegistrarVentaPagoInput } from '../../types/ventaPago'
import { sonPagosValidos } from '../../utils/pagoMixto'
import { PagoMixtoForm } from './PagoMixtoForm'
import { GlassCard } from '../ui/GlassCard'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Chip } from '../ui/Chip'
import { Button } from '../ui/Button'

interface VentaFormProps {
  productos: Producto[]
  tamanosVaso: TamanoVaso[]
  preciosPorTamano: ProductoTamanoPrecio[]
  onRegistrar: (input: RegistrarVentaInput) => Promise<void>
}

export function VentaForm({
  productos,
  tamanosVaso,
  preciosPorTamano,
  onRegistrar,
}: VentaFormProps) {
  const [categoriaFiltro, setCategoriaFiltro] = useState<'todas' | 'ceviche' | 'bebida' | 'otro'>('todas')
  const [productoId, setProductoId] = useState(productos[0]?.id ?? '')
  const [tamanoVasoId, setTamanoVasoId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('para_llevar')
  const [observaciones, setObservaciones] = useState('')
  const [pagos, setPagos] = useState<RegistrarVentaPagoInput[]>([])
  const [ventaExitosa, setVentaExitosa] = useState<{
    producto: string
    tamano: string
    cantidad: number
    total: number
    efectivoRecibido?: number
    devuelta?: number
  } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const productosFiltrados = useMemo(() => {
    if (categoriaFiltro === 'todas') return productos
    return productos.filter((p) => p.categoria === categoriaFiltro)
  }, [productos, categoriaFiltro])

  useEffect(() => {
    if (productosFiltrados.length > 0 && !productosFiltrados.some((p) => p.id === productoId)) {
      setProductoId(productosFiltrados[0].id)
    }
  }, [productosFiltrados, productoId])

  const productoObj = useMemo(
    () => productos.find((p) => p.id === productoId),
    [productos, productoId],
  )
  const esOtro = productoObj?.categoria === 'otro'

  // Filtrar tamaños configurados para el producto actual (solo aplica a ceviche y bebida)
  const tamanosConfigurados = useMemo(() => {
    if (!productoId || esOtro) return []
    return tamanosVaso.filter((t) =>
      preciosPorTamano.some((p) => p.productoId === productoId && p.tamanoVasoId === t.id),
    )
  }, [productoId, esOtro, tamanosVaso, preciosPorTamano])

  // Seleccionar automáticamente el primer tamaño disponible si cambia el producto
  useEffect(() => {
    if (esOtro) {
      setTamanoVasoId('')
    } else if (tamanosConfigurados.length > 0) {
      if (!tamanosConfigurados.some((t) => t.id === tamanoVasoId)) {
        setTamanoVasoId(tamanosConfigurados[0].id)
      }
    } else {
      setTamanoVasoId('')
    }
  }, [esOtro, tamanosConfigurados, tamanoVasoId])

  const precioSeleccionado = useMemo(() => {
    if (esOtro) {
      return productoObj?.precio ?? null
    }
    const fila = preciosPorTamano.find(
      (p) => p.productoId === productoId && p.tamanoVasoId === tamanoVasoId,
    )
    return fila ? fila.precio : null
  }, [esOtro, productoObj, preciosPorTamano, productoId, tamanoVasoId])

  const cantidadNumerica = Number(cantidad)
  const total = useMemo(() => {
    if (precioSeleccionado === null || precioSeleccionado <= 0 || !Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) return 0
    return Math.round(precioSeleccionado * cantidadNumerica * 100) / 100
  }, [precioSeleccionado, cantidadNumerica])

  // Sincronizar automáticamente el método de pago por defecto en efectivo con el total
  useEffect(() => {
    if (total <= 0) return
    setPagos((prev) => {
      if (prev.length === 0) {
        return [{ metodoPago: 'efectivo', monto: total, pagaCon: total }]
      }
      if (prev.length === 1 && prev[0].metodoPago === 'efectivo' && prev[0].monto !== total) {
        const eraExacto = prev[0].pagaCon === undefined || prev[0].pagaCon === prev[0].monto
        return [
          {
            ...prev[0],
            monto: total,
            pagaCon: eraExacto ? total : prev[0].pagaCon,
          },
        ]
      }
      return prev
    })
  }, [total])

  // Cerrar modal de venta exitosa con teclado (Enter o Escape)
  useEffect(() => {
    if (!ventaExitosa) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === 'Escape') {
        setVentaExitosa(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ventaExitosa])

  const pagosValidos = sonPagosValidos(total, pagos)
  const efectivoInsuficiente = pagos.some(
    (p) => p.metodoPago === 'efectivo' && p.pagaCon !== undefined && p.pagaCon < p.monto,
  )

  const fmt = (n: number) =>
    '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setExito(null)

    if (!productoId) {
      setError('Selecciona un producto.')
      return
    }
    if (!esOtro && !tamanoVasoId) {
      setError('Selecciona una presentación o tamaño de vaso.')
      return
    }
    if (precioSeleccionado === null || precioSeleccionado <= 0) {
      setError(
        esOtro
          ? 'Este producto no tiene un precio directo configurado.'
          : 'Este producto no tiene un precio configurado para el tamaño de vaso seleccionado.',
      )
      return
    }
    if (!Number.isInteger(cantidadNumerica) || cantidadNumerica <= 0) {
      setError('La cantidad debe ser un número entero mayor que cero.')
      return
    }
    if (!pagosValidos) {
      setError('La suma de los métodos de pago debe coincidir exactamente con el total de la venta.')
      return
    }
    if (efectivoInsuficiente) {
      setError('El efectivo recibido no puede ser menor al monto a cobrar en efectivo.')
      return
    }

    const tamanoObj = tamanosVaso.find((t) => t.id === tamanoVasoId)
    const tamanoEtiquetaConfirm = esOtro ? 'Unidad' : (tamanoObj?.etiqueta ?? '')

    // Detalle de devuelta para el modal de confirmación
    const pagosEfectivo = pagos.filter((p) => p.metodoPago === 'efectivo')
    let detalleDevueltaConfirmacion = ''
    if (pagosEfectivo.length > 0) {
      const lineas = pagosEfectivo.map((p) => {
        const cobrado = p.monto
        const recibido = p.pagaCon ?? p.monto
        const devuelta = Math.max(0, Math.round((recibido - cobrado) * 100) / 100)
        return recibido > cobrado
          ? `Recibe: ${fmt(recibido)} | DEVUELTA A ENTREGAR: ${fmt(devuelta)}`
          : `Recibe: ${fmt(recibido)} (Exacto)`
      })
      detalleDevueltaConfirmacion = `\n\n${lineas.join(' — ')}`
    }

    const ok = await confirmar({
      titulo: 'Registrar venta',
      mensaje: `¿Confirmas registrar la venta de ${cantidadNumerica}x ${productoObj?.nombre ?? ''} (${tamanoEtiquetaConfirm}) por un total de ${fmt(total)} con ${pagos.length} método(s) de pago?${detalleDevueltaConfirmacion}\n\nEsta acción descuenta inventario y no se puede deshacer desde este panel.`,
      textoConfirmar: 'Registrar venta',
      varianteConfirmar: 'primary',
    })
    if (!ok) return

    setEnviando(true)
    try {
      // Registrar devuelta y efectivo en el sistema (trazabilidad oficial en observaciones)
      let infoRegistroDevuelta = ''
      if (pagosEfectivo.length > 0) {
        const fragmentos = pagosEfectivo.map((p) => {
          const cobrado = p.monto
          const recibido = p.pagaCon ?? p.monto
          const devuelta = Math.max(0, Math.round((recibido - cobrado) * 100) / 100)
          if (devuelta > 0) {
            return `Efectivo: Recibido ${fmt(recibido)} | Devuelta ${fmt(devuelta)}`
          }
          return `Efectivo: Recibido ${fmt(recibido)} (Exacto)`
        })
        infoRegistroDevuelta = `[${fragmentos.join(', ')}]`
      }

      const obsTexto = observaciones.trim()
      const observacionesFinales = obsTexto
        ? `${obsTexto} — ${infoRegistroDevuelta}`
        : infoRegistroDevuelta || undefined

      await onRegistrar({
        productoId,
        tamanoVasoId: esOtro ? null : tamanoVasoId,
        cantidad: cantidadNumerica,
        tipoEntrega,
        observaciones: observacionesFinales,
        pagos,
      })

      const totalRecibidoEfectivo = pagosEfectivo.reduce((sum, p) => sum + (p.pagaCon ?? p.monto), 0)
      const totalCobradoEfectivo = pagosEfectivo.reduce((sum, p) => sum + p.monto, 0)
      const totalDevuelta = Math.max(
        0,
        Math.round((totalRecibidoEfectivo - totalCobradoEfectivo) * 100) / 100,
      )

      setVentaExitosa({
        producto: productoObj?.nombre ?? 'Producto',
        tamano: tamanoEtiquetaConfirm,
        cantidad: cantidadNumerica,
        total,
        efectivoRecibido: pagosEfectivo.length > 0 ? totalRecibidoEfectivo : undefined,
        devuelta: pagosEfectivo.length > 0 ? totalDevuelta : undefined,
      })

      setExito(
        pagosEfectivo.length > 0 && totalDevuelta > 0
          ? `✓ Venta registrada correctamente. Devuelta entregada: ${fmt(totalDevuelta)}`
          : '✓ Venta registrada correctamente.',
      )
      setCantidad('1')
      setObservaciones('')
      // Reiniciar pagos de nuevo vinculados al producto actual
      setPagos([{ metodoPago: 'efectivo', monto: total, pagaCon: total }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la venta.')
    } finally {
      setEnviando(false)
    }
  }

  if (productos.length === 0) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '36px 24px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No hay productos activos para vender.</p>
      </GlassCard>
    )
  }
  if (tamanosVaso.length === 0) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '36px 24px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No hay tamaños de vaso activos configurados.</p>
      </GlassCard>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Columna Izquierda: Detalle del Producto y Pedido */}
        <GlassCard padding="32px 28px">
          <h2
            style={{
              margin: '0 0 20px',
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.3px',
              color: 'var(--text-primary)',
            }}
          >
            Producto y Presentación
          </h2>

          {/* Filtro rápido por categoría */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Categoría
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Chip
                active={categoriaFiltro === 'todas'}
                onClick={() => setCategoriaFiltro('todas')}
              >
                Todos
              </Chip>
              <Chip
                active={categoriaFiltro === 'ceviche'}
                onClick={() => setCategoriaFiltro('ceviche')}
              >
                🐟 Ceviches
              </Chip>
              <Chip
                active={categoriaFiltro === 'bebida'}
                onClick={() => setCategoriaFiltro('bebida')}
              >
                🥤 Bebidas
              </Chip>
              <Chip
                active={categoriaFiltro === 'otro'}
                onClick={() => setCategoriaFiltro('otro')}
              >
                📦 Otros
              </Chip>
            </div>
          </div>

          <Select
            id="venta_producto"
            label="Producto"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            required
          >
            {productosFiltrados.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.categoria === 'ceviche'
                  ? '🐟 '
                  : producto.categoria === 'bebida'
                  ? '🥤 '
                  : '📦 '}
                {producto.nombre}
              </option>
            ))}
          </Select>

          <Input
            id="venta_cantidad"
            type="number"
            min="1"
            step="1"
            label="Cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />

          {/* Fila condicional: Producto individual ('otro') vs Presentaciones ('ceviche'/'bebida') */}
          {esOtro ? (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                background: 'var(--input-bg)',
                border: '1px dashed var(--input-border)',
                borderRadius: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  📦 Producto Individual
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--brand-green)' }}>
                  {fmt(productoObj?.precio ?? 0)} c/u
                </span>
              </div>
              {productoObj?.descripcion && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {productoObj.descripcion}
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                {productoObj?.categoria === 'bebida' ? 'Presentación (Mililitros)' : 'Tamaño de vaso (Onzas)'}
              </label>
              {tamanosConfigurados.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tamanosConfigurados.map((tamano) => (
                    <Chip
                      key={tamano.id}
                      active={tamanoVasoId === tamano.id}
                      onClick={() => setTamanoVasoId(tamano.id)}
                    >
                      {tamano.etiqueta}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--red-text)' }}>
                  Este producto no tiene tamaños ni precios activos configurados.
                </p>
              )}
            </div>
          )}

          {/* Chips de Tipo de Entrega */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: 8,
              }}
            >
              Tipo de entrega
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip
                active={tipoEntrega === 'para_llevar'}
                onClick={() => setTipoEntrega('para_llevar')}
              >
                Para llevar
              </Chip>
              <Chip
                active={tipoEntrega === 'consumo_lugar'}
                onClick={() => setTipoEntrega('consumo_lugar')}
              >
                Consumo en el lugar
              </Chip>
            </div>
          </div>

          <Textarea
            id="venta_observaciones"
            label="Observaciones (opcional)"
            placeholder="Sin cebolla, picante suave, etc."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </GlassCard>

        {/* Columna Derecha: Cobro y Pagos Mixtos */}
        <GlassCard padding="32px 28px">
          <div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Total a cobrar
            </span>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
                marginTop: 4,
                marginBottom: 8,
              }}
            >
              {fmt(total)}
            </div>
            {precioSeleccionado !== null && precioSeleccionado > 0 && cantidadNumerica > 1 && (
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                ({cantidadNumerica} × {fmt(precioSeleccionado)})
              </span>
            )}
          </div>

          <PagoMixtoForm total={total} pagos={pagos} onChange={setPagos} />

          {error && (
            <p role="alert" style={{ margin: '10px 0', fontSize: 13, fontWeight: 600, color: 'var(--red-text)' }}>
              {error}
            </p>
          )}
          {exito && (
            <p style={{ margin: '10px 0', fontSize: 13, fontWeight: 600, color: 'var(--green-text)' }}>
              {exito}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={
              enviando || !pagosValidos || !precioSeleccionado || total <= 0 || efectivoInsuficiente
            }
            style={{ marginTop: 8 }}
          >
            {enviando ? 'Registrando venta…' : 'Registrar venta'}
          </Button>
        </GlassCard>
      </div>

      {/* Modal / Comprobante de Venta Exitosa con Devuelta */}
      {ventaExitosa && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 12, 24, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setVentaExitosa(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 22,
              padding: '28px 24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 var(--pill-highlight)',
              textAlign: 'center',
              animation: 'fadeInScale 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'rgba(46, 158, 91, 0.18)',
                border: '1px solid rgba(46, 158, 91, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                color: 'var(--green-text)',
                margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(46, 158, 91, 0.25)',
              }}
            >
              ✓
            </div>

            <h3
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: '0 0 6px',
                color: 'var(--text-primary)',
                letterSpacing: '-0.3px',
              }}
            >
              ¡Venta Registrada!
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
              {ventaExitosa.cantidad}x {ventaExitosa.producto} ({ventaExitosa.tamano})
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--hr-line)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 22,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                fontSize: 13.5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Total cobrado:</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>
                  {fmt(ventaExitosa.total)}
                </strong>
              </div>

              {ventaExitosa.efectivoRecibido !== undefined && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Efectivo recibido:</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>
                      {fmt(ventaExitosa.efectivoRecibido)}
                    </strong>
                  </div>

                  <div
                    style={{
                      borderTop: '1px dashed var(--hr-line)',
                      paddingTop: 14,
                      marginTop: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'var(--green-text)',
                          display: 'block',
                        }}
                      >
                        Devuelta al cliente
                      </span>
                      <span
                        style={{
                          fontSize: 26,
                          fontWeight: 900,
                          color: 'var(--green-text)',
                          letterSpacing: '-0.5px',
                        }}
                      >
                        {fmt(ventaExitosa.devuelta ?? 0)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: 'rgba(46, 158, 91, 0.2)',
                        color: 'var(--green-text)',
                        border: '1px solid rgba(46, 158, 91, 0.3)',
                      }}
                    >
                      Cambio
                    </span>
                  </div>
                </>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => setVentaExitosa(null)}
              autoFocus
            >
              Nueva venta (Enter)
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
