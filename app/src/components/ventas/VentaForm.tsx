import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import type { Insumo } from '../../types/insumo'
import type { Producto } from '../../types/producto'
import type { ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type { PromocionConDetalle } from '../../types/promocion'
import type { ItemVentaTicket, RegistrarVentaInput, TipoEntrega } from '../../types/venta'
import type { RegistrarVentaPagoInput } from '../../types/ventaPago'
import { sonPagosValidos } from '../../utils/pagoMixto'
import { formatearCOP } from '../../utils/moneda'
import { PagoMixtoForm } from './PagoMixtoForm'
import { GlassCard } from '../ui/GlassCard'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Chip } from '../ui/Chip'
import { IconoCheck, IconoCruz } from '../ui/IconosFormas'
import { Button } from '../ui/Button'

export interface ItemTicketLocal {
  id: string
  productoId?: string | null
  promocionId?: string | null
  tamanoVasoId?: string | null
  nombre: string
  tamanoEtiqueta: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface VentaFormProps {
  productos: Producto[]
  tamanosVaso: TamanoVaso[]
  preciosPorTamano: ProductoTamanoPrecio[]
  promociones?: PromocionConDetalle[]
  insumos?: Insumo[]
  onRegistrar: (input: RegistrarVentaInput) => Promise<void>
}

type CategoriaFiltro = 'todas' | 'ceviche' | 'granizado' | 'bebida' | 'otro' | 'combos'
type ModoDomicilio = 'sin_domicilio' | 'pagado_en_caja' | 'contra_entrega'

interface ReciboFacturaConfirmacionProps {
  ticketItems: ItemTicketLocal[]
  tipoEntrega: TipoEntrega
  modoDomicilio: ModoDomicilio
  valorDomicilioCaja: number
  valorContraEntrega: number
  bolsas: { grande: number; mediana: number; pequena: number }
  opcionesBolsas: {
    grande: { producto: Producto | null; precio: number }
    mediana: { producto: Producto | null; precio: number }
    pequena: { producto: Producto | null; precio: number }
  }
  cantidadTapas: number
  opcionTapa: { producto: Producto | null; precio: number }
  totalEmpaques: number
  subtotalProductos: number
  total: number
  pagos: RegistrarVentaPagoInput[]
}

/**
 * Componente con aspecto de factura digital POS para el modal de confirmación de ventas.
 */
function ReciboFacturaConfirmacion({
  ticketItems,
  tipoEntrega,
  modoDomicilio,
  valorDomicilioCaja,
  valorContraEntrega,
  bolsas,
  opcionesBolsas,
  cantidadTapas,
  opcionTapa,
  totalEmpaques,
  total,
  pagos,
}: ReciboFacturaConfirmacionProps) {
  const pagosEfectivo = pagos.filter((p) => p.metodoPago === 'efectivo')
  const totalEfectivoCobrado = pagosEfectivo.reduce((acc, p) => acc + (p.monto || 0), 0)
  const totalEfectivoRecibido = pagosEfectivo.reduce((acc, p) => acc + (p.pagaCon ?? p.monto ?? 0), 0)
  const totalDevuelta = Math.max(0, Math.round(totalEfectivoRecibido - totalEfectivoCobrado))
  const tieneEfectivo = pagosEfectivo.length > 0

  const pagosTransferencia = pagos.filter((p) =>
    p.metodoPago === 'transferencia_qr' ||
    p.metodoPago === 'nequi' ||
    p.subMetodo === 'Nequi' ||
    p.subMetodo === 'Bre-B' ||
    p.subMetodo === 'Transferencia Bancaria'
  )
  const tieneTransferencias = pagosTransferencia.length > 0

  const tieneEmpaques =
    bolsas.grande > 0 || bolsas.mediana > 0 || bolsas.pequena > 0 || cantidadTapas > 0

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--hr-line)',
        borderRadius: 14,
        padding: '16px 18px',
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Encabezado con aspecto de factura */}
      <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--hr-line)', paddingBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.6, color: 'var(--text-primary)' }}>
          CIPOTE CEVICHE COCTEL
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>
          Ticket de Confirmación de Venta
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 11.5, color: 'var(--text-faint)' }}>
          <span>{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span>•</span>
          <span>{new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>•</span>
          <span
            style={{
              fontWeight: 700,
              color: 'var(--brand-blue, #41afe0)',
              background: 'rgba(65, 175, 224, 0.12)',
              padding: '1px 7px',
              borderRadius: 4,
            }}
          >
            {modoDomicilio !== 'sin_domicilio'
              ? 'Domicilio'
              : tipoEntrega === 'consumo_lugar'
                ? 'Consumo en el local'
                : 'Para llevar'}
          </span>
        </div>
      </div>

      {/* Tabla numerada de ítems */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            paddingBottom: 4,
            borderBottom: '1px solid var(--hr-line)',
          }}
        >
          <span style={{ width: 22 }}>#</span>
          <span style={{ width: 34 }}>Cant</span>
          <span style={{ flex: 1, paddingLeft: 4 }}>Descripción</span>
          <span style={{ textAlign: 'right' }}>Subtotal</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto', paddingTop: 6, paddingRight: 4 }}>
          {ticketItems.map((item, i) => (
            <div key={item.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '2px 0' }}>
              <span style={{ width: 22, fontWeight: 700, color: 'var(--text-faint)' }}>{i + 1}.</span>
              <span style={{ width: 34, fontWeight: 700, color: 'var(--brand-blue, #41afe0)' }}>{item.cantidad}x</span>
              <div style={{ flex: 1, paddingLeft: 4, paddingRight: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nombre}</span>
                {item.tamanoEtiqueta && (
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginLeft: 4 }}>({item.tamanoEtiqueta})</span>
                )}
              </div>
              <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {formatearCOP(item.precioUnitario * item.cantidad)}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Adicionales y Empaques con viñetas */}
      {(modoDomicilio !== 'sin_domicilio' || tieneEmpaques) && (
        <div style={{ borderTop: '1px dashed var(--hr-line)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
            Adicionales y Empaques:
          </div>
          {modoDomicilio === 'pagado_en_caja' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>• Domicilio pagado en caja:</span>
              <strong style={{ color: 'var(--text-primary)' }}>+{formatearCOP(valorDomicilioCaja)}</strong>
            </div>
          )}
          {modoDomicilio === 'contra_entrega' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>• Domicilio contra entrega:</span>
              <span style={{ color: '#d97706', fontWeight: 600 }}>Cobra repartidor {formatearCOP(valorContraEntrega)}</span>
            </div>
          )}
          {bolsas.grande > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>• Bolsa Grande ({bolsas.grande} und):</span>
              <span>{opcionesBolsas.grande.precio > 0 ? `+${formatearCOP(opcionesBolsas.grande.precio * bolsas.grande)}` : 'Incluida'}</span>
            </div>
          )}
          {bolsas.mediana > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>• Bolsa Mediana ({bolsas.mediana} und):</span>
              <span>{opcionesBolsas.mediana.precio > 0 ? `+${formatearCOP(opcionesBolsas.mediana.precio * bolsas.mediana)}` : 'Incluida'}</span>
            </div>
          )}
          {bolsas.pequena > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>• Bolsa Pequeña ({bolsas.pequena} und):</span>
              <span>{opcionesBolsas.pequena.precio > 0 ? `+${formatearCOP(opcionesBolsas.pequena.precio * bolsas.pequena)}` : 'Incluida'}</span>
            </div>
          )}
          {cantidadTapas > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>• Tapas ({cantidadTapas} und):</span>
              <span>{opcionTapa.precio > 0 ? `+${formatearCOP(opcionTapa.precio * cantidadTapas)}` : 'Incluidas'}</span>
            </div>
          )}
          {totalEmpaques > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-blue, #41afe0)', fontWeight: 700, paddingTop: 2 }}>
              <span>Total empaques:</span>
              <span>+{formatearCOP(totalEmpaques)}</span>
            </div>
          )}
        </div>
      )}

      {/* Total a Cobrar destacado */}
      <div style={{ borderTop: '1px dashed var(--hr-line)', paddingTop: 10 }}>
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(228, 41, 38, 0.08)',
            border: '1px solid rgba(228, 41, 38, 0.25)',
            borderRadius: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 13.5, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            Total a cobrar:
          </span>
          <strong style={{ fontSize: 20, fontWeight: 900, color: '#e42926' }}>
            {formatearCOP(total)}
          </strong>
        </div>
      </div>

      {/* Desglose de Forma de Pago */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
          Forma de Pago:
        </div>
        {pagos.map((p, idx) => {
          const esTransf =
            p.metodoPago === 'transferencia_qr' ||
            p.metodoPago === 'nequi' ||
            p.subMetodo === 'Nequi' ||
            p.subMetodo === 'Bre-B' ||
            p.subMetodo === 'Transferencia Bancaria'
          const label = p.subMetodo || (p.metodoPago === 'efectivo' ? 'Efectivo' : p.metodoPago === 'nequi' ? 'Nequi' : p.metodoPago === 'tarjeta' ? 'Datáfono' : p.metodoPago === 'credito_rappi' ? 'Rappi' : 'Transferencia QR')

          return (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--brand-blue, #41afe0)' }}>•</span>
                <strong style={{ color: 'var(--text-primary)' }}>{label}:</strong>
                <span>{formatearCOP(p.monto)}</span>
                {p.metodoPago === 'efectivo' && p.pagaCon !== undefined && (
                  <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                    (Recibe: {formatearCOP(p.pagaCon)})
                  </span>
                )}
              </div>
              {esTransf && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#b45309',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  Pendiente
                </span>
              )}
            </div>
          )
        })}

        {/* Devuelta destacada */}
        {tieneEfectivo && totalDevuelta > 0 && (
          <div
            style={{
              marginTop: 4,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(46, 158, 91, 0.12)',
              border: '1px solid rgba(46, 158, 91, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-text, #2e9e5b)' }}>
              Cambio / Devuelta a entregar:
            </span>
            <strong style={{ fontSize: 17, fontWeight: 800, color: 'var(--green-text, #2e9e5b)' }}>
              {formatearCOP(totalDevuelta)}
            </strong>
          </div>
        )}

        {/* Nota de transferencias pendientes si aplica */}
        {tieneTransferencias && (
          <div
            style={{
              marginTop: 4,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            <strong>Aviso a cajera:</strong> Las transferencias quedan en estado <em>Pendiente</em> y deben validarse en el módulo de <strong>Transferencias</strong>.
          </div>
        )}
      </div>

      {/* Pie operativo */}
      <div
        style={{
          marginTop: 2,
          padding: '7px 10px',
          borderRadius: 8,
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid var(--hr-line)',
          fontSize: 11,
          color: 'var(--text-faint)',
          textAlign: 'center',
          lineHeight: 1.35,
        }}
      >
        Esta acción descontará los insumos del inventario automáticamente y no se puede deshacer desde caja.
      </div>
    </div>
  )
}

