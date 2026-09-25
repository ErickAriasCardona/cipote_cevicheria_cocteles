import { supabase } from '../lib/supabaseClient'
import type { DatosCarta, OpcionTamanoPrecio, ProductoCarta, PromocionCarta } from '../types/carta'

const FALLBACK_CEVICHES: ProductoCarta[] = [
  {
    id: 'fallback-ceviche',
    nombre: 'Ceviche de camarón',
    categoria: 'ceviche',
    descripcion: 'Limón, cebolla morada y cilantro fresco con el auténtico toque costeño.',
    imagenUrl: '/landing/coctel_002.jpg',
    precioDirecto: null,
    rating: '4.8',
    tamanos: [
      { tamanoVasoId: 'sz-7', etiqueta: '7oz', onzas: 7, mililitros: null, categoria: 'ceviche', precio: 22000 },
      { tamanoVasoId: 'sz-9', etiqueta: '9oz', onzas: 9, mililitros: null, categoria: 'ceviche', precio: 25000 },
      { tamanoVasoId: 'sz-12', etiqueta: '12oz', onzas: 12, mililitros: null, categoria: 'ceviche', precio: 28000 },
      { tamanoVasoId: 'sz-16', etiqueta: '16oz', onzas: 16, mililitros: null, categoria: 'ceviche', precio: 34000 },
    ],
  },
  {
    id: 'fallback-coctel',
    nombre: 'Cóctel de camarón',
    categoria: 'ceviche',
    descripcion: 'Salsa clásica cipote bien fría, camarones seleccionados y galletas.',
    imagenUrl: '/landing/coctel_005.jpg',
    precioDirecto: null,
    rating: '4.7',
    tamanos: [
      { tamanoVasoId: 'sz-7', etiqueta: '7oz', onzas: 7, mililitros: null, categoria: 'ceviche', precio: 20000 },
      { tamanoVasoId: 'sz-9', etiqueta: '9oz', onzas: 9, mililitros: null, categoria: 'ceviche', precio: 23000 },
      { tamanoVasoId: 'sz-12', etiqueta: '12oz', onzas: 12, mililitros: null, categoria: 'ceviche', precio: 26000 },
      { tamanoVasoId: 'sz-16', etiqueta: '16oz', onzas: 16, mililitros: null, categoria: 'ceviche', precio: 32000 },
    ],
  },
]

const FALLBACK_GRANIZADOS: ProductoCarta[] = [
  {
    id: 'fallback-burtgos',
    nombre: 'Burtgos',
    categoria: 'granizado',
    descripcion: 'Nuestra mezcla insignia granizada con toques cítricos refrescantes.',
    imagenUrl: '/landing/coctel_001.jpg',
    precioDirecto: null,
    rating: '4.9',
    tamanos: [
      { tamanoVasoId: 'sz-g7', etiqueta: '7oz', onzas: 7, mililitros: null, categoria: 'granizado', precio: 15000 },
      { tamanoVasoId: 'sz-g9', etiqueta: '9oz', onzas: 9, mililitros: null, categoria: 'granizado', precio: 18000 },
      { tamanoVasoId: 'sz-g12', etiqueta: '12oz', onzas: 12, mililitros: null, categoria: 'granizado', precio: 22000 },
      { tamanoVasoId: 'sz-g16', etiqueta: '16oz', onzas: 16, mililitros: null, categoria: 'granizado', precio: 27000 },
    ],
  },
  {
    id: 'fallback-granizado-maracuya',
    nombre: 'Granizado Maracuyá',
    categoria: 'granizado',
    descripcion: 'Pura fruta natural con textura de nieve suave y hielo frappé.',
    imagenUrl: '/landing/coctel_004.jpg',
    precioDirecto: null,
    rating: '4.8',
    tamanos: [
      { tamanoVasoId: 'sz-g7', etiqueta: '7oz', onzas: 7, mililitros: null, categoria: 'granizado', precio: 12000 },
      { tamanoVasoId: 'sz-g9', etiqueta: '9oz', onzas: 9, mililitros: null, categoria: 'granizado', precio: 15000 },
      { tamanoVasoId: 'sz-g12', etiqueta: '12oz', onzas: 12, mililitros: null, categoria: 'granizado', precio: 18000 },
    ],
  },
]

const FALLBACK_BEBIDAS: ProductoCarta[] = [
  {
    id: 'fallback-coca-cola',
    nombre: 'Coca - Cola',
    categoria: 'bebida',
    descripcion: 'Bien helada para acompañar tus ceviches.',
    imagenUrl: '/landing/coctel_003.jpg',
    precioDirecto: 5000,
    rating: '4.9',
    tamanos: [
      { tamanoVasoId: 'sz-b300', etiqueta: '300ml', onzas: null, mililitros: 300, categoria: 'bebida', precio: 4000 },
      { tamanoVasoId: 'sz-b400', etiqueta: '400ml', onzas: null, mililitros: 400, categoria: 'bebida', precio: 5000 },
    ],
  },
]

const FALLBACK_PROMOS: PromocionCarta[] = [
  {
    id: 'fallback-promo-1',
    nombre: 'Combo Pareja Cipote',
    descripcion: '2 Ceviches medianos + 2 Granizados 7oz a precio especial de fin de semana.',
    precio: 48000,
    imagenUrl: '/landing/coctel_004.jpg',
    activo: true,
  },
  {
    id: 'fallback-promo-2',
    nombre: 'Super Burtgos + Bebida',
    descripcion: '1 Burtgos grande 12oz + 1 Coca-Cola 400ml helada con descuento.',
    precio: 25000,
    imagenUrl: '/landing/coctel_001.jpg',
    activo: true,
  },
]

