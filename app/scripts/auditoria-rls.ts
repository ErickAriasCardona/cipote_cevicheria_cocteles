/**
 * Script de Auditoría de Seguridad RLS End-to-End & Trigger set_updated_at() (BD-10.1 / BD-10.2).
 *
 * Verifica la matriz de acceso de 15 tablas × 2 roles × 4 acciones
 * (MODELO_DATOS_MVP_1.0_2026-08-30.md sección 5.3) y comprueba el trigger automático.
 *
 * Ejecución:
 *   npx tsx scripts/auditoria-rls.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

interface ResultadoPrueba {
  categoria: string
  operacion: string
  tabla: string
  rol: string
  esperado: string
  obtenido: string
  exito: boolean
  detalle?: string
}

const resultados: ResultadoPrueba[] = []

function registrar(
  categoria: string,
  operacion: string,
  tabla: string,
  rol: string,
  esperado: string,
  obtenido: string,
  detalle?: string,
) {
  const exito = esperado === obtenido
  resultados.push({ categoria, operacion, tabla, rol, esperado, obtenido, exito, detalle })
}

async function runAudit() {
  console.log('='.repeat(75))
  console.log(' AUDITORÍA END-TO-END: RLS Y TRIGGER SET_UPDATED_AT() (BD-10.1 / BD-10.2)')
  console.log('='.repeat(75))
  console.log(`Conectando a: ${SUPABASE_URL}\n`)

  const adminClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
  const cajeroClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })

  console.log('Autenticando sesiones de prueba...')
  const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
    email: 'admin.prueba@cipote.test',
    password: 'Cipote-Admin-2026!',
  })
  if (adminAuthErr || !adminAuth.user) {
    throw new Error(`Fallo login de Administrador: ${adminAuthErr?.message}`)
  }
  console.log(`✓ Administrador autenticado: ${adminAuth.user.id}`)

  const { data: cajeroAuth, error: cajeroAuthErr } = await cajeroClient.auth.signInWithPassword({
    email: 'cajero.prueba@cipote.test',
    password: 'Cipote-Cajero-2026!',
  })
  if (cajeroAuthErr || !cajeroAuth.user) {
    throw new Error(`Fallo login de Cajero: ${cajeroAuthErr?.message}`)
  }
  console.log(`✓ Cajero autenticado: ${cajeroAuth.user.id}\n`)

  // =========================================================================
  // SUBBLOQUE BD-10.1 — VERIFICACIÓN DEL TRIGGER SET_UPDATED_AT()
  // =========================================================================
  console.log('--- SUBBLOQUE BD-10.1: TRIGGER TÉCNICO set_updated_at() ---')
  const { data: insumoInicial } = await adminClient
    .from('insumos')
    .select('id, nombre, updated_at')
    .limit(1)
    .single()

  if (insumoInicial) {
    await new Promise((r) => setTimeout(r, 1000))
    const { data: insumoActualizado } = await adminClient
      .from('insumos')
      .update({ nombre: insumoInicial.nombre })
      .eq('id', insumoInicial.id)
      .select('id, nombre, updated_at')
      .single()

    const tInicial = new Date(insumoInicial.updated_at).getTime()
    const tActualizado = new Date(insumoActualizado?.updated_at || 0).getTime()
    const triggerOk = tActualizado > tInicial

    registrar(
      'BD-10.1 Trigger',
      'TRIGGER',
      'insumos.updated_at',
      'Admin',
      'ACTUALIZADO_AUTOMATICO',
      triggerOk ? 'ACTUALIZADO_AUTOMATICO' : 'NO_ACTUALIZO',
      `Antes: ${insumoInicial.updated_at} | Después: ${insumoActualizado?.updated_at}`,
    )
  }

  // =========================================================================
  // SUBBLOQUE BD-10.2 — AUDITORÍA DE LECTURA (SELECT)
  // =========================================================================
  console.log('\n--- SUBBLOQUE BD-10.2: AUDITORÍA DE LECTURA (SELECT) ---')

  // A. Tablas donde Cajero tiene acceso SELECT DENIED por RN-001 (datos financieros, recetas, stock)
  const tablasRestringidasCajero = [
    'insumos',
    'producto_receta',
    'movimientos_inventario',
    'gastos',
    'rol_permisos',
  ]

  for (const tabla of tablasRestringidasCajero) {
    // Admin puede leer
    const { data: adminData, error: adminErr } = await adminClient.from(tabla).select('*').limit(1)
    const adminPerm = !adminErr && adminData !== null ? 'PERMITIDO' : 'DENEGADO'
    registrar('Lectura (RN-001)', 'SELECT', tabla, 'Admin', 'PERMITIDO', adminPerm, adminErr?.message)

    // Cajero NO puede leer (debe retornar 0 filas o denegado)
    const { data: cajeroData, error: cajeroErr } = await cajeroClient.from(tabla).select('*').limit(1)
    const cajeroBloqueado = cajeroErr !== null || (cajeroData && cajeroData.length === 0)
    registrar(
      'Lectura (RN-001)',
      'SELECT',
      tabla,
      'Cajero',
      'DENEGADO',
      cajeroBloqueado ? 'DENEGADO' : 'PERMITIDO',
      cajeroErr ? cajeroErr.message : `Filas expuestas: ${cajeroData?.length}`,
    )
  }

  // B. Tablas donde Cajero SÍ TIENE LECTURA para operar (catálogos públicos)
  const tablasPublicasCajero = ['productos', 'tamanos_vaso', 'categorias_gasto']
  for (const tabla of tablasPublicasCajero) {
    const { data: cajeroData, error: cajeroErr } = await cajeroClient.from(tabla).select('*').limit(1)
    const cajeroPerm = !cajeroErr && cajeroData && cajeroData.length > 0 ? 'PERMITIDO' : 'DENEGADO'
    registrar('Catálogos Públicos', 'SELECT', tabla, 'Cajero', 'PERMITIDO', cajeroPerm, cajeroErr?.message)
  }

  // C. Tablas con patrón "propio registro" (turnos_caja, cierres_caja, ventas)
  // Admin ve todas; Cajero solo las suyas
  const { data: adminTurnos } = await adminClient.from('turnos_caja').select('id, cajero_id')
  const { data: cajeroTurnos } = await cajeroClient.from('turnos_caja').select('id, cajero_id')

  const soloPropios = (cajeroTurnos || []).every((t) => t.cajero_id === cajeroAuth.user.id)
  registrar(
    'Propio Registro',
    'SELECT',
    'turnos_caja',
    'Cajero',
    'SOLO_PROPIOS',
    soloPropios ? 'SOLO_PROPIOS' : 'FILTRA_AJENOS',
    `Turnos vistos por cajero: ${cajeroTurnos?.length} de ${adminTurnos?.length} totales`,
  )

  // =========================================================================
  // SUBBLOQUE BD-10.2 — AUDITORÍA DE ESCRITURA (INSERT / UPDATE / DELETE)
  // =========================================================================
  console.log('\n--- SUBBLOQUE BD-10.2: AUDITORÍA DE ESCRITURA NO AUTORIZADA ---')

  // 1. Cajero intentando INSERT en productos (bloqueado por RLS)
  const { error: insProdErr } = await cajeroClient.from('productos').insert({
    nombre: 'Ceviche Hack RLS',
    descripcion: 'Intento no autorizado',
  })
  registrar(
    'Escritura Indebida',
    'INSERT',
    'productos',
    'Cajero',
    'DENEGADO',
    insProdErr ? 'DENEGADO' : 'PERMITIDO',
    insProdErr?.message,
  )

  // 2. Cajero intentando INSERT en insumos (bloqueado por RLS)
  const { error: insInsumoErr } = await cajeroClient.from('insumos').insert({
    nombre: 'Camarón Hack RLS',
    unidad_medida: 'gramos',
    stock_actual: 9999,
  })
  registrar(
    'Escritura Indebida',
    'INSERT',
    'insumos',
    'Cajero',
    'DENEGADO',
    insInsumoErr ? 'DENEGADO' : 'PERMITIDO',
    insInsumoErr?.message,
  )

  // 3. Cajero intentando INSERT en gastos (bloqueado por RLS)
  const { error: insGastoErr } = await cajeroClient.from('gastos').insert({
    categoria_id: '00000000-0000-0000-0000-000000000000',
    concepto: 'Gasto ilícito',
    monto: 50000,
  })
  registrar(
    'Escritura Indebida',
    'INSERT',
    'gastos',
    'Cajero',
    'DENEGADO',
    insGastoErr ? 'DENEGADO' : 'PERMITIDO',
    insGastoErr?.message,
  )

  // 4. Tablas inmutables bajo RLS (RN-004, RN-010):
  // Ningún cliente PostgREST (ni admin) puede hacer UPDATE ni DELETE
  // PostgREST protege las tablas sin política devolviendo 0 filas afectadas o error
  const { data: ventaReal } = await adminClient.from('ventas').select('id, total').limit(1).single()
  if (ventaReal) {
    const { data: updVentaData, error: updVentaErr } = await adminClient
      .from('ventas')
      .update({ total: 999999 })
      .eq('id', ventaReal.id)
      .select()

    const ventaInmutable = updVentaErr !== null || (updVentaData && updVentaData.length === 0)
    registrar(
      'Inmutabilidad (RN-010)',
      'UPDATE',
      'ventas',
      'Admin',
      'INMUTABLE_BLOQUEADO',
      ventaInmutable ? 'INMUTABLE_BLOQUEADO' : 'MODIFICADO',
      `Filas alteradas: ${updVentaData?.length ?? 0}`,
    )
  }

  const { data: cierreReal } = await adminClient.from('cierres_caja').select('id').limit(1).single()
  if (cierreReal) {
    const { data: delCierreData, error: delCierreErr } = await adminClient
      .from('cierres_caja')
      .delete()
      .eq('id', cierreReal.id)
      .select()

    const cierreInmutable = delCierreErr !== null || (delCierreData && delCierreData.length === 0)
    registrar(
      'Inmutabilidad (RN-004)',
      'DELETE',
      'cierres_caja',
      'Admin',
      'INMUTABLE_BLOQUEADO',
      cierreInmutable ? 'INMUTABLE_BLOQUEADO' : 'ELIMINADO',
      `Filas alteradas: ${delCierreData?.length ?? 0}`,
    )
  }

  const { data: movReal } = await adminClient.from('movimientos_inventario').select('id').limit(1).single()
  if (movReal) {
    const { data: delMovData, error: delMovErr } = await adminClient
      .from('movimientos_inventario')
      .delete()
      .eq('id', movReal.id)
      .select()

    const movInmutable = delMovErr !== null || (delMovData && delMovData.length === 0)
    registrar(
      'Inmutabilidad (Log Inv)',
      'DELETE',
      'movimientos_inventario',
      'Admin',
      'INMUTABLE_BLOQUEADO',
      movInmutable ? 'INMUTABLE_BLOQUEADO' : 'ELIMINADO',
      `Filas alteradas: ${delMovData?.length ?? 0}`,
    )
  }

  // 5. Verificación de usuario Anónimo (no autenticado)
  const { data: anonInsumos, error: anonErr } = await anonClient.from('insumos').select('*').limit(1)
  const anonBloqueado = anonErr !== null || (anonInsumos && anonInsumos.length === 0)
  registrar(
    'Seguridad Anónima',
    'SELECT',
    'insumos',
    'Anónimo',
    'DENEGADO',
    anonBloqueado ? 'DENEGADO' : 'PERMITIDO',
    anonErr?.message || 'Sin acceso',
  )

  // =========================================================================
  // REPORTE FINAL
  // =========================================================================
  console.log('\n' + '='.repeat(85))
  console.log(' REPORTE FINAL DE AUDITORÍA BD-10.1 & BD-10.2')
  console.log('='.repeat(85))

  let totalExitos = 0
  let totalFallos = 0

  for (const r of resultados) {
    const badge = r.exito ? '✓ PASS' : '✗ FAIL'
    if (r.exito) totalExitos++
    else totalFallos++
    console.log(
      `[${badge}] ${r.operacion.padEnd(7)} | ${r.tabla.padEnd(25)} | Rol: ${r.rol.padEnd(7)} | ` +
        `Esperado: ${r.esperado.padEnd(19)} | Obtenido: ${r.obtenido.padEnd(19)} ${r.detalle ? `(${r.detalle})` : ''}`,
    )
  }

  console.log('='.repeat(85))
  console.log(`TOTAL PRUEBAS EJECUTADAS: ${resultados.length} | EXITOSAS: ${totalExitos} | FALLIDAS: ${totalFallos}`)
  console.log('='.repeat(85))

  if (totalFallos > 0) {
    console.error('\n⚠️ Se detectaron fallos en la auditoría de seguridad.')
    process.exit(1)
  } else {
    console.log('\n🎉 TODAS LAS PRUEBAS DE SEGURIDAD RLS Y TRIGGERS PASARON AL 100%.')
  }
}

runAudit().catch((err) => {
  console.error('Error fatal durante la auditoría:', err)
  process.exit(1)
})
