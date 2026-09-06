-- Migración 9 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Tabla tamanos_vaso: depende de insumos (migración 8). Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md
-- sección 6. El UNIQUE en insumo_id fuerza el mapeo 1:1 tamaño↔insumo-vaso que
-- habilita el descuento implícito (PD-005 resuelta) — no expresable a nivel de
-- constraint que insumo_id.tipo='vaso' (un CHECK no puede mirar otra tabla);
-- queda como responsabilidad de insumosService/recetaService en TypeScript
-- (Riesgo 1 de PLAN_DESARROLLO_2026-09-04_BD-02-catalogos-base.md).

create table public.tamanos_vaso (
  id uuid primary key default gen_random_uuid(),
  etiqueta text not null unique,
  onzas numeric(6, 2) not null check (onzas > 0),
  insumo_id uuid not null unique references public.insumos (id) on delete restrict,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.tamanos_vaso is
  'Tamaños de vaso vendibles (RF-04.2). insumo_id UNIQUE fuerza 1:1 con el '
  'insumo-vaso correspondiente (PD-005). Sin updated_at: catálogo de bajo cambio.';

-- RLS (mismo patrón). Filas de rol_permisos ya sembradas en
-- 20260831000006_seed_rol_permisos.sql (recurso 'tamanos_vaso').

alter table public.tamanos_vaso enable row level security;

create policy tamanos_vaso_select on public.tamanos_vaso
  for select
  using (
    public.fn_check_permission(auth.uid(), 'tamanos_vaso', 'select')
  );

create policy tamanos_vaso_insert on public.tamanos_vaso
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'tamanos_vaso', 'insert')
  );

create policy tamanos_vaso_update on public.tamanos_vaso
  for update
  using (
    public.fn_check_permission(auth.uid(), 'tamanos_vaso', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'tamanos_vaso', 'update')
  );

create policy tamanos_vaso_delete on public.tamanos_vaso
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'tamanos_vaso', 'delete')
  );
