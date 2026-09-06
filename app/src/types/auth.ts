/**
 * Tipos del dominio de autenticación y control de acceso por rol.
 *
 * Fuente de verdad: usuarios_perfil.rol (CHECK 'administrador' | 'cajero').
 * Ver DOCUMENTACION/Product Backlog/MVP/MODELO_DATOS_MVP_1.0_2026-08-30.md
 * (sección 2.2, "MER — Dominio Seguridad y Acceso").
 *
 * RF-01.3 (rol Root, Fase 2) no se modela aquí — ver ARQUITECTURA_MVP_1.0_2026-08-30.md
 * sección 6.1: cuando se construya, este tipo se ampliará sin romper el mecanismo
 * de RLS estático ya vigente.
 */

export type Rol = 'administrador' | 'cajero'

export interface SesionActiva {
  usuarioId: string
  email: string
  rol: Rol
  nombreCompleto: string
  activo: boolean
}
