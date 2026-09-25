import type { CategoriaProducto } from './producto'

export interface OpcionTamanoPrecio {
  tamanoVasoId: string
  etiqueta: string
  onzas: number | null
  mililitros: number | null
  categoria: string
  precio: number
}

export interface ProductoCarta {
  id: string
  nombre: string
  categoria: CategoriaProducto
  descripcion: string | null
  imagenUrl: string | null
  precioDirecto: number | null
  tamanos: OpcionTamanoPrecio[]
  rating: string
}

export interface PromocionCarta {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  imagenUrl: string | null
  activo: boolean
}

export interface DatosCarta {
  ceviches: ProductoCarta[]
  granizados: ProductoCarta[]
  bebidas: ProductoCarta[]
  otros: ProductoCarta[]
  adicionales: ProductoCarta[]
  promociones: PromocionCarta[]
  todos: ProductoCarta[]
}
