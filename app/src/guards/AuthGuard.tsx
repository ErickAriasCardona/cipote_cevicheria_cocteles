import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

/**
 * Redirige a /login si no hay sesión válida (BD-01.4).
 * No decide nada de rol — eso es responsabilidad de RoleGuard.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useSession()

  if (cargando) return null
  if (!usuario) return <Navigate to="/login" replace />

  return <>{children}</>
}
