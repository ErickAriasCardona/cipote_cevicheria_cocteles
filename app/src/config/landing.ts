export const WHATSAPP_NUMBER = '573145499206'

export const SIZES = ['7oz', '9oz', '12oz', '16oz'] as const
export type SizeOption = (typeof SIZES)[number]

export interface ProductoLanding {
  id: string
  name: string
  subtitle: string
  rating: string
  image: string
  prices: Record<SizeOption, number>
}

export const PRODUCTS: Record<string, ProductoLanding> = {
  ceviche: {
    id: 'ceviche',
    name: 'Ceviche de camarón',
    subtitle: 'Limón, cebolla morada y cilantro',
    rating: '4.8',
    image: '/landing/coctel_002.jpg',
    prices: {
      '7oz': 22000,
      '9oz': 25000,
      '12oz': 28000,
      '16oz': 34000,
    },
  },
  burtgos: {
    id: 'burtgos',
    name: 'Burtgos',
    subtitle: 'Nuestra mezcla insignia',
    rating: '4.9',
    image: '/landing/coctel_001.jpg',
    prices: {
      '7oz': 26000,
      '9oz': 29000,
      '12oz': 32000,
      '16oz': 38000,
    },
  },
  coctel: {
    id: 'coctel',
    name: 'Cóctel de camarón',
    subtitle: 'La salsa clásica cipote, bien fría',
    rating: '4.7',
    image: '/landing/coctel_005.jpg',
    prices: {
      '7oz': 20000,
      '9oz': 23000,
      '12oz': 26000,
      '16oz': 32000,
    },
  },
}

export const BURTGOS_FEATURE = {
  id: 'burtgos-feature',
  productId: 'burtgos',
  title: 'El Burtgos, nuestra receta insignia',
  name: 'Burtgos',
  prepTime: '5 min',
  description:
    'Camarón, salsa cipote y toques cítricos servidos bien fríos. Disponible desde 1oz hasta 9oz, para llevar o disfrutar en el local.',
  image: '/landing/coctel_004.jpg',
  defaultSize: '9oz' as SizeOption,
  prices: PRODUCTS.burtgos.prices,
}

export const fmtCOP = (n: number) => '$' + n.toLocaleString('es-CO')
