-- Migración 7 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Tabla productos: catálogo de venta (RF-03.1). Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md
-- sección 5 para el detalle columna por columna que esta migración implementa literalmente.

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  precio numeric(12, 2) not null check (precio > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.productos is
  'Catálogo de productos vendibles (RF-03.1). precio es el precio vigente; '
  'ventas.precio_unitario (BD-04) guarda un snapshot histórico independiente.';

create index ix_productos_activo on public.productos (activo) where activo = true;

-- RLS (mismo patrón de rls_usuarios_perfil_rol_permisos.sql: 4 políticas vía
-- fn_check_permission). Filas de rol_permisos ya sembradas en
-- 20260831000006_seed_rol_permisos.sql (recurso 'productos').

alter table public.productos enable row level security;

create policy productos_select on public.productos
  for select
  using (
    public.fn_check_permission(auth.uid(), 'productos', 'select')
  );

create policy productos_insert on public.productos
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'productos', 'insert')
  );

create policy productos_update on public.productos
  for update
  using (
    public.fn_check_permission(auth.uid(), 'productos', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'productos', 'update')
  );

create policy productos_delete on public.productos
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'productos', 'delete')
  );
