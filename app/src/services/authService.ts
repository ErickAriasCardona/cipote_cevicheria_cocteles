import { supabase } from '../lib/supabaseClient'

/**
 * Servicio de autenticación (BD-01.4). Envuelve supabase.auth para que
 * el resto de la aplicación nunca importe el cliente de Supabase directamente.
 * No contiene lógica de negocio: solo delega en Supabase Auth (RF-01.1/RF-01.2).
 */
export const authService = {
  async iniciarSesion(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async cerrarSesion() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async obtenerSesionActual() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async solicitarRecuperacion(email: string) {
    try {
      const { data, error } = await supabase.functions.invoke('recuperar-password', {
        body: { email },
      })
      if (!error && data?.ok) {
        return { ok: true, mensaje: data.mensaje ?? 'Correo de recuperación enviado.' }
      }
    } catch {
      // Fallback a resetPasswordForEmail
    }

    const frontendUrl = window.location.origin
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl}/login?recovery=true`,
    })
    if (error) throw error
    return { ok: true, data }
  },

  async actualizarContrasena(nuevaContrasena: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: nuevaContrasena,
    })
    if (error) throw error
    return data
  },
}

