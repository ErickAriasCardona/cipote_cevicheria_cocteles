-- Migración 15 de este bloque (Vulcano, BD-02.3 — cierre del punto pendiente
-- detectado en Fase 4/5 sobre `movimientos_inventario`).
--
-- Contexto: la migración `20260904000005_movimientos_inventario.sql` (ya
-- aplicada, no se edita) replicó al pie de la letra la matriz de acceso de
-- Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección 5.3): esa tabla quedó
-- `I🚫 U🚫 D🚫` para los dos roles de aplicación, solo `service_role` escribe
-- (mismo patrón que `ventas`/`cierres_caja`/`venta_pagos`). Eso dejó sin
-- mecanismo real la funcionalidad de "registrar inventario inicial de vasos"
-- que BD-02.3 sí necesita (RF-04.2/HU-04.2), sin tener que construir todavía
-- la infraestructura de Edge Functions de venta (BD-04). Se documentaron 3
-- alternativas sin implementar ninguna (ver `movimientosInventarioService.ts`,
-- `InsumosPage.tsx` e informe de cierre de Vulcano) hasta la decisión de Erick.
--
-- Decisión de Erick (2026-09-04): Opción 2 — abrir un INSERT directo bajo RLS
-- para el rol `administrador`, ACOTADO exclusivamente a
-- `tipo_movimiento = 'inventario_inicial'`. `tipo_movimiento = 'venta'` sigue
-- siendo exclusivo de `service_role` (Edge Function `registrar-venta`, BD-04);
-- esta migración NO le abre esa puerta al Administrador, ni al Cajero (que
-- sigue sin ninguna fila de `insert` para este recurso: 🚫 sin cambios).
--
-- Decisión de diseño (acotación por tipo_movimiento): se implementa como una
-- condición adicional en el WITH CHECK de la política, NO como un caso
-- especial dentro de `fn_check_permission()`. Esa función es deliberadamente
-- genérica (rol x recurso x accion -> permitido, `MODELO_DATOS_MVP_1.0`
-- sección 7) y no recibe los valores de la fila que se intenta insertar;
-- inyectarle ahí una regla específica de una sola columna de una sola tabla
-- rompería ese único punto de decisión para las otras 13 tablas del modelo.
-- Es el mismo patrón ya usado en este mismo bloque para reglas que sí
-- dependen de los datos de la fila: el CHECK cruzado
-- `ck_movimientos_inventario_venta_id` (tabla) y la condición OR de "propio
-- registro" en la política de `usuarios_perfil.select` (BD-01) viven en la
-- política/constraint de su tabla, no en `fn_check_permission()`.

insert into public.rol_permisos (rol, recurso, accion, permitido) values
  ('administrador', 'movimientos_inventario', 'insert', true);

create policy movimientos_inventario_insert_inicial on public.movimientos_inventario
  for insert
  with check (
    tipo_movimiento = 'inventario_inicial'
    and public.fn_check_permission(auth.uid(), 'movimientos_inventario', 'insert')
  );

comment on policy movimientos_inventario_insert_inicial on public.movimientos_inventario is
  'Único INSERT permitido bajo RLS en esta tabla (RF-04.2, BD-02.3, decisión '
  'de Erick 2026-09-04, Opción 2): administrador, y solo cuando '
  'tipo_movimiento = ''inventario_inicial''. tipo_movimiento = ''venta'' sigue '
  'siendo exclusivo de service_role vía la Edge Function registrar-venta '
  '(BD-04); ningún rol de aplicación puede insertar esas filas directamente.';
