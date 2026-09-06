-- Migración 10 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Tabla producto_receta: depende de productos (migración 7) e insumos
-- (migración 8). Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 8.
-- PK compuesta = patrón exacto de lectura de la futura Edge Function
-- registrar-venta (BD-04): "receta activa de este producto".

create table public.producto_receta (
  producto_id uuid not null references public.productos (id) on delete cascade,
  insumo_id uuid not null references public.insumos (id) on delete restrict,
  condicion text not null default 'siempre'
    check (condicion in ('siempre', 'para_llevar', 'consumo_lugar')),
  cantidad numeric(10, 3) not null check (cantidad > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (producto_id, insumo_id, condicion)
);

comment on table public.producto_receta is
  'Receta evolutiva producto x insumo x condición (RF-04.3, PD-005). Configuración '
  'exclusiva del Administrador; no incluye el motor de descuento automático '
  '(vive en la Edge Function registrar-venta, BD-04).';

create index ix_producto_receta_insumo on public.producto_receta (insumo_id);

-- RLS (mismo patrón). Filas de rol_permisos ya sembradas en
-- 20260831000006_seed_rol_permisos.sql (recurso 'producto_receta').

alter table public.producto_receta enable row level security;

create policy producto_receta_select on public.producto_receta
  for select
  using (
    public.fn_check_permission(auth.uid(), 'producto_receta', 'select')
  );

create policy producto_receta_insert on public.producto_receta
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'producto_receta', 'insert')
  );

create policy producto_receta_update on public.producto_receta
  for update
  using (
    public.fn_check_permission(auth.uid(), 'producto_receta', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'producto_receta', 'update')
  );

create policy producto_receta_delete on public.producto_receta
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'producto_receta', 'delete')
  );
