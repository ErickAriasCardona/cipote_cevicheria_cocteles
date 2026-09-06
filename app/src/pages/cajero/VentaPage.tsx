import { useCallback, useEffect, useState } from 'react'
import { VentaForm } from '../../components/ventas/VentaForm'
import { cajaService } from '../../services/cajaService'
import { productoTamanoPrecioService } from '../../services/productoTamanoPrecioService'
import { productosService } from '../../services/productosService'
import { ventasService } from '../../services/ventasService'
import type { Producto } from '../../types/producto'
import type { ProductoTamanoPrecio } from '../../types/productoTamanoPrecio'
import type { TamanoVaso } from '../../types/tamanoVaso'
import type { RegistrarVentaInput } from '../../types/venta'
import type { TurnoCaja } from '../../types/turnoCaja'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'
import { Link } from 'react-router-dom'

/**
 * POS de ventas (BD-04.3/04.4/04.5, RF-03.2 a RF-03.4). Exige un turno de
 * caja abierto propio.
 */
export function VentaPage() {
  const [turno, setTurno] = useState<TurnoCaja | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [tamanosVaso, setTamanosVaso] = useState<TamanoVaso[]>([])
  const [preciosPorTamano, setPreciosPorTamano] = useState<ProductoTamanoPrecio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [turnoAbierto, listaProductos, listaTamanosVaso, listaPrecios] = await Promise.all([
        cajaService.obtenerTurnoAbierto(),
        productosService.listarProductos(),
        ventasService.listarTamanosVasoActivos(),
        productoTamanoPrecioService.listarActivos(),
      ])
      setTurno(turnoAbierto)
      setProductos(listaProductos.filter((producto) => producto.activo))
      setTamanosVaso(listaTamanosVaso)
      setPreciosPorTamano(listaPrecios)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el POS de ventas.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  async function handleRegistrar(input: RegistrarVentaInput) {
    await ventasService.registrarVenta(input)
  }

  return (
    <AppShell>
      {error && (
        <p role="alert" style={{ color: 'var(--red-text)', fontWeight: 600, marginBottom: 16 }}>
          {error}
        </p>
      )}

      {cargando ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px 32px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cargando POS de ventas…</p>
        </GlassCard>
      ) : !turno ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px 32px', maxWidth: 540, margin: '20px auto' }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px', color: 'var(--text-primary)' }}>Turno no abierto</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            No tienes un turno de caja abierto. Debes abrir caja antes de registrar una venta.
          </p>
          <Link to="/cajero" style={{ textDecoration: 'none' }}>
            <span style={{ color: 'var(--brand-blue)', fontWeight: 700, textDecoration: 'underline' }}>
              Ir al panel de caja para abrir turno →
            </span>
          </Link>
        </GlassCard>
      ) : (
        <VentaForm
          productos={productos}
          tamanosVaso={tamanosVaso}
          preciosPorTamano={preciosPorTamano}
          onRegistrar={handleRegistrar}
        />
      )}
    </AppShell>
  )
}
