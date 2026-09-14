import { useEffect, useState, useCallback } from 'react'
import { cartaService } from '../services/cartaService'
import type { DatosCarta } from '../types/carta'

export function useCarta() {
  const [datos, setDatos] = useState<DatosCarta | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await cartaService.obtenerDatosCarta()
      setDatos(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la carta')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { datos, cargando, error, recargar: cargar }
}
