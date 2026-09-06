// Edge Function: registrar-venta (BD-04.2, RF-03.2/03.3/03.4/04.3, RN-006/RN-008)
//
// Núcleo transaccional del MVP (ver ARQUITECTURA_MVP_1.0_2026-08-30.md sección
// 3, "Flujo crítico 1"). Única forma de escribir `ventas`/`venta_pagos`,
// descontar `insumos.stock_actual` e insertar `movimientos_inventario` — nunca
// como 4 llamadas `supabase-js` encadenadas (PostgREST es autocommit por
// request, no daría atomicidad real ante un fallo a mitad de camino).
//
// Decisión abierta 1 (PLAN_DESARROLLO_2026-09-04_BD-04-pos-ventas.md, aprobada
// por Erick: "conexion con posgrest directa" = conexión Postgres directa):
// esta función abre una conexión real a Postgres (vía `SUPABASE_DB_URL`,
// expuesta automáticamente por el entorno de Edge Functions) y envuelve las 4
// escrituras en una transacción real (BEGIN/COMMIT/ROLLBACK real), con
// `SELECT ... FOR UPDATE` sobre `insumos` para bloquear las filas afectadas
// mientras se verifica y descuenta stock (RN-008 bajo concurrencia real).
// Esto NO viola PD-011 ("nunca lógica de negocio en triggers ni funciones
// SQL"): toda decisión (qué insumos calcular, cuánto validar, qué mensaje de
// error devolver) vive aquí en TypeScript; el BEGIN/COMMIT y las sentencias
// SQL directas son solo el mecanismo de atomicidad, no un trigger/función
// almacenado en la base de datos (mismo estilo de justificación ya usado en
// `20260904000007_movimientos_inventario_insert_administrador.sql`).
//
// Migración de driver (2026-09-05, aprobada por Erick): esta función usaba
// `npm:postgres@3`, que resuelve `SUPABASE_DB_URL` vía la capa de
// compatibilidad Node (`node:dns`) del `edge-runtime`. Esa resolución falla
// dentro del sandbox por-worker del `edge-runtime` local
// (`getaddrinfo ENOTFOUND supabase_db_<proyecto>`), un bug conocido y sin
// resolver de Supabase (`supabase/postgres#1447`). Se migró a
// `jsr:@db/postgres` (cliente nativo de Deno, resolución DNS vía
// `Deno.connect`), manteniendo exactamente el mismo mecanismo de atomicidad
// (transacción real BEGIN/COMMIT/ROLLBACK, mismo `SELECT ... FOR UPDATE`
// sobre `insumos`) y toda la lógica de negocio sin cambios — solo cambia la
// librería concreta de conexión.
//
// Identidad: `cajero_id` se resuelve siempre desde `auth.uid()` (igual que
// `crear-usuario`), nunca del payload del cliente. El turno se resuelve como
// "el turno abierto que pertenece a quien llama" — no el turno abierto
// global sin filtrar — porque solo puede existir un turno abierto a la vez
// (índice único parcial de BD-03) y debe pertenecer a quien vende.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { Client } from 'jsr:@db/postgres@0.19.5'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type TipoEntrega = 'para_llevar' | 'consumo_lugar'
type MetodoPago = 'efectivo' | 'nequi' | 'transferencia_qr' | 'credito_rappi' | 'tarjeta'

const TIPOS_ENTREGA: TipoEntrega[] = ['para_llevar', 'consumo_lugar']
const METODOS_PAGO: MetodoPago[] = ['efectivo', 'nequi', 'transferencia_qr', 'credito_rappi', 'tarjeta']

interface PagoPayload {
  metodoPago: MetodoPago
  monto: number
}

interface RegistrarVentaPayload {
  productoId: string
  tamanoVasoId?: string | null
  cantidad: number
  tipoEntrega: TipoEntrega
  observaciones: string | null
  pagos: PagoPayload[]
}

