-- Migración 15 de Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección 2.3,
-- DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md secciones 4 y 12), BD-06.1.
--
-- cierres_caja: resultado inmutable del cierre de turno (RF-02.2/RF-02.3,
-- RN-003, RN-004, RNF-005). conteo_vasos_cierre: conteo físico de vasos por
-- tamaño al cierre vs. teórico (RF-04.4). Ambas tablas se escriben
-- EXCLUSIVAMENTE por la Edge Function `cerrar-caja` (BD-06.2) vía
-- service_role — sin política INSERT/UPDATE/DELETE para ningún rol de
-- aplicación (🚫 total), mismo patrón ya usado en `ventas`/`venta_pagos`
-- (BD-04.1) y `cierres_caja` en particular es inmutable incluso para
-- Administrador (RN-004/RNF-005), igual que `ventas`.
--
-- Las filas de `rol_permisos` para ambos recursos YA existen desde el seed de
-- BD-01 (20260831000006_seed_rol_permisos.sql, líneas ~95-99 y ~116-119):
-- administrador select=true (global); cajero select=false + "vía turno
-- propio" (política RLS con condición OR adicional, patrón ya documentado).
-- No se necesita ninguna migración nueva de rol_permisos.

create table public.cierres_caja (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null unique references public.turnos_caja (id) on delete restrict,
  dinero_contado numeric(12, 2) not null check (dinero_contado >= 0),
  observaciones text,
  total_efectivo numeric(12, 2) not null default 0,
  total_tarjeta numeric(12, 2) not null default 0,
  total_nequi numeric(12, 2) not null default 0,
  total_rappi numeric(12, 2) not null default 0,
  total_transferencia_exitosa numeric(12, 2) not null default 0,
  total_esperado numeric(12, 2) not null,
  diferencia numeric(12, 2) not null,
  cerrado_por uuid not null references public.usuarios_perfil (id) on delete restrict,
  fecha_cierre timestamptz not null default now()
);

comment on table public.cierres_caja is
  'Resultado inmutable del cierre de turno (RF-02.3, RN-004, RNF-005). '
  'Deliberadamente sin updated_at: refuerza a nivel de esquema que el '
  'registro nunca se edita. Los totales por método de pago son un snapshot '
  'congelado calculado por la Edge Function cerrar-caja (RN-007: solo '
  'transferencias en estado exitosa; RN-010: excluye ventas eliminadas) — '
  'estado_transferencia/eliminado pueden seguir cambiando después sin que '
  'este registro se recalcule jamás. Escrita únicamente vía service_role; '
  'sin política UPDATE/DELETE para ningún rol, ni siquiera Administrador.';

create index ix_cierres_caja_fecha on public.cierres_caja (fecha_cierre);

alter table public.cierres_caja enable row level security;

-- SELECT: Administrador ve todos (fn_check_permission, consulta de HU-02.3);
-- el Cajero ve el cierre de su propio turno (patrón "propio registro" 🔑,
-- vía EXISTS contra turnos_caja.cajero_id, ya que cierres_caja no tiene
-- cajero_id directo).
create policy cierres_caja_select on public.cierres_caja
  for select
  using (
    public.fn_check_permission(auth.uid(), 'cierres_caja', 'select')
    or exists (
      select 1 from public.turnos_caja
      where turnos_caja.id = cierres_caja.turno_id
        and turnos_caja.cajero_id = auth.uid()
    )
  );

-- Deliberadamente sin política INSERT/UPDATE/DELETE (🚫 total): solo
-- cerrar-caja (INSERT) vía service_role escribe esta tabla, y nunca se
-- actualiza ni se borra (RN-004/RNF-005) — ni siquiera Administrador.

create table public.conteo_vasos_cierre (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references public.turnos_caja (id) on delete restrict,
  tamano_vaso_id uuid not null references public.tamanos_vaso (id) on delete restrict,
  cantidad_teorica numeric(12, 2) not null check (cantidad_teorica >= 0),
  cantidad_fisica numeric(12, 2) not null check (cantidad_fisica >= 0),
  diferencia numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  unique (turno_id, tamano_vaso_id)
);

comment on table public.conteo_vasos_cierre is
  'Conteo físico de vasos por tamaño al cierre, vs. teórico (RF-04.4). '
  'cantidad_teorica la calcula cerrar-caja sumando movimientos_inventario.'
  'cantidad del insumo-vaso de este tamaño (columna con signo: positivo en '
  'inventario_inicial, negativo en venta). UNIQUE (turno_id, tamano_vaso_id): '
  'un conteo por tamaño por turno. Escrita únicamente vía service_role.';

create index ix_conteo_vasos_cierre_turno on public.conteo_vasos_cierre (turno_id);

alter table public.conteo_vasos_cierre enable row level security;

-- SELECT: mismo patrón que cierres_caja (Administrador global, Cajero vía
-- turno propio).
create policy conteo_vasos_cierre_select on public.conteo_vasos_cierre
  for select
  using (
    public.fn_check_permission(auth.uid(), 'conteo_vasos_cierre', 'select')
    or exists (
      select 1 from public.turnos_caja
      where turnos_caja.id = conteo_vasos_cierre.turno_id
        and turnos_caja.cajero_id = auth.uid()
    )
  );

-- Deliberadamente sin política INSERT/UPDATE/DELETE (🚫 total): solo
-- cerrar-caja (INSERT) vía service_role escribe esta tabla.
