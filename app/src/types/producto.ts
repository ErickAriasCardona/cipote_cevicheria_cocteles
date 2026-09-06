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
export interface Producto {
  id: string
  nombre: string
  /** Precio único que tenía el producto antes de esta corrección. Ya no es
   * el precio de venta (esa lógica vive en `producto_tamano_precio`): se
   * conserva solo como referencia visual para que el Administrador sepa
   * cuánto cobraba antes al reconfigurar el producto por tamaño. */
  precioLegado: number | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

/** Payload para dar de alta un producto (HU-03.1). Ya no incluye `precio`:
 * el precio se agrega por tamaño, vía `producto_tamano_precio`, en la misma
 * acción de "Guardar producto" (ver `ProductoForm.tsx`). */
export interface CrearProductoInput {
  nombre: string
}

/** Cambios permitidos sobre un producto ya existente. */
export interface ActualizarProductoInput {
  nombre?: string
  activo?: boolean
}
