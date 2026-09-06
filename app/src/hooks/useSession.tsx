import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Rol, SesionActiva } from '../types/auth'

/**
 * Contexto de sesión activa (BD-01.4).
 *
 * Nota de implementación: el plan de desarrollo listaba este archivo como
 * `hooks/useSession.ts`; se usa extensión `.tsx` porque el Provider necesita
 * JSX. Mismo archivo, mismo propósito y ubicación — ajuste técnico menor,
 * no una desviación de arquitectura.
 *
 * Tras cada cambio de `onAuthStateChange`, resuelve el perfil en
 * `usuarios_perfil` (rol, nombre, activo) para exponerlo junto con la sesión
 * de Supabase Auth. Mientras no se resuelva, `cargando = true`.
 */

interface SesionContextValue {
  usuario: SesionActiva | null
  rol: Rol | null
  cargando: boolean
}

const SesionContext = createContext<SesionContextValue>({
  usuario: null,
  rol: null,
  cargando: true,
})

async function resolverPerfil(userId: string, email: string): Promise<SesionActiva | null> {
  const { data, error } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, rol, activo')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    usuarioId: data.id,
    email,
    rol: data.rol,
    nombreCompleto: data.nombre_completo,
    activo: data.activo,
  }
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<SesionActiva | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    async function inicializar() {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (session?.user) {
        const perfil = await resolverPerfil(session.user.id, session.user.email ?? '')
        if (activo) setUsuario(perfil)
      }
      if (activo) setCargando(false)
    }

    inicializar()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUsuario(null)
        setCargando(false)
        return
      }
      setCargando(true)
      const perfil = await resolverPerfil(session.user.id, session.user.email ?? '')
      if (activo) {
        setUsuario(perfil)
        setCargando(false)
      }
    })

    return () => {
      activo = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return (
    <SesionContext.Provider value={{ usuario, rol: usuario?.rol ?? null, cargando }}>
      {children}
    </SesionContext.Provider>
  )
}

export function useSession(): SesionContextValue {
  return useContext(SesionContext)
}
