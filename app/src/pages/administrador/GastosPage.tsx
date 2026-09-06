import { useCallback, useEffect, useState } from 'react'
import { CategoriaGastoForm } from '../../components/gastos/CategoriaGastoForm'
import { CategoriasGastoTable } from '../../components/gastos/CategoriasGastoTable'
import { GastoForm } from '../../components/gastos/GastoForm'
import { GastosTable } from '../../components/gastos/GastosTable'
import { useSession } from '../../hooks/useSession'
import { categoriasGastoService } from '../../services/categoriasGastoService'
import { gastosService } from '../../services/gastosService'
import type { CategoriaGasto, CrearCategoriaGastoInput } from '../../types/categoriaGasto'
import type { CrearGastoInput, Gasto } from '../../types/gasto'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

/**
 * Pantalla de gestión de gastos (BD-08, RF-05.1/RF-05.2).
 */
export function GastosPage() {
  const { usuario } = useSession()
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaCategorias, listaGastos] = await Promise.all([
        categoriasGastoService.listarCategorias(),
        gastosService.listarGastos(),
      ])
      setCategorias(listaCategorias)
      setGastos(listaGastos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información de gastos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  async function handleCrearCategoria(input: CrearCategoriaGastoInput) {
    if (!usuario) throw new Error('Sesión no resuelta; recarga la página e intenta de nuevo.')
    await categoriasGastoService.crearCategoria(input, usuario.usuarioId)
    await cargarDatos()
  }

  async function handleCambiarActivoCategoria(id: string, activo: boolean) {
    await categoriasGastoService.actualizarCategoria(id, { activo })
    await cargarDatos()
  }

  async function handleRegistrarGasto(input: CrearGastoInput) {
    if (!usuario) throw new Error('Sesión no resuelta; recarga la página e intenta de nuevo.')
    await gastosService.crearGasto(input, usuario.usuarioId)
    await cargarDatos()
  }

  const categoriasActivas = categorias.filter((categoria) => categoria.activo)

  return (
    <AppShell rol="administrador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Control de Gastos
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Registro de egresos operativos y gestión del catálogo de categorías de gasto.
          </p>
        </div>

        {error && (
          <GlassCard tint="red" padding={16}>
            <p role="alert" style={{ margin: 0, color: 'var(--brand-red)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </p>
          </GlassCard>
        )}

        <GlassCard padding={20}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
              Catálogo de Categorías de Gasto
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Clasificaciones para compras, servicios, nómina o arriendos.
            </p>
          </div>

          <CategoriaGastoForm onCrear={handleCrearCategoria} />

          {cargando ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando categorías…</p>
          ) : (
            <CategoriasGastoTable
              categorias={categorias}
              onCambiarActivo={handleCambiarActivoCategoria}
            />
          )}
        </GlassCard>

        <GlassCard tint="blue" padding={20}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
              Registro de Gastos
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Ingresa los desembolsos de dinero vinculándolos a una categoría activa.
            </p>
          </div>

          {!cargando && (
            <GastoForm categoriasActivas={categoriasActivas} onRegistrar={handleRegistrarGasto} />
          )}

          {cargando ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>Cargando gastos…</p>
          ) : (
            <GastosTable gastos={gastos} />
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
