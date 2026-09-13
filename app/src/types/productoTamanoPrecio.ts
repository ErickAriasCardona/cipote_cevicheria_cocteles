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
 * producto recién creado, en la misma acción de "Guardar producto".
 *
 * Ajuste (ticket post-MVP "Relacionar categoría de producto con tipo de
 * insumo", 2026-09-12): el borrador ya no identifica el tamaño por
 * `tamanoVasoId` -- ese id puede no existir todavía, porque las opciones de
 * tamaño/presentación ahora se derivan en vivo de `insumos` (tipoUnidad +
 * valorUnidad para el tipo de insumo relacionado a la categoría, ver
 * `utils/unidadMedida.ts`). La fila de `tamanos_vaso` real se resuelve (o se
 * crea de una vez si no existe) recién al guardar, vía
 * `tamanoVasoService.resolverOCrear` -- ver `ProductosPage.tsx`. */
export interface NuevoTamanoPrecioInput {
  tipoUnidad: string
  valorUnidad: number
  precio: number
}

/** Igual que `NuevoTamanoPrecioInput` pero para agregar un tamaño+precio a un
 * producto YA EXISTENTE (HU-03.1 CA-02): necesita `productoId` para saber a
 * cuál producto (y su categoría) resolver la fila de `tamanos_vaso`. */
export interface ComboTamanoPrecioInput extends NuevoTamanoPrecioInput {
  productoId: string
}

/** Payload final, ya resuelto contra una fila real de `tamanos_vaso`, que
 * consume `productoTamanoPrecioService.crear` (sin cambios: la tabla
 * `producto_tamano_precio` sigue referenciando `tamano_vaso_id`, RN-011). */
export interface CrearProductoTamanoPrecioInput {
  productoId: string
  tamanoVasoId: string
  precio: number
}

/** Cambios permitidos sobre una combinación producto+tamaño ya existente:
 * cambiar el precio, o "quitar"/reponer el tamaño con `activo` (nunca DELETE,
 * no hay política que lo permita — ver migración
 * 20260905000001_producto_tamano_precio.sql). */
export interface ActualizarProductoTamanoPrecioInput {
  precio?: number
  activo?: boolean
}