export function VentaForm({
  productos,
  tamanosVaso,
  preciosPorTamano,
  promociones = [],
  insumos = [],
  onRegistrar,
}: VentaFormProps) {
  // Filtro de categorías del catálogo
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFiltro>('todas')

  // Selección actual de producto / tamaño para añadir al carrito
  const [productoId, setProductoId] = useState(productos[0]?.id ?? '')
  const [tamanoVasoId, setTamanoVasoId] = useState('')
  const [cantidadItem, setCantidadItem] = useState('1')

  // Carrito / Ticket de compra actual
  const [ticketItems, setTicketItems] = useState<ItemTicketLocal[]>([])

  // Modalidad de domicilio
  const [modoDomicilio, setModoDomicilio] = useState<ModoDomicilio>('sin_domicilio')
  const [valorDomicilioCaja, setValorDomicilioCaja] = useState<number>(3000)
  const [valorContraEntrega, setValorContraEntrega] = useState<number>(5000)

  // Control de bolsas y tapas para pedidos para llevar o domicilios
  const [bolsas, setBolsas] = useState<{
    grande: number
    mediana: number
    pequena: number
  }>({
    grande: 0,
    mediana: 0,
    pequena: 0,
  })
  const [cantidadTapas, setCantidadTapas] = useState<number>(0)
  const [tapasEditadasManualmente, setTapasEditadasManualmente] = useState<boolean>(false)

  // Tipo de entrega general y notas
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('para_llevar')
  const [observaciones, setObservaciones] = useState('')

  const navigate = useNavigate()
  // Pagos y estados de envío
  const [pagos, setPagos] = useState<RegistrarVentaPagoInput[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [ventaExitosa, setVentaExitosa] = useState<{
    itemsCount: number
    total: number
    pagos: RegistrarVentaPagoInput[]
    efectivoRecibido?: number
    devuelta?: number
  } | null>(null)

  const { confirmar } = useConfirmacion()

  // Productos filtrados según la categoría
  const productosFiltrados = useMemo(() => {
    if (categoriaFiltro === 'todas' || categoriaFiltro === 'combos') return productos
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

  // Tamaños configurados para el producto seleccionado
  const tamanosConfigurados = useMemo(() => {
    if (!productoId || esOtro) return []
    return tamanosVaso.filter((t) =>
      preciosPorTamano.some((p) => p.productoId === productoId && p.tamanoVasoId === t.id),
    )
  }, [productoId, esOtro, tamanosVaso, preciosPorTamano])

  // Ajustar tamaño por defecto al cambiar producto
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

  // Precio del producto actual seleccionado
  const precioItemSeleccionado = useMemo(() => {
    if (esOtro) {
      return productoObj?.precio ?? null
    }
    const fila = preciosPorTamano.find(
      (p) => p.productoId === productoId && p.tamanoVasoId === tamanoVasoId,
    )
    return fila ? fila.precio : null
  }, [esOtro, productoObj, preciosPorTamano, productoId, tamanoVasoId])

  // Agregar producto normal al ticket
  function agregarProductoAlTicket() {
    setError(null)
    const cant = Math.max(1, Math.round(Number(cantidadItem) || 1))
    if (!productoObj) {
      setError('Selecciona un producto.')
      return
    }
    if (!esOtro && !tamanoVasoId) {
      setError('Selecciona una presentación o tamaño de vaso.')
      return
    }
    if (precioItemSeleccionado === null || precioItemSeleccionado <= 0) {
      setError('El producto o tamaño no tiene un precio configurado.')
      return
    }

    const tamanoObj = tamanosVaso.find((t) => t.id === tamanoVasoId)
    const tamanoEtiqueta = esOtro ? 'Unidad' : (tamanoObj?.etiqueta ?? 'Estándar')

    setTicketItems((prev) => {
      const indexExistente = prev.findIndex(
        (it) => it.productoId === productoId && it.tamanoVasoId === (esOtro ? null : tamanoVasoId),
      )
      if (indexExistente >= 0) {
        const existente = prev[indexExistente]
        const nuevaCant = existente.cantidad + cant
        const copia = [...prev]
        copia[indexExistente] = {
          ...existente,
          cantidad: nuevaCant,
          subtotal: nuevaCant * existente.precioUnitario,
        }
        return copia
      }
      return [
        ...prev,
        {
          id: `${productoId}-${tamanoVasoId}-${Date.now()}`,
          productoId,
          promocionId: null,
          tamanoVasoId: esOtro ? null : tamanoVasoId,
          nombre: productoObj.nombre,
          tamanoEtiqueta,
          cantidad: cant,
          precioUnitario: precioItemSeleccionado,
          subtotal: cant * precioItemSeleccionado,
        },
      ]
    })
    setCantidadItem('1')
  }

  // Agregar combo / promoción al ticket
  function agregarPromocionAlTicket(promo: PromocionConDetalle) {
    setError(null)
    setTicketItems((prev) => {
      const indexExistente = prev.findIndex((it) => it.promocionId === promo.id)
      if (indexExistente >= 0) {
        const existente = prev[indexExistente]
        const nuevaCant = existente.cantidad + 1
        const copia = [...prev]
        copia[indexExistente] = {
          ...existente,
          cantidad: nuevaCant,
          subtotal: nuevaCant * existente.precioUnitario,
        }
        return copia
      }
      return [
        ...prev,
        {
          id: `promo-${promo.id}-${Date.now()}`,
          productoId: null,
          promocionId: promo.id,
          tamanoVasoId: null,
          nombre: promo.nombre,
          tamanoEtiqueta: 'Combo / Promoción',
          cantidad: 1,
          precioUnitario: promo.precio,
          subtotal: promo.precio,
        },
      ]
    })
  }

  // Modificar cantidad en ticket (+1 / -1)
  function actualizarCantidadTicket(id: string, delta: number) {
    setTicketItems((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const nuevaCant = it.cantidad + delta
            if (nuevaCant <= 0) return null
            return {
              ...it,
              cantidad: nuevaCant,
              subtotal: nuevaCant * it.precioUnitario,
            }
          }
          return it
        })
        .filter((it): it is ItemTicketLocal => it !== null),
    )
  }

  // Eliminar item del ticket
  function quitarItemTicket(id: string) {
    setTicketItems((prev) => prev.filter((it) => it.id !== id))
  }

  // Opciones dinámicas de Bolsas vinculadas al catálogo de productos e inventario de insumos
  const opcionesBolsas = useMemo(() => {
    function normalizar(texto?: string | null): string {
      if (!texto) return ''
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    }

    // 1. Insumos tipo 'Bolsa'
    const insumoGrande = insumos.find(
      (i) =>
        (normalizar(i.tipo) === 'bolsa' || normalizar(i.nombre).includes('bolsa')) &&
        normalizar(i.nombre).includes('grande'),
    ) ?? null
    const insumoMediana = insumos.find(
      (i) =>
        (normalizar(i.tipo) === 'bolsa' || normalizar(i.nombre).includes('bolsa')) &&
        normalizar(i.nombre).includes('mediana'),
    ) ?? null
    const insumoPequena = insumos.find(
      (i) =>
        (normalizar(i.tipo) === 'bolsa' || normalizar(i.nombre).includes('bolsa')) &&
        (normalizar(i.nombre).includes('pequen') || normalizar(i.nombre).includes('peq')),
    ) ?? null

    // 2. Productos activos en catálogo
    const prodGrande = productos.find(
      (p) => normalizar(p.nombre).includes('bolsa') && normalizar(p.nombre).includes('grande'),
    ) ?? null
    const prodMediana = productos.find(
      (p) => normalizar(p.nombre).includes('bolsa') && normalizar(p.nombre).includes('mediana'),
    ) ?? null
    const prodPequena = productos.find(
      (p) =>
        normalizar(p.nombre).includes('bolsa') &&
        (normalizar(p.nombre).includes('pequen') || normalizar(p.nombre).includes('peq')),
    ) ?? null

    function buildOpcion(
      tipo: 'grande' | 'mediana' | 'pequena',
      etiquetaCorta: string,
      nombreCompleto: string,
      producto: Producto | null,
      insumo: Insumo | null,
    ) {
      const stock = insumo
        ? (insumo.stockMinimoDiario > 0 ? insumo.stockMinimoDiario : insumo.stockActual)
        : 0
      const activoEnProductos = Boolean(producto && producto.activo)
      const tieneStock = stock > 0
      const disponible = activoEnProductos && tieneStock
      const precio = producto && producto.precio ? Number(producto.precio) : 0

      return {
        tipo,
        etiquetaCorta,
        nombreCompleto,
        producto,
        insumo,
        precio,
        stock,
        activoEnProductos,
        tieneStock,
        disponible,
      }
    }

    return {
      grande: buildOpcion('grande', 'Gran.', 'Bolsa Grande', prodGrande, insumoGrande),
      mediana: buildOpcion('mediana', 'Med.', 'Bolsa Mediana', prodMediana, insumoMediana),
      pequena: buildOpcion('pequena', 'Peq.', 'Bolsa Pequeña', prodPequena, insumoPequena),
    }
  }, [productos, insumos])

  // Opción dinámica de Tapas vinculada al catálogo de productos e inventario de insumos
  const opcionTapa = useMemo(() => {
    function normalizar(texto?: string | null): string {
      if (!texto) return ''
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    }

    const insumoTapa = insumos.find((i) => normalizar(i.nombre).includes('tapa')) ?? null
    const prodTapa = productos.find((p) => normalizar(p.nombre).includes('tapa')) ?? null

    const stock = insumoTapa
      ? (insumoTapa.stockMinimoDiario > 0 ? insumoTapa.stockMinimoDiario : insumoTapa.stockActual)
      : 0
    const activoEnProductos = Boolean(prodTapa && prodTapa.activo)
    const precio = prodTapa && prodTapa.precio ? Number(prodTapa.precio) : 0

    return {
      insumo: insumoTapa,
      producto: prodTapa,
      stock,
      activoEnProductos,
      precio,
    }
  }, [productos, insumos])

  // Cantidad de vasos / bebidas en el ticket para sugerir tapas
  const totalVasosEnTicket = useMemo(() => {
    return ticketItems.reduce((acc, it) => {
      return it.tamanoVasoId || it.promocionId ? acc + it.cantidad : acc
    }, 0)
  }, [ticketItems])

  useEffect(() => {
    if (!tapasEditadasManualmente) {
      setCantidadTapas(totalVasosEnTicket)
    }
  }, [totalVasosEnTicket, tapasEditadasManualmente])

  // Cálculo de totales
  const subtotalProductos = useMemo(
    () => ticketItems.reduce((acc, it) => acc + it.subtotal, 0),
    [ticketItems],
  )

  const totalBolsas = useMemo(() => {
    return (
      bolsas.grande * opcionesBolsas.grande.precio +
      bolsas.mediana * opcionesBolsas.mediana.precio +
      bolsas.pequena * opcionesBolsas.pequena.precio
    )
  }, [bolsas, opcionesBolsas])

  const totalTapas = useMemo(() => {
    return cantidadTapas * opcionTapa.precio
  }, [cantidadTapas, opcionTapa])

  const totalEmpaques = totalBolsas + totalTapas
  const totalBolsasCantidad = bolsas.grande + bolsas.mediana + bolsas.pequena

  const recargoDomicilioCaja = modoDomicilio === 'pagado_en_caja' ? Math.max(0, valorDomicilioCaja) : 0
  const total = subtotalProductos + recargoDomicilioCaja + totalEmpaques

  // Sincronizar automáticamente el método de pago por defecto en efectivo con el total
  useEffect(() => {
    if (total <= 0) {
      setPagos([])
      return
    }
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

  // Cerrar modal de venta exitosa con teclado
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setExito(null)

    if (ticketItems.length === 0) {
      setError('Agrega al menos un producto o combo al pedido antes de registrar.')
      return
    }
    if (total <= 0) {
      setError('El total de la venta debe ser mayor a cero.')
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

    // Líneas numeradas de ítems para el mensaje estructurado de confirmación
    const lineasItems = ticketItems
      .map((it, idx) => `${idx + 1}. ${it.cantidad}x ${it.nombre}${it.tamanoEtiqueta ? ` (${it.tamanoEtiqueta})` : ''} - ${formatearCOP(it.precioUnitario * it.cantidad)}`)
      .join('\n')

    let detalleDomicilioTexto = ''
    if (modoDomicilio === 'pagado_en_caja') {
      detalleDomicilioTexto = `\n* Domicilio pagado en caja: +${formatearCOP(valorDomicilioCaja)}`
    } else if (modoDomicilio === 'contra_entrega') {
      detalleDomicilioTexto = `\n* Domicilio contra entrega: Repartidor cobra ${formatearCOP(valorContraEntrega)}`
    }

    let detalleEmpaquesTexto = ''
    if (modoDomicilio !== 'sin_domicilio' || tipoEntrega === 'para_llevar') {
      const resumenBolsas: string[] = []
      if (bolsas.grande > 0) resumenBolsas.push(`${bolsas.grande} Gran.`)
      if (bolsas.mediana > 0) resumenBolsas.push(`${bolsas.mediana} Med.`)
      if (bolsas.pequena > 0) resumenBolsas.push(`${bolsas.pequena} Peq.`)
      const textoBolsas = resumenBolsas.length > 0 ? resumenBolsas.join(', ') : '0 bolsas'
      detalleEmpaquesTexto = `\n* Empaques: ${textoBolsas}, ${cantidadTapas} tapa(s)`
      if (totalEmpaques > 0) {
        detalleEmpaquesTexto += ` (+${formatearCOP(totalEmpaques)})`
      }
    }

    const lineasPagos = pagos
      .map((p) => {
        const label =
          p.subMetodo ||
          (p.metodoPago === 'efectivo'
            ? 'Efectivo'
            : p.metodoPago === 'nequi'
              ? 'Nequi'
              : p.metodoPago === 'tarjeta'
                ? 'Datáfono'
                : p.metodoPago === 'credito_rappi'
                  ? 'Rappi'
                  : 'Transferencia QR')
        const esTransf =
          p.metodoPago === 'transferencia_qr' ||
          p.metodoPago === 'nequi' ||
          p.subMetodo === 'Nequi' ||
          p.subMetodo === 'Bre-B' ||
          p.subMetodo === 'Transferencia Bancaria'
        return `* ${label}: ${formatearCOP(p.monto)}${esTransf ? ' [Pendiente de validación]' : ''}`
      })
      .join('\n')

    const pagosEfectivo = pagos.filter((p) => p.metodoPago === 'efectivo')
    let detalleDevueltaTexto = ''
    if (pagosEfectivo.length > 0) {
      const totalRecibidoEfectivo = pagosEfectivo.reduce((sum, p) => sum + (p.pagaCon ?? p.monto), 0)
      const totalCobradoEfectivo = pagosEfectivo.reduce((sum, p) => sum + p.monto, 0)
      const totalDevuelta = Math.max(0, Math.round(totalRecibidoEfectivo - totalCobradoEfectivo))
      detalleDevueltaTexto = `\nRecibe en efectivo: ${formatearCOP(totalRecibidoEfectivo)}`
      if (totalDevuelta > 0) {
        detalleDevueltaTexto += `\nCambio / Devuelta a entregar: ${formatearCOP(totalDevuelta)}`
      }
    }

    const mensajeFacturaTexto = `¿Confirmas registrar el siguiente pedido?

ÍTEMS DEL PEDIDO:
${lineasItems}${detalleDomicilioTexto}${detalleEmpaquesTexto}

Total a cobrar: ${formatearCOP(total)}

FORMA DE PAGO:
${lineasPagos}${detalleDevueltaTexto}

Esta acción descuenta insumos y no se puede deshacer desde caja.`

    const ok = await confirmar({
      titulo: 'Confirmar Registro de Venta',
      anchoMaximo: 520,
      contenido: (
        <ReciboFacturaConfirmacion
          ticketItems={ticketItems}
          tipoEntrega={tipoEntrega}
          modoDomicilio={modoDomicilio}
          valorDomicilioCaja={valorDomicilioCaja}
          valorContraEntrega={valorContraEntrega}
          bolsas={bolsas}
          opcionesBolsas={opcionesBolsas}
          cantidadTapas={cantidadTapas}
          opcionTapa={opcionTapa}
          totalEmpaques={totalEmpaques}
          subtotalProductos={subtotalProductos}
          total={total}
          pagos={pagos}
        />
      ),
      mensaje: mensajeFacturaTexto,
      textoConfirmar: 'Registrar venta',
      varianteConfirmar: 'primary',
    })
    if (!ok) return

    setEnviando(true)
    try {
      // Construir items del ticket
      const itemsPayload: ItemVentaTicket[] = ticketItems.map((it) => ({
        productoId: it.productoId,
        promocionId: it.promocionId,
        tamanoVasoId: it.tamanoVasoId,
        cantidad: it.cantidad,
        precio: it.precioUnitario,
        nombre: it.nombre,
      }))

      // Si aplica domicilio pagado en caja, agregar el item técnico de domicilio
      if (modoDomicilio === 'pagado_en_caja' && valorDomicilioCaja > 0) {
        itemsPayload.push({
          productoId: '00000000-0000-0000-0000-0000000000d0',
          cantidad: 1,
          precio: valorDomicilioCaja,
          nombre: 'Servicio de Domicilio',
        })
      }

      // Si se cobraron bolsas (con producto activo y precio > 0), agregarlas a los items del ticket
      if (bolsas.grande > 0 && opcionesBolsas.grande.producto && opcionesBolsas.grande.precio > 0) {
        itemsPayload.push({
          productoId: opcionesBolsas.grande.producto.id,
          cantidad: bolsas.grande,
          precio: opcionesBolsas.grande.precio,
          nombre: `Bolsa Grande (${bolsas.grande} und)`,
        })
      }
      if (bolsas.mediana > 0 && opcionesBolsas.mediana.producto && opcionesBolsas.mediana.precio > 0) {
        itemsPayload.push({
          productoId: opcionesBolsas.mediana.producto.id,
          cantidad: bolsas.mediana,
          precio: opcionesBolsas.mediana.precio,
          nombre: `Bolsa Mediana (${bolsas.mediana} und)`,
        })
      }
      if (bolsas.pequena > 0 && opcionesBolsas.pequena.producto && opcionesBolsas.pequena.precio > 0) {
        itemsPayload.push({
          productoId: opcionesBolsas.pequena.producto.id,
          cantidad: bolsas.pequena,
          precio: opcionesBolsas.pequena.precio,
          nombre: `Bolsa Pequeña (${bolsas.pequena} und)`,
        })
      }

      // Si se cobraron tapas (con producto activo y precio > 0), agregarlas a los items del ticket
      if (cantidadTapas > 0 && opcionTapa.producto && opcionTapa.precio > 0) {
        itemsPayload.push({
          productoId: opcionTapa.producto.id,
          cantidad: cantidadTapas,
          precio: opcionTapa.precio,
          nombre: `Tapa para Vaso (${cantidadTapas} und)`,
        })
      }

      // Preparar observaciones con datos de devuelta, sub-métodos y domicilio contra entrega
      const fragmentosObs: string[] = []
      if (observaciones.trim()) fragmentosObs.push(observaciones.trim())

      if (modoDomicilio === 'contra_entrega') {
        fragmentosObs.push(`[DOMICILIO CONTRA ENTREGA: Repartidor cobra ${formatearCOP(valorContraEntrega)}]`)
      }

      if (modoDomicilio !== 'sin_domicilio' || tipoEntrega === 'para_llevar') {
        const resumenEmpaques: string[] = []
        if (bolsas.grande > 0) resumenEmpaques.push(`${bolsas.grande} Gran.`)
        if (bolsas.mediana > 0) resumenEmpaques.push(`${bolsas.mediana} Med.`)
        if (bolsas.pequena > 0) resumenEmpaques.push(`${bolsas.pequena} Peq.`)
        if (cantidadTapas > 0) resumenEmpaques.push(`${cantidadTapas} Tapas`)
        if (resumenEmpaques.length > 0) {
          fragmentosObs.push(`[Empaques: ${resumenEmpaques.join(', ')}]`)
        }
      }

      pagos.forEach((p) => {
        if (p.subMetodo) fragmentosObs.push(`[Método: ${p.subMetodo}]`)
        if (p.metodoPago === 'efectivo' && p.pagaCon !== undefined) {
          const dev = Math.max(0, Math.round(p.pagaCon - p.monto))
          if (dev > 0) {
            fragmentosObs.push(`[Efectivo: Recibe ${formatearCOP(p.pagaCon)} | Devuelta ${formatearCOP(dev)}]`)
          } else {
            fragmentosObs.push(`[Efectivo: Recibe ${formatearCOP(p.pagaCon)} Exacto]`)
          }
        }
      })

      const obsFinales = fragmentosObs.join(' — ') || undefined

      await onRegistrar({
        items: itemsPayload,
        tipoEntrega: modoDomicilio !== 'sin_domicilio' ? 'para_llevar' : tipoEntrega,
        observaciones: obsFinales,
        pagos,
        cantidadBolsas: modoDomicilio !== 'sin_domicilio' || tipoEntrega === 'para_llevar' ? totalBolsasCantidad : 0,
        cantidadBolsasGrande: modoDomicilio !== 'sin_domicilio' || tipoEntrega === 'para_llevar' ? bolsas.grande : 0,
        cantidadBolsasMediana: modoDomicilio !== 'sin_domicilio' || tipoEntrega === 'para_llevar' ? bolsas.mediana : 0,
        cantidadBolsasPequena: modoDomicilio !== 'sin_domicilio' || tipoEntrega === 'para_llevar' ? bolsas.pequena : 0,
        cantidadTapas: modoDomicilio !== 'sin_domicilio' || tipoEntrega === 'para_llevar' ? cantidadTapas : 0,
      })

      const totalRecibidoEfectivo = pagosEfectivo.reduce((sum, p) => sum + (p.pagaCon ?? p.monto), 0)
      const totalCobradoEfectivo = pagosEfectivo.reduce((sum, p) => sum + p.monto, 0)
      const totalDevuelta = Math.max(0, Math.round(totalRecibidoEfectivo - totalCobradoEfectivo))

      setVentaExitosa({
        itemsCount: ticketItems.length,
        total,
        pagos: [...pagos],
        efectivoRecibido: pagosEfectivo.length > 0 ? totalRecibidoEfectivo : undefined,
        devuelta: pagosEfectivo.length > 0 ? totalDevuelta : undefined,
      })

      setExito(
        pagosEfectivo.length > 0 && totalDevuelta > 0
          ? `Venta registrada con éxito. Devuelta a entregar: ${formatearCOP(totalDevuelta)}`
          : 'Venta registrada con éxito.',
      )

      // Limpiar pedido
      setTicketItems([])
      setObservaciones('')
      setModoDomicilio('sin_domicilio')
      setBolsas({ grande: 0, mediana: 0, pequena: 0 })
      setCantidadTapas(0)
      setTapasEditadasManualmente(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la venta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Columna Izquierda: Catálogo y Carrito */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Panel Selector de Productos / Combos */}
          <GlassCard padding="24px">
            <h2
              style={{
                margin: '0 0 16px',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Catálogo de Productos
            </h2>

            {/* Chips de Categoría */}
            <div style={{ marginBottom: 16 }}>
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
                  Ceviches
                </Chip>
                <Chip
                  active={categoriaFiltro === 'granizado'}
                  onClick={() => setCategoriaFiltro('granizado')}
                >
                  Granizados
                </Chip>
                <Chip
                  active={categoriaFiltro === 'bebida'}
                  onClick={() => setCategoriaFiltro('bebida')}
                >
                  Bebidas
                </Chip>
                <Chip
                  active={categoriaFiltro === 'otro'}
                  onClick={() => setCategoriaFiltro('otro')}
                >
                  Otros
                </Chip>
                {promociones.length > 0 && (
                  <Chip
                    active={categoriaFiltro === 'combos'}
                    onClick={() => setCategoriaFiltro('combos')}
                  >
                    Combos / Promos
                  </Chip>
                )}
              </div>
            </div>

            {/* Vista de Combos si se selecciona la pestaña de combos */}
            {categoriaFiltro === 'combos' ? (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {promociones.map((promo) => (
                    <div
                      key={promo.id}
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                          {promo.nombre}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {promo.componentes.map((c) => `${c.cantidad}x ${c.nombreProducto} (${c.etiquetaTamano ?? 'Estándar'})`).join(' + ')}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-green)', marginTop: 4 }}>
                          {formatearCOP(promo.precio)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => agregarPromocionAlTicket(promo)}
                      >
                        + Agregar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Selección de Producto Regular */
              <div>
                <Select
                  id="venta_producto"
                  label="Producto"
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  required
                >
                  {productosFiltrados.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre}
                    </option>
                  ))}
                </Select>

                {/* Presentación / Tamaño */}
                {esOtro ? (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: '10px 12px',
                      background: 'var(--input-bg)',
                      border: '1px dashed var(--input-border)',
                      borderRadius: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Producto Individual
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--brand-green)' }}>
                      {formatearCOP(productoObj?.precio ?? 0)} c/u
                    </span>
                  </div>
                ) : (
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
                      {productoObj?.categoria === 'bebida'
                        ? 'Presentación'
                        : 'Tamaño de vaso'}
                    </label>
                    {tamanosConfigurados.length > 0 ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {tamanosConfigurados.map((tamano) => {
                          const precioTam = preciosPorTamano.find(
                            (p) => p.productoId === productoId && p.tamanoVasoId === tamano.id,
                          )?.precio
                          return (
                            <Chip
                              key={tamano.id}
                              active={tamanoVasoId === tamano.id}
                              onClick={() => setTamanoVasoId(tamano.id)}
                            >
                              {tamano.etiqueta} {precioTam ? `(${formatearCOP(precioTam)})` : ''}
                            </Chip>
                          )
                        })}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--red-text)' }}>
                        Este producto no tiene tamaños ni precios configurados.
                      </p>
                    )}
                  </div>
                )}

                {/* Cantidad y Botón de Agregar */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 10 }}>
                  <div style={{ width: 110 }}>
                    <Input
                      id="venta_cantidad_item"
                      type="number"
                      min="1"
                      step="1"
                      label="Cantidad"
                      value={cantidadItem}
                      onChange={(e) => setCantidadItem(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={agregarProductoAlTicket}
                    disabled={!precioItemSeleccionado || precioItemSeleccionado <= 0}
                    style={{ flex: 1, marginBottom: 16 }}
                  >
                    + Agregar al pedido
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Panel Carrito / Detalle del Pedido */}
          <GlassCard padding="24px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                Detalle de la Orden ({ticketItems.reduce((s, i) => s + i.cantidad, 0)} items)
              </h2>
              {ticketItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTicketItems([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--red-text)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Vaciar pedido
                </button>
              )}
            </div>

            {ticketItems.length === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  background: 'var(--input-bg)',
                  border: '1px dashed var(--input-border)',
                  borderRadius: 12,
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                }}
              >
                No hay productos en el pedido. Selecciona un producto arriba y haz clic en &quot;+ Agregar al pedido&quot;.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ticketItems.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 10,
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {it.nombre}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {it.tamanoEtiqueta} • {formatearCOP(it.precioUnitario)} c/u
                      </div>
                    </div>

                    {/* Controles de Cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => actualizarCantidadTicket(it.id, -1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: '1px solid var(--card-border)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-primary)',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 800, width: 22, textAlign: 'center' }}>
                        {it.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => actualizarCantidadTicket(it.id, 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: '1px solid var(--card-border)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-primary)',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ width: 85, textAlign: 'right', fontWeight: 800, fontSize: 13.5, color: 'var(--text-primary)' }}>
                      {formatearCOP(it.subtotal)}
                    </div>

                    <button
                      type="button"
                      onClick={() => quitarItemTicket(it.id)}
                      title="Eliminar item"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <IconoCruz size={14} strokeWidth={2.4} />
                    </button>
                  </div>
                ))}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 4px 0',
                    fontSize: 13.5,
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  <span>Subtotal productos:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatearCOP(subtotalProductos)}</strong>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Opciones de Domicilio y Entrega */}
          <GlassCard padding="24px">
            <h3
              style={{
                margin: '0 0 14px',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Servicio de Domicilio / Entrega
            </h3>

            {/* Selector de modo domicilio */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <Chip
                active={modoDomicilio === 'sin_domicilio'}
                onClick={() => setModoDomicilio('sin_domicilio')}
              >
                Sin Domicilio (En Punto)
              </Chip>
              <Chip
                active={modoDomicilio === 'pagado_en_caja'}
                onClick={() => setModoDomicilio('pagado_en_caja')}
              >
                Domicilio pagado en caja
              </Chip>
              <Chip
                active={modoDomicilio === 'contra_entrega'}
                onClick={() => setModoDomicilio('contra_entrega')}
              >
                Domicilio contra entrega
              </Chip>
            </div>

            {modoDomicilio === 'pagado_en_caja' && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(56, 126, 245, 0.1)',
                  border: '1px solid rgba(56, 126, 245, 0.3)',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)' }}>
                      Valor del Domicilio (se suma al total en caja):
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      El cliente paga este valor en la caja junto con su pedido.
                    </div>
                  </div>
                  <div style={{ width: 120 }}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={valorDomicilioCaja || ''}
                      onChange={(e) => setValorDomicilioCaja(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: 'var(--sans)',
                        textAlign: 'right',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {modoDomicilio === 'contra_entrega' && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber-text)' }}>
                      Valor a cobrar por el repartidor (NO se suma en caja):
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      El domiciliario le cobra directamente este valor al cliente en efectivo/transferencia.
                    </div>
                  </div>
                  <div style={{ width: 120 }}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={valorContraEntrega || ''}
                      onChange={(e) => setValorContraEntrega(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: 'var(--sans)',
                        textAlign: 'right',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {modoDomicilio === 'sin_domicilio' && (
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
                  Modalidad en el local
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
            )}

            {/* Control de Bolsas y Tapas para pedidos para llevar o domicilios */}
            {(modoDomicilio !== 'sin_domicilio' || tipoEntrega === 'para_llevar') && (
              <div
                style={{
                  marginTop: 10,
                  marginBottom: 16,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                  Empaques de despacho (Control de inventario)
                </div>

                {/* Bolsas de despacho con 3 opciones: Gran., Med., Peq. */}
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Bolsas para despacho
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 6 }}>
                        (Gran. / Med. / Peq.)
                      </span>
                    </div>
                    {totalBolsas > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-blue)' }}>
                        +{formatearCOP(totalBolsas)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {(
                      [
                        { key: 'grande', opt: opcionesBolsas.grande },
                        { key: 'mediana', opt: opcionesBolsas.mediana },
                        { key: 'pequena', opt: opcionesBolsas.pequena },
                      ] as const
                    ).map(({ key, opt }) => {
                      const cant = bolsas[key]
                      const seleccionada = cant > 0
                      return (
                        <div
                          key={key}
                          style={{
                            borderRadius: 10,
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: !opt.disponible
                              ? 'rgba(255, 255, 255, 0.02)'
                              : seleccionada
                                ? 'rgba(65, 175, 224, 0.12)'
                                : 'var(--input-bg)',
                            border: !opt.disponible
                              ? '1px dashed var(--input-border)'
                              : seleccionada
                                ? '1.5px solid var(--brand-blue)'
                                : '1px solid var(--input-border)',
                            opacity: opt.disponible ? 1 : 0.55,
                            transition: 'all 0.2s ease',
                            minHeight: 90,
                          }}
                        >
                          <button
                            type="button"
                            disabled={!opt.disponible}
                            onClick={() => {
                              if (!opt.disponible) return
                              setBolsas((prev) => ({
                                ...prev,
                                [key]: prev[key] === 0 ? 1 : prev[key],
                              }))
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: opt.disponible ? 'pointer' : 'not-allowed',
                              width: '100%',
                              textAlign: 'center',
                              padding: 0,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13.5,
                                fontWeight: 800,
                                color: seleccionada ? 'var(--brand-blue)' : 'var(--text-primary)',
                              }}
                            >
                              {opt.etiquetaCorta}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: opt.precio > 0 ? 'var(--green-text)' : 'var(--text-secondary)',
                                marginTop: 2,
                              }}
                            >
                              {opt.precio > 0 ? formatearCOP(opt.precio) : 'Incluida ($0)'}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: !opt.activoEnProductos
                                  ? 'var(--text-secondary)'
                                  : opt.tieneStock
                                    ? 'var(--text-secondary)'
                                    : 'var(--red-text)',
                                marginTop: 2,
                              }}
                            >
                              {!opt.activoEnProductos
                                ? 'Inactivo'
                                : opt.tieneStock
                                  ? `${Math.round(opt.stock)} disp.`
                                  : 'Sin stock'}
                            </div>
                          </button>

                          {opt.disponible && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                marginTop: 6,
                                width: '100%',
                              }}
                            >
                              {cant === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setBolsas((prev) => ({ ...prev, [key]: 1 }))}
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    border: '1px solid var(--card-border)',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  + Agregar
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBolsas((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }))
                                    }
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 5,
                                      border: '1px solid var(--card-border)',
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      color: 'var(--text-primary)',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      fontSize: 12,
                                    }}
                                  >
                                    -
                                  </button>
                                  <span
                                    style={{
                                      fontSize: 12.5,
                                      fontWeight: 800,
                                      minWidth: 16,
                                      textAlign: 'center',
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    {cant}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBolsas((prev) => ({
                                        ...prev,
                                        [key]: Math.min(opt.stock || 999, prev[key] + 1),
                                      }))
                                    }
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 5,
                                      border: '1px solid var(--card-border)',
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      color: 'var(--text-primary)',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      fontSize: 12,
                                    }}
                                  >
                                    +
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tapas para vasos */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Tapas para vasos
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: opcionTapa.stock > 0 ? 'var(--green-text)' : 'var(--red-text)',
                          fontWeight: 600,
                        }}
                      >
                        {opcionTapa.stock > 0 ? `${Math.round(opcionTapa.stock)} disp.` : 'Sin stock'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {opcionTapa.precio > 0
                        ? `${formatearCOP(opcionTapa.precio)} c/u`
                        : 'Tapa genérica incluida ($0)'}
                      {totalTapas > 0 && (
                        <span style={{ color: 'var(--brand-blue)', fontWeight: 700, marginLeft: 6 }}>
                          • Total: +{formatearCOP(totalTapas)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTapasEditadasManualmente(true)
                        setCantidadTapas((c) => Math.max(0, c - 1))
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: '1px solid var(--card-border)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-primary)',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 800, width: 22, textAlign: 'center' }}>
                      {cantidadTapas}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTapasEditadasManualmente(true)
                        setCantidadTapas((c) => Math.min(opcionTapa.stock || 999, c + 1))
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: '1px solid var(--card-border)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-primary)',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              id="venta_observaciones"
              label="Observaciones del pedido (opcional)"
              placeholder="Dirección, teléfono, sin cebolla, picante suave, etc."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </GlassCard>
        </div>

        {/* Columna Derecha: Cobro y Pagos */}
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
              Total a cobrar en caja
            </span>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              {formatearCOP(total)}
            </div>

            {((modoDomicilio === 'pagado_en_caja' && valorDomicilioCaja > 0) || totalEmpaques > 0) && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div>Productos: {formatearCOP(subtotalProductos)}</div>
                {modoDomicilio === 'pagado_en_caja' && valorDomicilioCaja > 0 && (
                  <div style={{ color: 'var(--brand-blue)', fontWeight: 600 }}>
                    + Domicilio en caja: {formatearCOP(valorDomicilioCaja)}
                  </div>
                )}
                {totalBolsas > 0 && (
                  <div style={{ color: 'var(--brand-blue)', fontWeight: 600 }}>
                    + Bolsas: {formatearCOP(totalBolsas)}
                  </div>
                )}
                {totalTapas > 0 && (
                  <div style={{ color: 'var(--brand-blue)', fontWeight: 600 }}>
                    + Tapas: {formatearCOP(totalTapas)}
                  </div>
                )}
              </div>
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
              enviando ||
              ticketItems.length === 0 ||
              total <= 0 ||
              !pagosValidos ||
              efectivoInsuficiente
            }
            style={{ marginTop: 8 }}
          >
            {enviando ? 'Registrando venta…' : 'Registrar Venta'}
          </Button>
        </GlassCard>
      </div>

      {/* Modal / Comprobante de Venta Exitosa */}
      {ventaExitosa && (
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
          onClick={() => setVentaExitosa(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              background: 'var(--modal-bg)',
              border: '1px solid var(--modal-border)',
              borderRadius: 22,
              padding: '28px 24px',
              boxShadow: 'var(--modal-shadow)',
              textAlign: 'center',
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
                color: 'var(--green-text)',
                margin: '0 auto 16px',
              }}
            >
              <IconoCheck size={32} color="var(--green-text)" strokeWidth={2.8} />
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
              Pedido de {ventaExitosa.itemsCount} producto(s) guardado correctamente.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--hr-line)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 20,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
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
                <strong style={{ color: 'var(--text-primary)', fontSize: 16 }}>
                  {formatearCOP(ventaExitosa.total)}
                </strong>
              </div>

              {/* Desglose de todos los métodos de pago */}
              {ventaExitosa.pagos && ventaExitosa.pagos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: 'var(--text-faint)',
                      marginBottom: 2,
                    }}
                  >
                    Métodos de pago aplicados:
                  </div>
                  {ventaExitosa.pagos.map((p, idx) => {
                    const label =
                      p.subMetodo ||
                      (p.metodoPago === 'efectivo'
                        ? 'Efectivo'
                        : p.metodoPago === 'nequi'
                          ? 'Nequi'
                          : p.metodoPago === 'tarjeta'
                            ? 'Datáfono'
                            : p.metodoPago === 'credito_rappi'
                              ? 'Rappi'
                              : 'Transferencia QR')
                    const esTransf =
                      p.metodoPago === 'transferencia_qr' ||
                      p.metodoPago === 'nequi' ||
                      p.subMetodo === 'Nequi' ||
                      p.subMetodo === 'Bre-B' ||
                      p.subMetodo === 'Transferencia Bancaria'

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: 'var(--text-secondary)',
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--brand-blue, #41afe0)' }}>•</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{label}:</span>
                          <span>{formatearCOP(p.monto)}</span>
                        </div>
                        {esTransf && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#b45309',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            Pendiente
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Efectivo recibido y Devuelta */}
              {ventaExitosa.efectivoRecibido !== undefined && (
                <>
                  <div
                    style={{
                      borderTop: '1px dashed var(--hr-line)',
                      paddingTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Efectivo recibido:</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>
                      {formatearCOP(ventaExitosa.efectivoRecibido)}
                    </strong>
                  </div>

                  <div
                    style={{
                      borderTop: '1px dashed var(--hr-line)',
                      paddingTop: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--green-text)', fontSize: 14 }}>
                      Cambio a entregar:
                    </span>
                    <strong
                      style={{
                        color: 'var(--green-text)',
                        fontSize: 22,
                        fontWeight: 900,
                      }}
                    >
                      {formatearCOP(ventaExitosa.devuelta)}
                    </strong>
                  </div>
                </>
              )}

              {/* Alerta de validación de Transferencias si aplica */}
              {ventaExitosa.pagos &&
                ventaExitosa.pagos.some(
                  (p) =>
                    p.metodoPago === 'transferencia_qr' ||
                    p.metodoPago === 'nequi' ||
                    p.subMetodo === 'Nequi' ||
                    p.subMetodo === 'Bre-B' ||
                    p.subMetodo === 'Transferencia Bancaria',
                ) && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: '10px 12px',
                      background: 'rgba(245, 158, 11, 0.09)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 10,
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <strong style={{ color: '#d97706', display: 'block', marginBottom: 2 }}>
                      Validación de Transferencia Requerida:
                    </strong>
                    Este pedido incluye transferencias en estado <strong>Pendiente</strong>. Recuerda validar y confirmar el comprobante en el módulo de <strong>Transferencias</strong>.
                  </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ventaExitosa.pagos &&
                ventaExitosa.pagos.some(
                  (p) =>
                    p.metodoPago === 'transferencia_qr' ||
                    p.metodoPago === 'nequi' ||
                    p.subMetodo === 'Nequi' ||
                    p.subMetodo === 'Bre-B' ||
                    p.subMetodo === 'Transferencia Bancaria',
                ) && (
                  <Button
                    type="button"
                    variant="blue"
                    fullWidth
                    size="md"
                    onClick={() => {
                      setVentaExitosa(null)
                      navigate('/cajero/transferencias')
                    }}
                  >
                    Ir al módulo de Transferencias
                  </Button>
                )}

              <Button
                type="button"
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => setVentaExitosa(null)}
              >
                Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
