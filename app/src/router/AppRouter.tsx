import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from '../guards/AuthGuard'
import { RoleGuard } from '../guards/RoleGuard'
import { LoginPage } from '../pages/LoginPage'
import { NoAutorizadoPage } from '../pages/NoAutorizadoPage'
import { AdminDashboardPage } from '../pages/administrador/AdminDashboardPage'
import { CierresCajaPage } from '../pages/administrador/CierresCajaPage'
import { GastosPage } from '../pages/administrador/GastosPage'
import { InsumosPage } from '../pages/administrador/InsumosPage'
import { ProductosPage } from '../pages/administrador/ProductosPage'
import { RecetaPage } from '../pages/administrador/RecetaPage'
import { ReportesVentasPage } from '../pages/administrador/ReportesVentasPage'
import { UsuariosPage } from '../pages/administrador/UsuariosPage'
import { VentasPage } from '../pages/administrador/VentasPage'
import { CajeroDashboardPage } from '../pages/cajero/CajeroDashboardPage'
import { CierreCajaPage } from '../pages/cajero/CierreCajaPage'
import { TransferenciasPage } from '../pages/cajero/TransferenciasPage'
import { VentaPage } from '../pages/cajero/VentaPage'
import { LandingPage } from '../pages/publico/LandingPage'

/**
 * Enrutamiento por rol (BD-01.4).
 * `/administrador/*` exige rol administrador; `/cajero/*` acepta administrador
 * o cajero (un Administrador también puede operar como Cajero si el negocio
 * lo requiere; RN-001/RN-002 restringen datos, no navegación entre paneles).
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/no-autorizado" element={<NoAutorizadoPage />} />

      <Route
        path="/administrador"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <AdminDashboardPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/administrador/usuarios"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <UsuariosPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/administrador/productos"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <ProductosPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/administrador/inventario"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <InsumosPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/administrador/receta"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <RecetaPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/administrador/ventas"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <VentasPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/administrador/cierres-caja"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <CierresCajaPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/administrador/gastos"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <GastosPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/administrador/reportes-ventas"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador']}>
              <ReportesVentasPage />
            </RoleGuard>
          </AuthGuard>
        }
      />

      <Route
        path="/cajero"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador', 'cajero']}>
              <CajeroDashboardPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/cajero/venta"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador', 'cajero']}>
              <VentaPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/cajero/transferencias"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador', 'cajero']}>
              <TransferenciasPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/cajero/cierre"
        element={
          <AuthGuard>
            <RoleGuard rolesPermitidos={['administrador', 'cajero']}>
              <CierreCajaPage />
            </RoleGuard>
          </AuthGuard>
        }
      />

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
