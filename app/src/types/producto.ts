/**
 * Espejo tipado de la tabla `productos` (BD-02.2, RF-03.1).
 * Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 5.
 *
 * Ajuste RN-011 (quinta ronda, 2026-09-05): `precio` deja de ser un valor
 * único por producto — el precio de venta ahora se define por combinación
 * producto x tamaño de vaso, ver `types/productoTamanoPrecio.ts`. La columna
 * física se renombró a `precio_legado` (migración
 * `20260905000001_producto_tamano_precio.sql`).
 */
export type CategoriaProducto = 'ceviche' | 'granizado' | 'bebida' | 'otro' | 'adicionales'

export interface Producto {
  id: string
  nombre: string
  categoria: CategoriaProducto
  descripcion: string | null
  precio: number | null
  /** Precio único que tenía el producto antes de la corrección de tamaños. */
  precioLegado: number | null
  imagenUrl?: string | null
  activo: boolean
  /** Si el producto está habilitado para mostrarse en la carta pública de la landing page. */
  enCarta: boolean
  createdAt: string
  updatedAt: string
}

/** Payload para dar de alta un producto (HU-03.1). */
export interface CrearProductoInput {
  nombre: string
  categoria: CategoriaProducto
  descripcion?: string | null
  precio?: number | null
  imagenUrl?: string | null
  enCarta?: boolean
}

/** Cambios permitidos sobre un producto ya existente. */
export interface ActualizarProductoInput {
  nombre?: string
  categoria?: CategoriaProducto
  descripcion?: string | null
  precio?: number | null
  imagenUrl?: string | null
  activo?: boolean
  enCarta?: boolean
}
