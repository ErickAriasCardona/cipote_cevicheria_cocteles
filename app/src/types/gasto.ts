export type OrigenGasto = 'caja' | 'administracion'
export type EstadoPagoGasto = 'pagado' | 'no_pagado'

export interface Gasto {
  id: string
  categoriaId: string
  descripcion: string
  monto: number
  fecha: string
  registradoPor: string
  origen: OrigenGasto
  estadoPago: EstadoPagoGasto
  turnoId: string | null
  createdAt: string
  updatedAt: string
  categoriaNombre: string
}

export interface CrearGastoInput {
  categoriaId: string
  descripcion: string
  monto: number
  fecha?: string
  origen?: OrigenGasto
  estadoPago?: EstadoPagoGasto
  turnoId?: string | null
}

export interface ActualizarGastoInput {
  categoriaId?: string
  descripcion?: string
  monto?: number
  origen?: OrigenGasto
  estadoPago?: EstadoPagoGasto
  motivoEdicion?: string
}

export interface GastoHistorialEdicion {
  id: string
  gastoId: string
  montoAnterior: number
  montoNuevo: number
  descripcionAnterior: string
  descripcionNueva: string
  categoriaIdAnterior: string
  categoriaIdNueva: string
  modificadoPor: string
  motivoEdicion: string | null
  estadoPagoAnterior?: string | null
  estadoPagoNuevo?: string | null
  origenAnterior?: string | null
  origenNuevo?: string | null
  createdAt: string
}
