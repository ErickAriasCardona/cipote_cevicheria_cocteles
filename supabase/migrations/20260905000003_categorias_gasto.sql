-- Migración 16 de Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección 2.6,
-- DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 14), BD-08.1.
--
-- categorias_gasto: catálogo evolutivo de categorías de gasto (RF-05.2).
-- Debe crearse ANTES que `gastos` (migración siguiente): `gastos.categoria_id`
-- es FK obligatoria hacia esta tabla — invertir el orden rompe su creación.
--
-- Las filas de `rol_permisos` para este recurso YA existen desde el seed de
-- BD-01 (20260831000006_seed_rol_permisos.sql, líneas ~131-140): administrador
-- select/insert/update=true, delete=false; cajero select=true (decisión
-- explícita de Prometeo: son solo etiquetas de clasificación, no montos ni
-- existencias, por lo que RN-001 no aplica aquí), insert/update/delete=false.
-- No se necesita ninguna migración nueva de rol_permisos (mismo caso ya visto
-- en BD-03.1 con turnos_caja).

create table public.categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  creado_por uuid not null references public.usuarios_perfil (id) on delete restrict,
  creado_en timestamptz not null default now()
);

comment on table public.categorias_gasto is
  'Catálogo evolutivo de categorías de gasto (RF-05.2), gestionado por el '
  'Administrador. Deliberadamente sin updated_at (esquema literal de '
  'Poseidon): desactivar una categoría (activo=false) no deja rastro de '
  'cuándo ocurrió — límite de auditoría conocido y aceptado, no una omisión. '
  'Nunca se borra físicamente una categoría usada: "eliminar" es '
  'activo=false, para no romper la integridad referencial de gastos '
  'históricos ya vinculados por categoria_id (ON DELETE RESTRICT).';

create index ix_categorias_gasto_activo on public.categorias_gasto (activo) where activo = true;

alter table public.categorias_gasto enable row level security;

-- SELECT: Administrador y Cajero (ambos, ver comentario arriba — RN-001 no
-- aplica a esta tabla, son solo etiquetas de clasificación).
create policy categorias_gasto_select on public.categorias_gasto
  for select
  using (
    public.fn_check_permission(auth.uid(), 'categorias_gasto', 'select')
  );

create policy categorias_gasto_insert on public.categorias_gasto
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'categorias_gasto', 'insert')
  );

create policy categorias_gasto_update on public.categorias_gasto
  for update
  using (
    public.fn_check_permission(auth.uid(), 'categorias_gasto', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'categorias_gasto', 'update')
  );

-- Deliberadamente sin política DELETE (🚫 total, ningún rol incluido
-- Administrador): una categoría nunca se borra físicamente, solo se
-- desactiva vía UPDATE activo=false (ver comentario de tabla).
