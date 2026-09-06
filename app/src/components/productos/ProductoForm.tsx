import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CrearProductoInput } from '../../types/producto'
import type { NuevoTamanoPrecioInput } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface ProductoFormProps {
  tamanosVaso: TamanoVaso[]
  onCrear: (input: CrearProductoInput, tamanos: NuevoTamanoPrecioInput[]) => Promise<void>
}

export function ProductoForm({ tamanosVaso, onCrear }: ProductoFormProps) {
  const [nombre, setNombre] = useState('')
  const [tamanos, setTamanos] = useState<NuevoTamanoPrecioInput[]>([])
  const [tamanoVasoId, setTamanoVasoId] = useState(tamanosVaso[0]?.id ?? '')
  const [precioBorrador, setPrecioBorrador] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirmar } = useConfirmacion()

  const tamanosDisponibles = tamanosVaso.filter(
    (tamano) => !tamanos.some((fila) => fila.tamanoVasoId === tamano.id),
  )
  const precioBorradorNumerico = Number(precioBorrador)

  function handleAgregarTamano() {
    setError(null)
    if (!tamanoVasoId) return
    if (!Number.isFinite(precioBorradorNumerico) || precioBorradorNumerico <= 0) {
      setError('El precio del tamaño a agregar debe ser un número mayor que cero.')
      return
    }
    setTamanos((actual) => [...actual, { tamanoVasoId, precio: precioBorradorNumerico }])
    setPrecioBorrador('')
    const siguienteDisponible = tamanosDisponibles.find((tamano) => tamano.id !== tamanoVasoId)
    setTamanoVasoId(siguienteDisponible?.id ?? '')
  }

  function handleQuitarTamano(idAQuitar: string) {
    setTamanos((actual) => actual.filter((fila) => fila.tamanoVasoId !== idAQuitar))
  }

  function etiquetaTamano(idTamano: string): string {
    const tamano = tamanosVaso.find((t) => t.id === idTamano)
    return tamano ? `${tamano.etiqueta} (${tamano.onzas} oz)` : idTamano
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (tamanos.length === 0) {
      setError(
        'Agrega al menos un tamaño de vaso con su precio antes de guardar el producto (RN-011).',
      )
      return
    }

    const ok = await confirmar({
      titulo: 'Crear producto',
      mensaje: `¿Confirmas crear el producto "${nombre}" con ${tamanos.length} tamaño(s) configurado(s)?`,
      textoConfirmar: 'Crear producto',
    })
    if (!ok) return

    setEnviando(true)
    try {
      await onCrear({ nombre }, tamanos)
      setNombre('')
      setTamanos([])
      setPrecioBorrador('')
      setTamanoVasoId(tamanosVaso[0]?.id ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el producto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <GlassCard padding={22}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nuevo Producto</h3>

        <Input
          label="Nombre del producto"
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Ceviche de Camarón, Burtgos..."
          required
        />

        <div
          style={{
            background: 'var(--input-bg)',
            border: '1px dashed var(--input-border)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Tamaños y Precios
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
              {tamanos.length} configurado(s)
            </span>
          </div>

          {tamanos.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Todavía no has agregado ningún tamaño para este producto.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tamanos.map((fila) => (
                <div
                  key={fila.tamanoVasoId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    background: 'var(--glass-card-bg)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 8,
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{etiquetaTamano(fila.tamanoVasoId)}</span>
                  <span style={{ color: 'var(--brand-red)', fontWeight: 700 }}>
                    ${fila.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuitarTamano(fila.tamanoVasoId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--brand-red)',
                      fontWeight: 700,
                      padding: '0 2px',
                    }}
                    title="Quitar tamaño"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {tamanosDisponibles.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--brand-green)', fontWeight: 600 }}>
              ✓ Ya agregaste todos los tamaños disponibles.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                paddingTop: 8,
                borderTop: '1px solid var(--hr-line)',
              }}
            >
              <div style={{ flex: '1 1 180px' }}>
                <Select
                  label="Tamaño de vaso"
                  id="tamano_vaso_id"
                  value={tamanoVasoId}
                  onChange={(e) => setTamanoVasoId(e.target.value)}
                  options={tamanosDisponibles.map((tamano) => ({
                    value: tamano.id,
                    label: `${tamano.etiqueta} (${tamano.onzas} oz)`,
                  }))}
                />
              </div>

              <div style={{ width: 130 }}>
                <Input
                  label="Precio ($)"
                  id="precio_borrador"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={precioBorrador}
                  onChange={(e) => setPrecioBorrador(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleAgregarTamano}
                disabled={!tamanoVasoId || !precioBorrador}
              >
                + Agregar
              </Button>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13, fontWeight: 600 }}>
            {error}
          </p>
        )}

        <div>
          <Button type="submit" variant="primary" size="md" disabled={enviando || tamanos.length === 0}>
            {enviando ? 'Creando…' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