// Filas tal como las devuelve `jsr:@db/postgres` (columnas `numeric` llegan
// como string —igual que con el driver anterior— para no perder precisión;
// `integer`/`bool` llegan ya tipados nativamente).
interface TurnoRow {
  id: string
}
interface ProductoRow {
  id: string
  activo: boolean
  categoria: 'ceviche' | 'bebida' | 'otro'
  precio: string | null
}
interface TamanoVasoRow {
  id: string
  activo: boolean
  insumo_id: string | null
}
interface ProductoTamanoPrecioRow {
  precio: string
}
interface RecetaRow {
  insumo_id: string
  cantidad: string
}
interface InsumoRow {
  id: string
  nombre: string
  stock_actual: string
}
interface StockActualRow {
  stock_actual: string
}
interface VentaRow {
  id: string
  turno_id: string
  cajero_id: string
  producto_id: string
  tamano_vaso_id: string | null
  cantidad: number
  precio_unitario: string
  total: string
  tipo_entrega: TipoEntrega
  observaciones: string | null
  created_at: Date
}
interface VentaPagoRow {
  id: string
  venta_id: string
  metodo_pago: MetodoPago
  monto: string
  estado_transferencia: string | null
  created_at: Date
  updated_at: Date
}

/** Error de negocio con código HTTP explícito (422 validación, 409 conflicto
 * de estado/concurrencia). Cualquier otro error (BD, red) cae a 500 genérico. */
class AppError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** Redondea a centavos enteros — toda comparación/cálculo de dinero en esta
 * función se hace en centavos para no arrastrar errores de punto flotante
 * (RN-006 exige una igualdad exacta, no "aproximadamente igual"). */
function centavos(monto: number): number {
  return Math.round(monto * 100)
}

