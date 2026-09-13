/**
 * Espejo tipado de la tabla `insumos` (BD-02.3, RF-04.1).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 7.
 *
 * Ajuste (ticket post-MVP "Separar tipo de unidad y valor de unidad",
 * 2026-09-12): `unidad_medida` deja de ser un campo escribible -- ahora es
 * una columna DERIVADA en BD (generated always as, ver migración
 * 20260912000003_insumos_tipo_valor_unidad.sql) calculada desde
 * `tipoUnidad`/`valorUnidad`, los dos campos reales. Se conserva en el tipo
 * `Insumo` (solo lectura) porque varias pantallas la usan como texto para
 * mostrar (InsumosTable, ConteoInventarioDiarioForm, RecetaForm); ya NO
 * aparece en los inputs de creación/edición.
 */
export type TipoInsumo = 'vaso' | 'otro' | string
export type CategoriaVasoInsumo = 'ceviche' | 'granizado'
/** Relación categoría-producto <-> tipo-insumo (ticket post-MVP "Tamaños y
 * Precios"). Espejo de `insumos.categoria_producto`, columna derivada de
 * `tipo` (ver 20260912000004_insumos_categoria_producto.sql). `null` para
 * tipos de insumo que no corresponden a ninguna categoría de producto
 * vendible (ej. Bolsa, Tapa). */
export type CategoriaProductoInsumo = 'ceviche' | 'granizado' | 'bebida'

export interface Insumo {
  id: string
  nombre: string
  tipo: TipoInsumo
  categoriaVaso?: CategoriaVasoInsumo | null
  categoriaProducto?: CategoriaProductoInsumo | null
  tipoUnidad: string
  valorUnidad: number
  /** Derivada de tipoUnidad+valorUnidad (solo lectura, ver comentario de arriba). */
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  stockMinimoDiario: number
  activo: boolean
  createdAt: string
  updatedAt: string
}

/** Payload para dar de alta un insumo (HU-04.1). */
export interface CrearInsumoInput {
  nombre: string
  tipo?: TipoInsumo
  categoriaVaso?: CategoriaVasoInsumo | null
  tipoUnidad?: string
  valorUnidad?: number
  stockActual?: number
  stockMinimo?: number
  stockMinimoDiario?: number
}

/** Cambios permitidos sobre un insumo ya existente. */
export interface ActualizarInsumoInput {
  nombre?: string
  tipo?: TipoInsumo
  categoriaVaso?: CategoriaVasoInsumo | null
  tipoUnidad?: string
  valorUnidad?: number
  stockActual?: number
  stockMinimo?: number
  stockMinimoDiario?: number
  activo?: boolean
}
