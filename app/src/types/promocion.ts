export interface Promocion {
  id: string
  nombre: string
  precio: number
  imagenUrl: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface PromocionProductoItem {
  productoId: string
  nombreProducto: string
  categoriaProducto: string
  tamanoVasoId: string | null
  etiquetaTamano: string | null
  cantidad: number
}

export interface PromocionConDetalle extends Promocion {
  componentes: PromocionProductoItem[]
}

export interface ComponentePromocionInput {
  productoId: string
  tamanoVasoId?: string | null
  cantidad: number
}

export interface CrearPromocionInput {
  nombre: string
  precio: number
  imagenUrl?: string | null
  componentes: ComponentePromocionInput[]
}
