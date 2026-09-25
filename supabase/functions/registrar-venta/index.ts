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
//
// Extensión Promociones (ticket post-MVP "Carta/Promociones", ticket 1/2,
// aditiva — el camino de producto individual queda byte-a-byte igual que
// antes, solo movido dentro de una rama `if (datos.productoId)`): el
// payload ahora acepta `promocion_id` como alternativa a `producto_id`
// (exactamente uno de los dos, nunca ambos ni ninguno, validado en
// `validarPayload`). Al vender una promoción se resuelve su composición
// (`promocion_productos`) y, por CADA producto componente, se recalcula
// exactamente la misma lógica de insumos que ya existe para un producto
// individual (receta de `producto_receta` + insumo-vaso de su
// `tamano_vaso_id`, fijado de antemano en `promocion_productos` — ver
// `20260912000009_promocion_productos.sql`), acumulando todo en el MISMO
// `Map<insumo_id, cantidad>` que ya usaba el camino individual. A partir de
// ahí (bloqueo `FOR UPDATE`, validación de stock, UPDATE + `movimientos_
// inventario`) el código es idéntico y compartido entre ambos caminos: no
// hay dos copias de esa lógica. El precio unitario/total de una venta de
// promoción usa siempre `promociones.precio` (nunca la suma de precios
// individuales de sus componentes) — ver
// `20260912000010_ventas_promocion_id.sql` para el diseño de `ventas.
// promocion_id`/`producto_id` (ambos nullable, exactamente uno no-nulo).

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

interface ItemPayload {
  productoId: string | null
  promocionId: string | null
  tamanoVasoId?: string | null
  cantidad: number
  precio?: number | null
}

interface RegistrarVentaPayload {
  items: ItemPayload[]
  tipoEntrega: TipoEntrega
  observaciones: string | null
  pagos: PagoPayload[]
  ticketCodigo?: string | null
  cantidadBolsas?: number
  cantidadTapas?: number
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
  categoria: 'ceviche' | 'granizado' | 'bebida' | 'otro' | 'adicionales' | 'adicional'
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
/** Promoción (ticket post-MVP Carta/Promociones): combo con precio propio,
 * distinto de la suma de precios de sus productos componentes. */
interface PromocionRow {
  id: string
  nombre: string
  precio: string
  activo: boolean
}
/** Fila de `promocion_productos`: un producto componente de la promoción,
 * con su cantidad dentro del combo y, si aplica, el tamaño de vaso fijado
 * de antemano por el Administrador al armar la promoción (nunca elegido por
 * el Cajero en el momento de la venta). `cantidad` es `integer` en BD: el
 * driver la entrega ya como `number` nativo (igual que `datos.cantidad`). */
interface PromocionProductoRow {
  producto_id: string
  cantidad: number
  tamano_vaso_id: string | null
}
/** Producto componente de una promoción: se necesita su nombre (para
 * mensajes de error legibles), si sigue activo (RN-005 también aplica a
 * componentes) y su categoría (para saber si requiere tamaño de vaso). */
interface ProductoComponenteRow {
  id: string
  nombre: string
  activo: boolean
  categoria: 'ceviche' | 'granizado' | 'bebida' | 'otro' | 'adicionales' | 'adicional'
}
interface VentaRow {
  id: string
  turno_id: string
  cajero_id: string
  producto_id: string | null
  promocion_id: string | null
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
  const tipoEntrega = body.tipo_entrega
  const observaciones = body.observaciones
  const pagos = body.pagos
  const ticketCodigo =
    typeof body.ticket_codigo === 'string' && body.ticket_codigo.trim() !== ''
      ? body.ticket_codigo.trim()
      : null

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

  // Soportar array de items (multi-producto) o parámetros individuales (retrocompatible)
  const itemsRaw =
    Array.isArray(body.items) && body.items.length > 0 ? body.items : [body]