function numero(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor
  if (typeof valor === 'string' && valor.trim() !== '') {
    const parsed = Number(valor)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** `jsr:@db/postgres` devuelve columnas `numeric` como string (para no perder
 * precisión); este helper las convierte a number para poder operar en JS,
 * ya que todo el dinero/las cantidades de este archivo se manejan en
 * centavos/enteros controlados explícitamente. */
function num(valor: string | number): number {
  return typeof valor === 'number' ? valor : Number(valor)
}

function validarPayload(body: Record<string, unknown>): RegistrarVentaPayload {
  const productoId = body.producto_id
  const tamanoVasoId =
    typeof body.tamano_vaso_id === 'string' && body.tamano_vaso_id.trim() !== ''
      ? body.tamano_vaso_id.trim()
      : null
  const cantidad = body.cantidad
  const tipoEntrega = body.tipo_entrega
  const observaciones = body.observaciones
  const pagos = body.pagos

  if (typeof productoId !== 'string' || productoId.trim() === '') {
    throw new AppError(422, 'producto_id es obligatorio.')
  }
  const cantidadNumerica = numero(cantidad)
  if (cantidadNumerica === null || !Number.isInteger(cantidadNumerica) || cantidadNumerica <= 0) {
    throw new AppError(422, 'cantidad debe ser un entero mayor que cero.')
  }
  if (typeof tipoEntrega !== 'string' || !TIPOS_ENTREGA.includes(tipoEntrega as TipoEntrega)) {
    throw new AppError(422, `tipo_entrega debe ser uno de: ${TIPOS_ENTREGA.join(', ')}.`)
  }
  if (observaciones !== undefined && observaciones !== null && typeof observaciones !== 'string') {
    throw new AppError(422, 'observaciones debe ser texto.')
  }
  if (!Array.isArray(pagos) || pagos.length === 0) {
    throw new AppError(422, 'Debe incluir al menos un método de pago.')
  }

  const pagosValidados: PagoPayload[] = pagos.map((pago) => {
    if (typeof pago !== 'object' || pago === null) {
      throw new AppError(422, 'Cada pago debe ser un objeto con metodo_pago y monto.')
    }
    const { metodo_pago, monto } = pago as Record<string, unknown>
    if (typeof metodo_pago !== 'string' || !METODOS_PAGO.includes(metodo_pago as MetodoPago)) {
      throw new AppError(422, `metodo_pago debe ser uno de: ${METODOS_PAGO.join(', ')}.`)
    }
    const montoNumerico = numero(monto)
    if (montoNumerico === null || montoNumerico <= 0) {
      throw new AppError(422, 'El monto de cada pago debe ser un número mayor que cero.')
    }
    return { metodoPago: metodo_pago as MetodoPago, monto: montoNumerico }
  })

  return {
    productoId,
    tamanoVasoId,
    cantidad: cantidadNumerica,
    tipoEntrega: tipoEntrega as TipoEntrega,
    observaciones:
      typeof observaciones === 'string' && observaciones.trim() !== '' ? observaciones.trim() : null,
    pagos: pagosValidados,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'No autenticado.' }, 401)
  }

  // Cliente "como el invocador" (anon key + su JWT) solo para resolver quién es
  // (mismo patrón que crear-usuario).
  const supabaseCallerCtx = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
    error: callerError,
  } = await supabaseCallerCtx.auth.getUser()

  if (callerError || !caller) {
    return jsonResponse({ error: 'No autenticado.' }, 401)
  }

  // Cliente con service_role: resuelve activo/rol sin depender de RLS (mismo
  // patrón que crear-usuario). La conexión Postgres directa de más abajo
  // bypasa RLS por completo, así que la verificación de "usuario activo" debe
  // quedar explícita aquí — no hay política RLS que la haga por nosotros.
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const { data: callerPerfil, error: callerPerfilError } = await supabaseAdmin
    .from('usuarios_perfil')
    .select('activo')
    .eq('id', caller.id)
    .single()

  if (callerPerfilError || !callerPerfil || !callerPerfil.activo) {
    return jsonResponse({ error: 'No autorizado.' }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  let datos: RegistrarVentaPayload
  try {
    datos = validarPayload(body)
  } catch (err) {
    if (err instanceof AppError) return jsonResponse({ error: err.message }, err.status)
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido.' }, 400)
  }

  const client = new Client(dbUrl)

  try {
    await client.connect()
    const transaction = client.createTransaction('registrar_venta')
    await transaction.begin()

    try {
      // 1) Turno abierto propio (no el abierto global sin filtrar).
      const turnoResult = await transaction.queryObject<TurnoRow>(
        `select id from public.turnos_caja
         where estado = 'abierto' and cajero_id = $1`,
        [caller.id],
      )
      if (turnoResult.rows.length === 0) {
        throw new AppError(409, 'No tienes un turno de caja abierto. Abre caja antes de registrar una venta.')
      }
      const turnoId = turnoResult.rows[0].id

      // 2) Producto vigente y activo.
      const productoResult = await transaction.queryObject<ProductoRow>(
        `select id, activo, categoria, precio from public.productos where id = $1`,
        [datos.productoId],
      )
      if (productoResult.rows.length === 0 || productoResult.rows[0].activo !== true) {
        throw new AppError(422, 'El producto seleccionado no existe o no está activo.')
      }
      const producto = productoResult.rows[0]

      let precioUnitario: number
      let insumoVasoId: string | null = null
      let tamanoVasoIdFinal: string | null = null

      if (producto.categoria === 'otro') {
        // Categoría 'otro': precio directo del producto, sin tamaño de vaso ni insumo de vaso
        if (!producto.precio || num(producto.precio) <= 0) {
          throw new AppError(422, 'El producto no tiene un precio configurado.')
        }
        precioUnitario = num(producto.precio)
        tamanoVasoIdFinal = null
        insumoVasoId = null
      } else {
        // Categoría 'ceviche' o 'bebida': requiere tamaño de vaso
        if (!datos.tamanoVasoId) {
          throw new AppError(422, 'Debes seleccionar una presentación/tamaño para este producto.')
        }

        // 3) Tamaño de vaso vigente y activo (determina el insumo-vaso si aplica, PD-005).
        const tamanoResult = await transaction.queryObject<TamanoVasoRow>(
          `select id, activo, insumo_id from public.tamanos_vaso where id = $1`,
          [datos.tamanoVasoId],
        )
        if (tamanoResult.rows.length === 0 || tamanoResult.rows[0].activo !== true) {
          throw new AppError(422, 'El tamaño seleccionado no existe o no está activo.')
        }
        insumoVasoId = tamanoResult.rows[0].insumo_id
        tamanoVasoIdFinal = tamanoResult.rows[0].id

        // 3.1) Precio vigente para esta combinación producto x tamaño (RN-011).
        const precioResult = await transaction.queryObject<ProductoTamanoPrecioRow>(
          `select precio from public.producto_tamano_precio
           where producto_id = $1 and tamano_vaso_id = $2 and activo = true`,
          [datos.productoId, datos.tamanoVasoId],
        )
        if (precioResult.rows.length === 0) {
          throw new AppError(
            422,
            'Este producto no tiene un precio configurado para el tamaño seleccionado.',
          )
        }
        precioUnitario = num(precioResult.rows[0].precio)
      }

      // 4) Cálculo de total (snapshot) y revalidación estricta de RN-006 en
      // centavos enteros.
      const precioUnitarioCentavos = centavos(precioUnitario)
      const totalCentavos = precioUnitarioCentavos * datos.cantidad
      const total = totalCentavos / 100

      const sumaPagosCentavos = datos.pagos.reduce((acc, pago) => acc + centavos(pago.monto), 0)
      if (sumaPagosCentavos !== totalCentavos) {
        throw new AppError(
          422,
          'La suma de los métodos de pago no coincide con el total de la venta.',
        )
      }

      // 5) Insumos a descontar (PD-005 + RF-04.3): 1x insumo-vaso por unidad
      // vendida (si insumoVasoId está definido) + producto_receta filtrada por condicion
      // IN ('siempre', tipo_entrega) y activo=true, cada uno x cantidad vendida.
      const insumosADescontar = new Map<string, number>()
      if (insumoVasoId) {
        insumosADescontar.set(insumoVasoId, (insumosADescontar.get(insumoVasoId) ?? 0) + datos.cantidad)
      }

      const recetaResult = await transaction.queryObject<RecetaRow>(
        `select insumo_id, cantidad from public.producto_receta
         where producto_id = $1
           and activo = true
           and condicion in ('siempre', $2)`,
        [datos.productoId, datos.tipoEntrega],
      )
      for (const fila of recetaResult.rows) {
        const insumoId = fila.insumo_id
        const cantidadPorUnidad = num(fila.cantidad)
        insumosADescontar.set(
          insumoId,
          (insumosADescontar.get(insumoId) ?? 0) + cantidadPorUnidad * datos.cantidad,
        )
      }

      const insumoIds = [...insumosADescontar.keys()]

      // 6) Bloqueo real de las filas de insumos afectadas (RN-008 bajo
      // concurrencia: dos ventas simultáneas del mismo insumo no pueden
      // ambas "ver" el mismo stock disponible y sobrevender).
      // Se ejecuta únicamente si hay insumos a descontar para evitar `IN ()`.
      if (insumoIds.length > 0) {
        const placeholdersInsumos = insumoIds.map((_, i) => `$${i + 1}`).join(', ')
        const insumosResult = await transaction.queryObject<InsumoRow>(
          `select id, nombre, stock_actual from public.insumos
           where id in (${placeholdersInsumos})
           for update`,
          insumoIds,
        )
        const stockPorInsumo = new Map(
          insumosResult.rows.map((fila) => [fila.id, num(fila.stock_actual)]),
        )

        for (const [insumoId, cantidadRequerida] of insumosADescontar) {
          const stockDisponible = stockPorInsumo.get(insumoId)
          if (stockDisponible === undefined || stockDisponible < cantidadRequerida) {
            // Mensaje genérico por defecto (RN-001: el Cajero no ve inventario
            // completo) — ver Riesgo 3 del plan aprobado.
            throw new AppError(409, 'No hay stock suficiente para completar esta venta.')
          }
        }
      }

      // 7) INSERT ventas.
      const ventaResult = await transaction.queryObject<VentaRow>(
        `insert into public.ventas
           (turno_id, cajero_id, producto_id, tamano_vaso_id, cantidad, precio_unitario, total, tipo_entrega, observaciones)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning id, turno_id, cajero_id, producto_id, tamano_vaso_id, cantidad, precio_unitario, total, tipo_entrega, observaciones, created_at`,
        [
          turnoId,
          caller.id,
          datos.productoId,
          tamanoVasoIdFinal,
          datos.cantidad,
          precioUnitario,
          total,
          datos.tipoEntrega,
          datos.observaciones,
        ],
      )
      const venta = ventaResult.rows[0]

      // 8) INSERT venta_pagos. estado_transferencia='pendiente' solo si
      // metodo_pago='transferencia_qr' — nunca aceptado del cliente.
      const pagosInsertados: VentaPagoRow[] = []
      for (const pago of datos.pagos) {
        const estadoTransferencia = pago.metodoPago === 'transferencia_qr' ? 'pendiente' : null
        const pagoResult = await transaction.queryObject<VentaPagoRow>(
          `insert into public.venta_pagos (venta_id, metodo_pago, monto, estado_transferencia)
           values ($1, $2, $3, $4)
           returning id, venta_id, metodo_pago, monto, estado_transferencia, created_at, updated_at`,
          [venta.id, pago.metodoPago, pago.monto, estadoTransferencia],
        )
        pagosInsertados.push(pagoResult.rows[0])
      }

      // 9) UPDATE stock_actual + INSERT movimientos_inventario (trazabilidad).
      for (const [insumoId, cantidadDescontar] of insumosADescontar) {
        const updateResult = await transaction.queryObject<StockActualRow>(
          `update public.insumos
           set stock_actual = stock_actual - $1, updated_at = now()
           where id = $2
           returning stock_actual`,
          [cantidadDescontar, insumoId],
        )
        const stockResultante = num(updateResult.rows[0].stock_actual)
        await transaction.queryObject(
          `insert into public.movimientos_inventario
             (insumo_id, venta_id, tipo_movimiento, cantidad, stock_resultante, usuario_id)
           values ($1, $2, 'venta', $3, $4, $5)`,
          [insumoId, venta.id, -cantidadDescontar, stockResultante, caller.id],
        )
      }

      await transaction.commit()

      return jsonResponse(
        {
          venta: {
            id: venta.id,
            turno_id: venta.turno_id,
            cajero_id: venta.cajero_id,
            producto_id: venta.producto_id,
            tamano_vaso_id: venta.tamano_vaso_id,
            cantidad: venta.cantidad,
            precio_unitario: num(venta.precio_unitario),
            total: num(venta.total),
            tipo_entrega: venta.tipo_entrega,
            observaciones: venta.observaciones,
            created_at: venta.created_at,
          },
          pagos: pagosInsertados.map((p) => ({
            id: p.id,
            venta_id: p.venta_id,
            metodo_pago: p.metodo_pago,
            monto: num(p.monto),
            estado_transferencia: p.estado_transferencia,
            created_at: p.created_at,
            updated_at: p.updated_at,
          })),
        },
        200,
      )
    } catch (err) {
      try {
        await transaction.rollback()
      } catch (rollbackErr) {
        console.error('registrar-venta: error al hacer rollback', rollbackErr)
      }
      throw err
    }
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse({ error: err.message }, err.status)
    }
    console.error('registrar-venta: error inesperado', err)
    return jsonResponse({ error: 'No se pudo registrar la venta.' }, 500)
  } finally {
    try {
      await client.end()
    } catch (endErr) {
      console.error('registrar-venta: error al cerrar la conexión', endErr)
    }
  }
})