function defaultImageFor(cat: string, index: number): string {
  const images = [
    '/landing/coctel_001.jpg',
    '/landing/coctel_002.jpg',
    '/landing/coctel_003.jpg',
    '/landing/coctel_004.jpg',
    '/landing/coctel_005.jpg',
  ]
  if (cat === 'ceviche') return images[index % 2 === 0 ? 1 : 4]
  if (cat === 'granizado') return images[index % 2 === 0 ? 0 : 3]
  if (cat === 'bebida') return '/landing/coctel_003.jpg'
  return images[index % images.length]
}

export const cartaService = {
  async obtenerDatosCarta(): Promise<DatosCarta> {
    try {
      const [prodsRes, ptpRes, tamanosRes, promosRes] = await Promise.all([
        supabase.from('productos').select('*').eq('activo', true).eq('en_carta', true).order('nombre'),
        supabase.from('producto_tamano_precio').select('*').eq('activo', true),
        supabase.from('tamanos_vaso').select('*').eq('activo', true),
        supabase.from('promociones').select('*').eq('activo', true).order('nombre'),
      ])

      const rawProds = prodsRes.data || []
      const rawPtp = ptpRes.data || []
      const rawTamanos = tamanosRes.data || []
      const rawPromos = promosRes.data || []

      // Si la base de datos no tiene productos aún, usamos el fallback
      if (rawProds.length === 0) {
        return {
          ceviches: FALLBACK_CEVICHES,
          granizados: FALLBACK_GRANIZADOS,
          bebidas: FALLBACK_BEBIDAS,
          otros: [],
          adicionales: [],
          promociones: FALLBACK_PROMOS,
          todos: [...FALLBACK_CEVICHES, ...FALLBACK_GRANIZADOS, ...FALLBACK_BEBIDAS],
        }
      }

      // Mapa de tamaños de vaso
      const tamanosMap = new Map<string, { etiqueta: string; onzas: number | null; mililitros: number | null; categoria: string }>()
      for (const t of rawTamanos) {
        tamanosMap.set(t.id, {
          etiqueta: t.etiqueta,
          onzas: t.onzas ? Number(t.onzas) : null,
          mililitros: t.mililitros ? Number(t.mililitros) : null,
          categoria: t.categoria,
        })
      }

      // Precios por producto
      const ptpByProd = new Map<string, OpcionTamanoPrecio[]>()
      for (const row of rawPtp) {
        const tamano = tamanosMap.get(row.tamano_vaso_id)
        if (!tamano) continue
        const item: OpcionTamanoPrecio = {
          tamanoVasoId: row.tamano_vaso_id,
          etiqueta: tamano.etiqueta,
          onzas: tamano.onzas,
          mililitros: tamano.mililitros,
          categoria: tamano.categoria,
          precio: Number(row.precio),
        }
        const arr = ptpByProd.get(row.producto_id) || []
        arr.push(item)
        ptpByProd.set(row.producto_id, arr)
      }

      // Mapear productos
      const productosMap: ProductoCarta[] = rawProds.map((p, idx) => {
        const tamanos = (ptpByProd.get(p.id) || []).sort((a, b) => {
          if (a.onzas && b.onzas) return a.onzas - b.onzas
          if (a.mililitros && b.mililitros) return a.mililitros - b.mililitros
          return a.etiqueta.localeCompare(b.etiqueta)
        })

        const precioDirecto = p.precio ? Number(p.precio) : p.precio_legado ? Number(p.precio_legado) : null
        const imagenUrl = p.imagen_url || defaultImageFor(p.categoria, idx)
        const rating = (4.7 + ((idx % 3) * 0.1)).toFixed(1)

        return {
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoria,
          descripcion: p.descripcion || (p.categoria === 'ceviche' ? 'Camarones frescos con receta tradicional' : p.categoria === 'granizado' ? 'Refrescante y preparado al momento' : p.categoria === 'adicionales' ? 'Adicional fresco para complementar tu pedido' : 'Acompañamiento ideal'),
          imagenUrl,
          precioDirecto,
          tamanos,
          rating,
        }
      })

      const ceviches = productosMap.filter((p) => p.categoria === 'ceviche')
      const granizados = productosMap.filter((p) => p.categoria === 'granizado')
      const bebidas = productosMap.filter((p) => p.categoria === 'bebida')
      const otros = productosMap.filter((p) => p.categoria === 'otro')
      const adicionales = productosMap.filter((p) => p.categoria === 'adicionales')

      // Promociones
      const promociones: PromocionCarta[] = rawPromos.map((pr, idx) => ({
        id: pr.id,
        nombre: pr.nombre,
        descripcion: pr.descripcion || 'Combo especial con precio promocional.',
        precio: Number(pr.precio),
        imagenUrl: pr.imagen_url || (idx % 2 === 0 ? '/landing/coctel_004.jpg' : '/landing/coctel_001.jpg'),
        activo: pr.activo,
      }))

      // Si la base de datos contiene productos reales, devolvemos exclusivamente los datos reales de la BD
      return {
        ceviches,
        granizados,
        bebidas,
        otros,
        adicionales,
        promociones,
        todos: productosMap,
      }
    } catch (err) {
      console.warn('Error al cargar carta desde Supabase, usando catálogo predeterminado:', err)
      return {
        ceviches: FALLBACK_CEVICHES,
        granizados: FALLBACK_GRANIZADOS,
        bebidas: FALLBACK_BEBIDAS,
        otros: [],
        adicionales: [],
        promociones: FALLBACK_PROMOS,
        todos: [...FALLBACK_CEVICHES, ...FALLBACK_GRANIZADOS, ...FALLBACK_BEBIDAS],
      }
    }
  },
}
