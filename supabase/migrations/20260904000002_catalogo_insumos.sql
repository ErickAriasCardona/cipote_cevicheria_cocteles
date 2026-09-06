-- Migración 8 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Tabla insumos: catálogo genérico por filas (RF-04.1), base de la receta
-- evolutiva (punto crítico 6.3 de Prometeo). Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md
-- sección 7 para el detalle columna por columna.

create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo text not null default 'otro' check (tipo in ('vaso', 'otro')),
  unidad_medida text not null default 'unidad',
  stock_actual numeric(12, 2) not null default 0 check (stock_actual >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.insumos is
  'Catálogo evolutivo de insumos (RF-04.1). tipo=''vaso'' distingue los insumos '
  'con fila 1:1 en tamanos_vaso (decisión arquitectónica D-4, no de negocio). '
  'stock_actual es la red de seguridad de RN-008 a nivel de BD; la validación '
  'real de stock suficiente vive en la Edge Function registrar-venta (BD-04).';

-- RLS (mismo patrón). Filas de rol_permisos ya sembradas en
-- 20260831000006_seed_rol_permisos.sql (recurso 'insumos').

alter table public.insumos enable row level security;

create policy insumos_select on public.insumos
  for select
  using (
    public.fn_check_permission(auth.uid(), 'insumos', 'select')
  );

create policy insumos_insert on public.insumos
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'insumos', 'insert')
  );

create policy insumos_update on public.insumos
  for update
  using (
    public.fn_check_permission(auth.uid(), 'insumos', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'insumos', 'update')
  );

create policy insumos_delete on public.insumos
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'insumos', 'delete')
  );
