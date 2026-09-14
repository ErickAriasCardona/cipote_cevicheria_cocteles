import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { insumosService } from '../../services/insumosService'
import { ventasService } from '../../services/ventasService'
import { movimientosInventarioService } from '../../services/movimientosInventarioService'
import type { ReestablecerVasoItem } from '../../types/movimientoInventario'
import { Button } from '../ui/Button'
import { IconoCruz } from '../ui/IconosFormas'

interface ReestablecerInventarioModalProps {
  usuarioId: string
  abierto: boolean
  onCerrar: () => void
  onExito?: () => void
}

interface ItemFormulario {
  tamanoVasoId: string
  insumoId: string
  etiqueta: string
  categoria: string
  stockActual: number
  nuevoStock: number
}

function IconoAjuste() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20v-6M6 20V10M18 20V4M6 10l-2-2m2 2 2-2M12 14l-2-2m2 2 2-2M18 4l-2 2m2-2 2 2" />
    </svg>
  )
}

export function ReestablecerInventarioModal({
  usuarioId,
  abierto,
  onCerrar,
  onExito,
}: ReestablecerInventarioModalProps) {
  const [items, setItems] = useState<ItemFormulario[]>([])
  const [motivo, setMotivo] = useState('')
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
    setExito(null)
    try {
      const [tamanos, todosInsumos] = await Promise.all([
        ventasService.listarTamanosVasoActivos(),
        insumosService.listarInsumos(),
      ])

      const vasosFisicos = tamanos
        .filter((t) => t.tipo === 'vaso' && t.insumoId)
        .map((t) => {
          const insumo = todosInsumos.find((i) => i.id === t.insumoId)
          const stock = insumo ? Math.round(insumo.stockActual) : 0
          return {
            tamanoVasoId: t.id,
            insumoId: t.insumoId!,
            etiqueta: `Vaso ${t.etiqueta}`,
            categoria: t.categoria === 'ceviche' ? 'Ceviche' : 'Granizado',
            stockActual: stock,
            nuevoStock: stock,
          }
        })

      setItems(vasosFisicos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los vasos del sistema.')
    } finally {
      setCargando(false)
    }
  }

  function handleCambiarNuevoStock(insumoId: string, valor: number) {
    setItems((prev) =>
      prev.map((it) => (it.insumoId === insumoId ? { ...it, nuevoStock: Math.max(0, Math.round(valor)) } : it))
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setExito(null)
    setGuardando(true)

    try {
      const payloadItems: ReestablecerVasoItem[] = items.map((it) => ({
        insumoId: it.insumoId,
        tamanoVasoId: it.tamanoVasoId,
        nombre: `${it.etiqueta} (${it.categoria})`,
        stockActual: it.stockActual,
        nuevoStock: it.nuevoStock,
      }))

      await movimientosInventarioService.reestablecerInventarioVasos({
        items: payloadItems,
        usuarioId,
        motivo: motivo.trim() || null,
      })

      setExito('¡Inventario de vasos reestablecido con éxito! La cajera abrirá su turno con estas existencias.')
      if (onExito) {
        onExito()
      }
      setTimeout(() => {
        onCerrar()
      }, 1400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reestablecer el inventario.')
    } finally {
      setGuardando(false)
    }
  }

  if (!abierto) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !guardando) onCerrar()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
          background: 'var(--modal-bg)',
          border: '1px solid var(--modal-border)',
          borderRadius: 20,
          boxShadow: 'var(--modal-shadow)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--hr-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--input-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(65, 175, 224, 0.15)',
                color: 'var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconoAjuste />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                Reestablecer Inventario del Día / Turno
              </h2>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Fija las existencias de vasos con las que abrirá la cajera en su jornada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 4,
              display: 'flex',
              borderRadius: 6,
            }}
          >
            <IconoCruz />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(228, 41, 38, 0.12)',
                border: '1px solid rgba(228, 41, 38, 0.3)',
                color: 'var(--brand-red)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {exito && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(46, 158, 91, 0.12)',
                border: '1px solid rgba(46, 158, 91, 0.3)',
                color: 'var(--green-text)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {exito}
            </div>
          )}

          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Ingresa las cantidades exactas de vasos con las que debe contar el mostrador para el inicio de turno.
            Estas cantidades reemplazarán el stock del sistema y quedarán registradas en el <strong>Kardex</strong> con tu usuario responsable.
          </p>

          {cargando ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: '20px 0', fontSize: 13.5 }}>
              Cargando tamaños de vasos...
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => {
                const diferencia = item.nuevoStock - item.stockActual
                const esPositivo = diferencia > 0
                const esNegativo = diferencia < 0

                return (
                  <div
                    key={item.insumoId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--hr-line)',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {item.etiqueta}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {item.categoria} · Stock actual: <strong>{item.stockActual} uds</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>
                          Nuevo Stock
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleCambiarNuevoStock(item.insumoId, item.nuevoStock - 10)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid var(--hr-line)',
                              background: 'var(--input-bg)',
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            -10
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.nuevoStock}
                            onChange={(e) => handleCambiarNuevoStock(item.insumoId, Number(e.target.value) || 0)}
                            style={{
                              width: 70,
                              padding: '6px 8px',
                              fontSize: 14,
                              fontWeight: 800,
                              textAlign: 'center',
                              borderRadius: 8,
                              border: '1px solid var(--hr-line)',
                              background: 'var(--input-bg)',
                              color: 'var(--text-primary)',
                              outline: 'none',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleCambiarNuevoStock(item.insumoId, item.nuevoStock + 10)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid var(--hr-line)',
                              background: 'var(--input-bg)',
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            +10
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          minWidth: 64,
                          textAlign: 'right',
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: esPositivo
                            ? 'var(--green-text)'
                            : esNegativo
                              ? 'var(--brand-red)'
                              : 'var(--text-secondary)',
                        }}
                      >
                        {esPositivo ? `+${diferencia}` : diferencia === 0 ? 'Sin cambio' : `${diferencia}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Motivo opcional */}
          <div>
            <label
              htmlFor="motivo-reestablecer"
              style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}
            >
              Motivo u observaciones (opcional)
            </label>
            <input
              id="motivo-reestablecer"
              type="text"
              placeholder="Ej. Conteo físico previo al fin de semana, reposición general..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--hr-line)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="secondary" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={guardando || cargando}>
              {guardando ? 'Guardando ajustes...' : 'Confirmar y Reestablecer Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
