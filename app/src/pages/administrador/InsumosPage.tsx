import { useCallback, useEffect, useState } from 'react'
import { InsumoForm } from '../../components/insumos/InsumoForm'
import { InsumosTable } from '../../components/insumos/InsumosTable'
import { InventarioInicialForm } from '../../components/insumos/InventarioInicialForm'
import { useSession } from '../../hooks/useSession'
import { insumosService } from '../../services/insumosService'
import { movimientosInventarioService } from '../../services/movimientosInventarioService'
import type { CrearInsumoInput, Insumo } from '../../types/insumo'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

/**
 * Pantalla de gestión de insumos (BD-02.3, RF-04.1/HU-04.1 y RF-04.2/HU-04.2).
 */
export function InsumosPage() {
  const { usuario } = useSession()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarInsumos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await insumosService.listarInsumos()
      setInsumos(lista)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el listado de insumos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarInsumos()
  }, [cargarInsumos])

  async function handleCrear(input: CrearInsumoInput) {
    await insumosService.crearInsumo(input)
    await cargarInsumos()
  }

  async function handleCambiarActivo(id: string, activo: boolean) {
    await insumosService.actualizarInsumo(id, { activo })
    await cargarInsumos()
  }

  async function handleRegistrarInventarioInicial(input: {
    insumoId: string
    cantidad: number
    observaciones?: string
  }) {
    if (!usuario) throw new Error('Sesión no resuelta; recarga la página e intenta de nuevo.')
    await movimientosInventarioService.registrarInventarioInicial({
      insumoId: input.insumoId,
      cantidad: input.cantidad,
      usuarioId: usuario.usuarioId,
      observaciones: input.observaciones,
    })
    await cargarInsumos()
  }

  const insumosVaso = insumos.filter((insumo) => insumo.tipo === 'vaso' && insumo.activo)

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Gestión de Insumos
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Administra los ingredientes, vasos y el conteo de inventario diario.
          </p>
        </div>

        <InsumoForm onCrear={handleCrear} />

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        <GlassCard padding={20}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Insumos Registrados</h3>
          {cargando ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando insumos…</p>
          ) : (
            <InsumosTable insumos={insumos} onCambiarActivo={handleCambiarActivo} />
          )}
        </GlassCard>

        <GlassCard tint="blue" padding={20}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
              Inventario Inicial de Vasos
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              Registra el conteo inicial de vasos por tamaño (una vez por insumo por día). El stock actual del insumo queda fijado al valor contado.
            </p>
          </div>

          {!cargando && (
            <InventarioInicialForm
              insumosVaso={insumosVaso}
              onRegistrar={handleRegistrarInventarioInicial}
            />
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
