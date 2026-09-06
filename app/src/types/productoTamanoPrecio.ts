/**
 * Espejo tipado de la tabla `producto_tamano_precio` (RF-03.1, RN-011,
 * corrección quinta ronda 2026-09-05). Ver
 * DOCUMENTACION/Product Backlog/Catalogo-Productos/
 * MODELO_DATOS_2026-09-05_precio-producto-tamano.md.
 *
 * Reemplaza el antiguo `Producto.precio` único: el precio de venta ahora
 * depende de la combinación producto x tamaño de vaso. Un producto se
 * considera "configurado" (HU-03.1 CA-04) si tiene al menos una fila con
 * `activo=true` aquí.
 */
export interface ProductoTamanoPrecio {
  productoId: string
  tamanoVasoId: string
  precio: number
  activo: boolean
  createdAt: string
  updatedAt: string
}

/** Tamaño+precio capturado en el formulario de alta de un producto, antes de
 * que el producto tenga `id` (HU-03.1 CA-01/CA-04): se persiste junto con el
 * producto recién creado, en la misma acción de "Guardar producto". */
export interface NuevoTamanoPrecioInput {
  tamanoVasoId: string
  precio: number
}

/** Payload para agregar un tamaño+precio a un producto ya existente
 * (HU-03.1 CA-02). */
export interface CrearProductoTamanoPrecioInput extends NuevoTamanoPrecioInput {
  productoId: string
}

/** Cambios permitidos sobre una combinación producto+tamaño ya existente:
 * cambiar el precio, o "quitar"/reponer el tamaño con `activo` (nunca DELETE,
 * no hay política que lo permita — ver migración
 * 20260905000001_producto_tamano_precio.sql). */
export interface ActualizarProductoTamanoPrecioInput {
  precio?: number
  activo?: boolean
}
