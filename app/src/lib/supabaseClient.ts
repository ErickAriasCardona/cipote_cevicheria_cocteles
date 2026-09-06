import { createClient } from '@supabase/supabase-js'

/**
 * Cliente único de Supabase para todo el frontend.
 *
 * Usa exclusivamente VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
 * La `service_role key` NUNCA debe usarse aquí ni en ningún archivo bajo `app/src`:
 * vive únicamente en el entorno de ejecución de las Edge Functions
 * (ver supabase/functions/crear-usuario/index.ts y guía de Poseidon sección 8.5).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Verifica app/.env.local ' +
      '(ver app/.env.example para el formato esperado).',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