  const itemsValidados: ItemPayload[] = itemsRaw.map((itRaw) => {
    if (typeof itRaw !== 'object' || itRaw === null) {
      throw new AppError(422, 'Cada item debe ser un objeto.')
    }
    const it = itRaw as Record<string, unknown>
    const pIdRaw = it.producto_id ?? it.productoId
    const prIdRaw = it.promocion_id ?? it.promocionId
    const tvIdRaw = it.tamano_vaso_id ?? it.tamanoVasoId
    const cantRaw = it.cantidad
    const precioRaw = it.precio

    const productoId =
      typeof pIdRaw === 'string' && pIdRaw.trim() !== '' ? pIdRaw.trim() : null
    const promocionId =
      typeof prIdRaw === 'string' && prIdRaw.trim() !== '' ? prIdRaw.trim() : null
    const tamanoVasoId =
      typeof tvIdRaw === 'string' && tvIdRaw.trim() !== '' ? tvIdRaw.trim() : null
    const precio = numero(precioRaw)

    if (productoId === null && promocionId === null) {
      throw new AppError(422, 'Debes indicar producto_id o promocion_id en cada item.')
    }
    if (productoId !== null && promocionId !== null) {
      throw new AppError(422, 'No puedes indicar producto_id y promocion_id al mismo tiempo en el mismo item.')
    }
    if (promocionId !== null && tamanoVasoId !== null) {
      throw new AppError(422, 'tamano_vaso_id no aplica al vender una promoción.')
    }
    const cantidadNumerica = numero(cantRaw)
    if (cantidadNumerica === null || !Number.isInteger(cantidadNumerica) || cantidadNumerica <= 0) {
      throw new AppError(422, 'cantidad debe ser un entero mayor que cero en cada item.')
    }

    return {
      productoId,
      promocionId,
      tamanoVasoId,
      cantidad: cantidadNumerica,
      precio: precio && precio > 0 ? precio : null,
    }
  })

