-- Migración 11 de este bloque (Poseidon numeraba esta tabla como su migración
-- 14, después de `ventas`, BD-04). Se ADELANTA aquí a BD-02.1 por la "Mejora
-- propuesta 1" aprobada explícitamente por Erick el 2026-09-04 (ver
-- PLAN_DESARROLLO_2026-09-04_BD-02-catalogos-base.md), para que BD-02.3 pueda
-- registrar inventario inicial de vasos apoyándose en esta tabla ya creada.
--
-- Diferencia deliberada y pre-aprobada frente al diseño original de Poseidon
-- (DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 11): `venta_id` todavía NO
-- lleva `references public.ventas(id)` porque `ventas` no existe todavía (se
-- crea en BD-04.1). Se agregará con
-- `ALTER TABLE public.movimientos_inventario ADD CONSTRAINT ... FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON DELETE RESTRICT`
-- en BD-04.1, cuando `ventas` ya exista. Todo lo demás (CHECK cruzado, índice
-- único parcial de inventario inicial, RLS) se implementa ya completo y final,
-- tal como lo describe el diccionario de datos.

create table public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references public.insumos (id) on delete restrict,
  venta_id uuid, -- FK a ventas(id) pendiente de BD-04.1 (Mejora propuesta 1, ver cabecera)
  tipo_movimiento text not null
    check (tipo_movimiento in ('venta', 'ajuste_manual', 'inventario_inicial')),
  cantidad numeric(12, 3) not null check (cantidad <> 0),
  stock_resultante numeric(12, 2) not null,
  usuario_id uuid not null references public.usuarios_perfil (id) on delete restrict,
  observaciones text,
  created_at timestamptz not null default now(),
  constraint ck_movimientos_inventario_venta_id check (
    (tipo_movimiento = 'venta' and venta_id is not null)
    or (tipo_movimiento <> 'venta' and venta_id is null)
  )
);

comment on table public.movimientos_inventario is
  'Log de trazabilidad de cada descuento/ajuste/inventario inicial de insumos '
  '(RF-04.2/RF-04.3). Inmutable por diseño (sin updated_at, sin política '
  'UPDATE/DELETE para ningún rol, HU-04.6 CA-04). venta_id sin FK real todavía '
  '(ver cabecera de este archivo) hasta que BD-04.1 cree la tabla ventas.';

create index ix_movimientos_insumo on public.movimientos_inventario (insumo_id, created_at);
create index ix_movimientos_venta on public.movimientos_inventario (venta_id) where venta_id is not null;

-- Índice único parcial: impide registrar el inventario inicial del mismo
-- insumo dos veces el mismo día (HU-04.2 CA-04), sin necesidad de trigger.
--
-- CORRECCIÓN TÉCNICA (Vulcano, Fase 5 — validación, 2026-09-04): la expresión
-- literal de Poseidon `(created_at::date)` no es válida como expresión de
-- índice en PostgreSQL («functions in index expression must be marked
-- IMMUTABLE», SQLSTATE 42P17) porque el cast timestamptz->date depende del
-- TimeZone de sesión (función STABLE, no IMMUTABLE). Se resuelve con el
-- wrapper `fn_date_utc` de abajo, fijando explícitamente UTC — coherente con
-- la convención ya documentada del esquema («todos los timestamptz se asumen
-- en UTC», DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md, cabecera). Es una
-- corrección de implementación (la única forma de que este constraint exista
-- físicamente), no un cambio de regla de negocio: HU-04.2 CA-04 sigue
-- protegida exactamente igual (un inventario inicial por insumo por día).

create or replace function public.fn_date_utc(ts timestamptz)
returns date
language sql
immutable
as $$
  select (ts at time zone 'utc')::date;
$$;

comment on function public.fn_date_utc(timestamptz) is
  'Wrapper IMMUTABLE de timestamptz->date fijado a UTC, necesario para poder '
  'usar la fecha de created_at en un índice (Postgres exige IMMUTABLE en '
  'expresiones de índice). Ver ux_movimientos_inventario_inicial_dia.';

create unique index ux_movimientos_inventario_inicial_dia
  on public.movimientos_inventario (insumo_id, public.fn_date_utc(created_at))
  where tipo_movimiento = 'inventario_inicial';

-- RLS: a diferencia de las otras tablas de este bloque, aquí NO se replica el
-- patrón de 4 políticas. La matriz de acceso de Poseidon (MODELO_DATOS_MVP_1.0
-- sección 5.3) documenta explícitamente `movimientos_inventario` como
-- S✅ I🚫 U🚫 D🚫 para Administrador y S🔒 I🚫 U🚫 D🚫 para Cajero: "Trazabilidad
-- de solo lectura para Administrador"; ningún rol de aplicación escribe esta
-- tabla directamente, solo `service_role` (Edge Functions), igual que ya
-- documentó el seed 20260831000006_seed_rol_permisos.sql ("insert/update/delete
-- son 🚫: sin filas"). Por eso solo existe política de SELECT — no se crean
-- políticas de INSERT/UPDATE/DELETE (a propósito: sin política, PostgREST
-- rechaza la operación para cualquier rol de aplicación antes de tocar la fila,
-- igual que ya aplica en `cierres_caja`/`ventas`/`venta_pagos`).
--
-- ADVERTENCIA (ver informe de cierre de Vulcano, Fase 4 2026-09-04): esto dejar
-- explícitamente SIN mecanismo de escritura directa bajo RLS a la funcionalidad
-- de "registrar inventario inicial" descrita en BD-02.3 del plan aprobado. Es
-- una inconsistencia real entre el modelo de Poseidon y la redacción de BD-02.3
-- detectada durante el desarrollo, no resuelta aquí unilateralmente.

alter table public.movimientos_inventario enable row level security;

create policy movimientos_inventario_select on public.movimientos_inventario
  for select
  using (
    public.fn_check_permission(auth.uid(), 'movimientos_inventario', 'select')
  );
