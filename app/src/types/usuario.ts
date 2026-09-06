import type { Rol } from './auth'

/**
 * Espejo tipado de la tabla `usuarios_perfil` (1:1 con auth.users).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 1.
 */
export interface UsuarioPerfil {
  id: string
  nombreCompleto: string
  rol: Rol
  activo: boolean
  createdAt: string
  updatedAt: string
}

/** Payload para dar de alta un usuario nuevo (RF-01.1, HU-01.1). */
export interface CrearUsuarioInput {
  nombreCompleto: string
  email: string
  password: string
  rol: Rol
}

/** Cambios permitidos sobre un usuario ya existente (rol y/o activo). */
export interface ActualizarUsuarioInput {
  nombreCompleto?: string
  rol?: Rol
  activo?: boolean
}
