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
}