  return {
    items: itemsValidados,
    tipoEntrega: tipoEntrega as TipoEntrega,
    observaciones:
      typeof observaciones === 'string' && observaciones.trim() !== '' ? observaciones.trim() : null,
    pagos: pagosValidados,
    ticketCodigo,
    cantidadBolsas: (() => {
      const v = numero(body.cantidad_bolsas ?? body.cantidadBolsas)
      return v !== null && v > 0 ? Math.round(v) : 0
    })(),
    cantidadBolsasGrande: (() => {
      const v = numero(body.cantidad_bolsas_grande ?? body.cantidadBolsasGrande)
      return v !== null && v > 0 ? Math.round(v) : 0
    })(),
    cantidadBolsasMediana: (() => {
      const v = numero(body.cantidad_bolsas_mediana ?? body.cantidadBolsasMediana)
      return v !== null && v > 0 ? Math.round(v) : 0
    })(),
    cantidadBolsasPequena: (() => {
      const v = numero(body.cantidad_bolsas_pequena ?? body.cantidadBolsasPequena)
      return v !== null && v > 0 ? Math.round(v) : 0
    })(),
    cantidadTapas: (() => {
      const v = numero(body.cantidad_tapas ?? body.cantidadTapas)
      return v !== null && v > 0 ? Math.round(v) : 0
    })(),
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

      // 2) Procesamiento de items (soporta multi-producto o individual)
      interface ItemToInsert {
        productoId: string | null
        promocionId: string | null
        tamanoVasoId: string | null
        cantidad: number
        precioUnitario: number
        total: number
      }

      const itemsToInsert: ItemToInsert[] = []
      let grandTotalCentavos = 0
      const insumosADescontar = new Map<string, number>()

      for (const item of datos.items) {
        let precioUnitario: number
        let tamanoVasoIdFinal: string | null = null
        let ventaProductoId: string | null = null
        let ventaPromocionId: string | null = null

        if (item.productoId) {
          const productoResult = await transaction.queryObject<ProductoRow>(
            `select id, activo, categoria, precio from public.productos where id = $1`,
            [item.productoId],
          )
          if (productoResult.rows.length === 0 || productoResult.rows[0].activo !== true) {
            throw new AppError(422, 'El producto seleccionado no existe o no está activo.')
          }
          const producto = productoResult.rows[0]

          let insumoVasoId: string | null = null

          if (producto.categoria === 'otro' || producto.categoria === 'adicionales' || (producto.categoria as string) === 'adicional') {
            if (item.precio && item.precio > 0) {
              precioUnitario = item.precio
            } else if (producto.precio && num(producto.precio) > 0) {
              precioUnitario = num(producto.precio)
            } else {
              throw new AppError(422, 'El producto no tiene un precio configurado.')
            }
          } else {
            if (!item.tamanoVasoId) {
              throw new AppError(422, 'Debes seleccionar una presentación/tamaño para este producto.')
            }

            const tamanoResult = await transaction.queryObject<TamanoVasoRow>(
              `select id, activo, insumo_id from public.tamanos_vaso where id = $1`,
              [item.tamanoVasoId],
            )
            if (tamanoResult.rows.length === 0 || tamanoResult.rows[0].activo !== true) {
              throw new AppError(422, 'El tamaño seleccionado no existe o no está activo.')
            }
            insumoVasoId = tamanoResult.rows[0].insumo_id
            tamanoVasoIdFinal = tamanoResult.rows[0].id

            const precioResult = await transaction.queryObject<ProductoTamanoPrecioRow>(
              `select precio from public.producto_tamano_precio
               where producto_id = $1 and tamano_vaso_id = $2 and activo = true`,
              [item.productoId, item.tamanoVasoId],
            )
            if (precioResult.rows.length === 0) {
              throw new AppError(
                422,
                'Este producto no tiene un precio configurado para el tamaño seleccionado.',
              )
            }
            precioUnitario = num(precioResult.rows[0].precio)
          }

          if (insumoVasoId) {
            insumosADescontar.set(insumoVasoId, (insumosADescontar.get(insumoVasoId) ?? 0) + item.cantidad)
          }

          const recetaResult = await transaction.queryObject<RecetaRow>(
            `select insumo_id, cantidad from public.producto_receta
             where producto_id = $1
               and activo = true
               and condicion in ('siempre', $2)`,
            [item.productoId, datos.tipoEntrega],
          )
          for (const fila of recetaResult.rows) {
            const insumoId = fila.insumo_id
            const cantidadPorUnidad = num(fila.cantidad)
            insumosADescontar.set(
              insumoId,
              (insumosADescontar.get(insumoId) ?? 0) + cantidadPorUnidad * item.cantidad,
            )
          }

          ventaProductoId = item.productoId
        } else {
          // Promoción
          const promocionResult = await transaction.queryObject<PromocionRow>(
            `select id, nombre, precio, activo from public.promociones where id = $1`,
            [item.promocionId],
          )
          if (promocionResult.rows.length === 0 || promocionResult.rows[0].activo !== true) {
            throw new AppError(422, 'La promoción seleccionada no existe o no está activa.')
          }
          const promocion = promocionResult.rows[0]
          precioUnitario = num(promocion.precio)
          ventaPromocionId = promocion.id

          const componentesResult = await transaction.queryObject<PromocionProductoRow>(
            `select producto_id, cantidad, tamano_vaso_id from public.promocion_productos
             where promocion_id = $1`,
            [promocion.id],
          )
          if (componentesResult.rows.length === 0) {
            throw new AppError(422, 'La promoción seleccionada no tiene productos componentes.')
          }

          const productoComponenteIds = [...new Set(componentesResult.rows.map((c) => c.producto_id))]
          const placeholdersProductos = productoComponenteIds.map((_, i) => `$${i + 1}`).join(', ')
          const productosComponentesResult = await transaction.queryObject<ProductoComponenteRow>(
            `select id, nombre, activo, categoria from public.productos where id in (${placeholdersProductos})`,
            productoComponenteIds,
          )
          const mapaProductos = new Map(productosComponentesResult.rows.map((p) => [p.id, p]))

          for (const componente of componentesResult.rows) {
            const prodComponente = mapaProductos.get(componente.producto_id)
            if (!prodComponente || prodComponente.activo !== true) {
              throw new AppError(422, `Uno de los componentes de la promoción no existe o no está activo.`)
            }
            const cantidadTotalComponente = componente.cantidad * item.cantidad

            if (
              prodComponente.categoria !== 'otro' &&
              prodComponente.categoria !== 'adicionales' &&
              (prodComponente.categoria as string) !== 'adicional' &&
              componente.tamano_vaso_id
            ) {
              const tamanoComponenteResult = await transaction.queryObject<TamanoVasoRow>(
                `select id, activo, insumo_id from public.tamanos_vaso where id = $1`,
                [componente.tamano_vaso_id],
              )
              if (tamanoComponenteResult.rows.length === 0 || tamanoComponenteResult.rows[0].activo !== true) {
                throw new AppError(422, `Uno de los tamaños de vaso de la promoción no existe o no está activo.`)
              }
              const insumoVasoCompId = tamanoComponenteResult.rows[0].insumo_id
              if (insumoVasoCompId) {
                insumosADescontar.set(
                  insumoVasoCompId,
                  (insumosADescontar.get(insumoVasoCompId) ?? 0) + cantidadTotalComponente,
                )
              }
            }

            const recetaComponenteResult = await transaction.queryObject<RecetaRow>(
              `select insumo_id, cantidad from public.producto_receta
               where producto_id = $1
                 and activo = true
                 and condicion in ('siempre', $2)`,
              [componente.producto_id, datos.tipoEntrega],
            )
            for (const fila of recetaComponenteResult.rows) {
              const insumoId = fila.insumo_id
              const cantidadPorUnidad = num(fila.cantidad)
              insumosADescontar.set(
                insumoId,
                (insumosADescontar.get(insumoId) ?? 0) + cantidadPorUnidad * cantidadTotalComponente,
              )
            }
          }
        }

        const itemTotalCentavos = centavos(precioUnitario) * item.cantidad
        grandTotalCentavos += itemTotalCentavos
        itemsToInsert.push({
          productoId: ventaProductoId,
          promocionId: ventaPromocionId,
          tamanoVasoId: tamanoVasoIdFinal,
          cantidad: item.cantidad,
          precioUnitario,
          total: itemTotalCentavos / 100,
        })
      }

      // 3) Cálculo de total general y revalidación de RN-006 en centavos enteros
      const sumaPagosCentavos = datos.pagos.reduce((acc, pago) => acc + centavos(pago.monto), 0)
      if (sumaPagosCentavos !== grandTotalCentavos) {
        throw new AppError(
          422,
          `La suma de los métodos de pago ($${sumaPagosCentavos / 100}) no coincide con el total de la venta ($${grandTotalCentavos / 100}).`,
        )
      }

      // 2.1) Empaques para llevar / domicilio (bolsas y tapas)
      if (datos.cantidadBolsasGrande && datos.cantidadBolsasGrande > 0) {
        const bolsaGResult = await transaction.queryObject<{ id: string }>(
          `select id from public.insumos where activo = true and (tipo = 'Bolsa' or nombre ilike '%bolsa%') and nombre ilike '%grande%' limit 1`,
        )
        if (bolsaGResult.rows.length > 0) {
          const bId = bolsaGResult.rows[0].id
          insumosADescontar.set(bId, (insumosADescontar.get(bId) ?? 0) + datos.cantidadBolsasGrande)
        }
      }

      if (datos.cantidadBolsasMediana && datos.cantidadBolsasMediana > 0) {
        const bolsaMResult = await transaction.queryObject<{ id: string }>(
          `select id from public.insumos where activo = true and (tipo = 'Bolsa' or nombre ilike '%bolsa%') and nombre ilike '%mediana%' limit 1`,
        )
        if (bolsaMResult.rows.length > 0) {
          const bId = bolsaMResult.rows[0].id
          insumosADescontar.set(bId, (insumosADescontar.get(bId) ?? 0) + datos.cantidadBolsasMediana)
        }
      }

      if (datos.cantidadBolsasPequena && datos.cantidadBolsasPequena > 0) {
        const bolsaPResult = await transaction.queryObject<{ id: string }>(
          `select id from public.insumos where activo = true and (id = 'e0000000-0000-0000-0000-000000000002' or ((tipo = 'Bolsa' or nombre ilike '%bolsa%') and (nombre ilike '%pequeñ%' or nombre ilike '%pequen%' or nombre ilike '%peq%'))) order by (id = 'e0000000-0000-0000-0000-000000000002') desc limit 1`,
        )
        if (bolsaPResult.rows.length > 0) {
          const bId = bolsaPResult.rows[0].id
          insumosADescontar.set(bId, (insumosADescontar.get(bId) ?? 0) + datos.cantidadBolsasPequena)
        }
      }

      const totalDesglosado =
        (datos.cantidadBolsasGrande ?? 0) +
        (datos.cantidadBolsasMediana ?? 0) +
        (datos.cantidadBolsasPequena ?? 0)
      if (totalDesglosado === 0 && datos.cantidadBolsas && datos.cantidadBolsas > 0) {
        const bolsaResult = await transaction.queryObject<{ id: string }>(
          `select id from public.insumos where activo = true and (id = 'e0000000-0000-0000-0000-000000000002' or tipo = 'Bolsa' or nombre ilike '%bolsa%') order by (id = 'e0000000-0000-0000-0000-000000000002') desc limit 1`,
        )
        if (bolsaResult.rows.length > 0) {
          const bId = bolsaResult.rows[0].id
          insumosADescontar.set(bId, (insumosADescontar.get(bId) ?? 0) + datos.cantidadBolsas)
        }
      }

      if (datos.cantidadTapas && datos.cantidadTapas > 0) {
        const tapaResult = await transaction.queryObject<{ id: string }>(
          `select id from public.insumos where activo = true and (id = 'e0000000-0000-0000-0000-000000000001' or nombre ilike '%tapa%') order by (id = 'e0000000-0000-0000-0000-000000000001') desc limit 1`,
        )
        if (tapaResult.rows.length > 0) {
          const tId = tapaResult.rows[0].id
          insumosADescontar.set(tId, (insumosADescontar.get(tId) ?? 0) + datos.cantidadTapas)
        }
      }

      const insumoIds = [...insumosADescontar.keys()]

      // 4) Bloqueo real de las filas de insumos afectadas (RN-008 bajo concurrencia)
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
            throw new AppError(409, 'No hay stock suficiente para completar esta venta.')
          }
        }
      }

      // 5) INSERT en public.ventas para cada item
      const ventasInsertadas: VentaRow[] = []
      for (let i = 0; i < itemsToInsert.length; i++) {
        const it = itemsToInsert[i]
        let obs = datos.observaciones
        if (itemsToInsert.length > 1) {
          const prefijo = datos.ticketCodigo
            ? `[${datos.ticketCodigo} ${i + 1}/${itemsToInsert.length}] `
            : `[Item ${i + 1}/${itemsToInsert.length}] `
          obs = obs ? `${prefijo}${obs}` : prefijo.trim()
        }

        const ventaResult = await transaction.queryObject<VentaRow>(
          `insert into public.ventas
             (turno_id, cajero_id, producto_id, promocion_id, tamano_vaso_id, cantidad, precio_unitario, total, tipo_entrega, observaciones)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           returning id, turno_id, cajero_id, producto_id, promocion_id, tamano_vaso_id, cantidad, precio_unitario, total, tipo_entrega, observaciones, created_at`,
          [
            turnoId,
            caller.id,
            it.productoId,
            it.promocionId,
            it.tamanoVasoId,
            it.cantidad,
            it.precioUnitario,
            it.total,
            datos.tipoEntrega,
            obs,
          ],
        )
        ventasInsertadas.push(ventaResult.rows[0])
      }

      // 6) INSERT venta_pagos distribuidos secuencialmente entre las ventas creadas
      const pagosInsertados: VentaPagoRow[] = []
      let currentVentaIdx = 0
      let currentVentaRemainingCentavos = centavos(ventasInsertadas[0].total)

      for (const pago of datos.pagos) {
        let remainingPagoCentavos = centavos(pago.monto)
        while (remainingPagoCentavos > 0 && currentVentaIdx < ventasInsertadas.length) {
          const chunkCentavos = Math.min(remainingPagoCentavos, currentVentaRemainingCentavos)
          const chunkMonto = chunkCentavos / 100
          const estadoTransferencia = pago.metodoPago === 'transferencia_qr' ? 'pendiente' : null

          const pagoResult = await transaction.queryObject<VentaPagoRow>(
            `insert into public.venta_pagos (venta_id, metodo_pago, monto, estado_transferencia)
             values ($1, $2, $3, $4)
             returning id, venta_id, metodo_pago, monto, estado_transferencia, created_at, updated_at`,
            [ventasInsertadas[currentVentaIdx].id, pago.metodoPago, chunkMonto, estadoTransferencia],
          )
          pagosInsertados.push(pagoResult.rows[0])

          remainingPagoCentavos -= chunkCentavos
          currentVentaRemainingCentavos -= chunkCentavos

          if (currentVentaRemainingCentavos === 0) {
            currentVentaIdx++
            if (currentVentaIdx < ventasInsertadas.length) {
              currentVentaRemainingCentavos = centavos(ventasInsertadas[currentVentaIdx].total)
            }
          }
        }
      }

      // 7) UPDATE stock_actual + INSERT movimientos_inventario (trazabilidad)
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
          [insumoId, ventasInsertadas[0].id, -cantidadDescontar, stockResultante, caller.id],
        )
      }

      await transaction.commit()

      const primaryVenta = ventasInsertadas[0]
      return jsonResponse(
        {
          venta: {
            id: primaryVenta.id,
            turno_id: primaryVenta.turno_id,
            cajero_id: primaryVenta.cajero_id,
            producto_id: primaryVenta.producto_id,
            promocion_id: primaryVenta.promocion_id,
            tamano_vaso_id: primaryVenta.tamano_vaso_id,
            cantidad: primaryVenta.cantidad,
            precio_unitario: num(primaryVenta.precio_unitario),
            total: num(primaryVenta.total),
            tipo_entrega: primaryVenta.tipo_entrega,
            observaciones: primaryVenta.observaciones,
            created_at: primaryVenta.created_at,
          },
          ventas: ventasInsertadas.map((v) => ({
            id: v.id,
            turno_id: v.turno_id,
            cajero_id: v.cajero_id,
            producto_id: v.producto_id,
            promocion_id: v.promocion_id,
            tamano_vaso_id: v.tamano_vaso_id,
            cantidad: v.cantidad,
            precio_unitario: num(v.precio_unitario),
            total: num(v.total),
            tipo_entrega: v.tipo_entrega,
            observaciones: v.observaciones,
            created_at: v.created_at,
          })),
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
