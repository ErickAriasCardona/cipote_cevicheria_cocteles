import type { Granularidad, PeriodoAgregado, VentaReporte } from '../types/reporteVentas'

/**
 * Agrupa ventas por día/semana/mes (BD-09.2, RF-06.1). Pura y sin
 * dependencias externas (no se agregó ninguna librería de fechas nueva al
 * proyecto solo para esto): las claves de día/mes son un slice directo del
 * ISO 8601 de `created_at` (ya UTC); la clave de semana usa el cálculo
 * estándar de semana ISO-8601 (semana que contiene al jueves de esa semana
 * define el año-semana).
 */

function claveDia(fechaIso: string): string {
  return fechaIso.slice(0, 10)
}

function claveMes(fechaIso: string): string {
  return fechaIso.slice(0, 7)
}

function claveSemanaIso(fechaIso: string): string {
  const original = new Date(fechaIso)
  const fecha = new Date(
    Date.UTC(original.getUTCFullYear(), original.getUTCMonth(), original.getUTCDate()),
  )
  // Lunes=1 ... Domingo=7 (getUTCDay() da 0 para domingo).
  const diaIso = fecha.getUTCDay() || 7
  // Mueve la fecha al jueves de su semana: el año ISO es el año de ese jueves.
  fecha.setUTCDate(fecha.getUTCDate() + 4 - diaIso)
  const inicioAnio = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1))
  const numeroSemana = Math.ceil(((fecha.getTime() - inicioAnio.getTime()) / 86400000 + 1) / 7)
  return `${fecha.getUTCFullYear()}-W${String(numeroSemana).padStart(2, '0')}`
}

const OBTENER_CLAVE: Record<Granularidad, (fechaIso: string) => string> = {
  dia: claveDia,
  semana: claveSemanaIso,
  mes: claveMes,
}

export function agregarVentasPorPeriodo(
  ventas: VentaReporte[],
  granularidad: Granularidad,
): PeriodoAgregado[] {
  const obtenerClave = OBTENER_CLAVE[granularidad]
  const acumulado = new Map<string, PeriodoAgregado>()

  for (const venta of ventas) {
    const clave = obtenerClave(venta.createdAt)
    const existente = acumulado.get(clave)
    if (existente) {
      existente.totalVendido += venta.total
      existente.cantidadVentas += 1
    } else {
      acumulado.set(clave, {
        clave,
        etiqueta: clave,
        totalVendido: venta.total,
        cantidadVentas: 1,
      })
    }
  }

  return Array.from(acumulado.values()).sort((a, b) => a.clave.localeCompare(b.clave))
}
