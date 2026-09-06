import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export interface CarritoItem {
  id: string
  key: string
  name: string
  size: string
  unitPrice: number
  qty: number
  emoji?: string
}

interface CarritoContextValue {
  items: CarritoItem[]
  total: number
  totalCount: number
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  toggleDrawer: () => void
  addToCart: (item: Omit<CarritoItem, 'qty' | 'key'>, qty?: number) => void
  inc: (key: string) => void
  dec: (key: string) => void
  remove: (key: string) => void
  clearCart: () => void
}

const STORAGE_KEY = 'cipote_cart_items'

const CarritoContext = createContext<CarritoContextValue | null>(null)

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CarritoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignorar errores en navegadores con cuota restringida
    }
  }, [items])

  function addToCart(item: Omit<CarritoItem, 'qty' | 'key'>, qty = 1) {
    const key = `${item.id}-${item.size}`
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.key === key)
      if (existingIndex >= 0) {
        const copy = [...prev]
        copy[existingIndex] = {
          ...copy[existingIndex],
          qty: copy[existingIndex].qty + qty,
        }
        return copy
      }
      return [...prev, { ...item, key, qty }]
    })
    setDrawerOpen(true)
  }

  function inc(key: string) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, qty: item.qty + 1 } : item)),
    )
  }

  function dec(key: string) {
    setItems((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    )
  }

  function remove(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  function clearCart() {
    setItems([])
  }

  function toggleDrawer() {
    setDrawerOpen((prev) => !prev)
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  const totalCount = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <CarritoContext.Provider
      value={{
        items,
        total,
        totalCount,
        drawerOpen,
        setDrawerOpen,
        toggleDrawer,
        addToCart,
        inc,
        dec,
        remove,
        clearCart,
      }}
    >
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito(): CarritoContextValue {
  const ctx = useContext(CarritoContext)
  if (!ctx) {
    throw new Error('useCarrito debe usarse dentro de un CarritoProvider')
  }
  return ctx
}
