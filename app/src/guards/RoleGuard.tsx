import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import type { Rol } from '../types/auth'

interface RoleGuardProps {
  rolesPermitidos: Rol[]
  children: ReactNode
}

/**
 * Aplica RN-001/RN-002 a nivel de enrutamiento (BD-01.4): si el rol activo
 * no está en `rolesPermitidos`, redirige a una página de "no autorizado".
 * Debe usarse siempre dentro de AuthGuard (asume que ya hay sesión).
 */
export function RoleGuard({ rolesPermitidos, children }: RoleGuardProps) {
  const { rol, cargando } = useSession()

  if (cargando) return null
  if (!rol || !rolesPermitidos.includes(rol)) {
    return <Navigate to="/no-autorizado" replace />
  }

  return <>{children}</>
}
