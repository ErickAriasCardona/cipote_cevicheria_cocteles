-- Migración 17 de Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección 2.6,
-- DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 13), BD-08.1.
--
-- gastos: registro de egresos operativos del negocio (RF-05.1): compras,
-- servicios, nómina, arriendos, gastos diarios. Depende de categorias_gasto
-- (migración anterior) vía categoria_id FK — se crea después a propósito.
--
-- Las filas de `rol_permisos` para este recurso YA existen desde el seed de
-- BD-01 (20260831000006_seed_rol_permisos.sql, líneas ~121-129): administrador
-- select/insert/update=true, delete=false; cajero select/insert/update/
-- delete=false (dato financiero, RN-001 lo excluye por completo del Cajero).
-- No se necesita ninguna migración nueva de rol_permisos.

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias_gasto (id) on delete restrict,
  descripcion text not null,
  monto numeric(12, 2) not null check (monto > 0),
  fecha date not null default current_date,
  registrado_por uuid not null references public.usuarios_perfil (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.gastos is
  'Egresos operativos del negocio (RF-05.1). categoria_id es FK real hacia '
  'el catálogo evolutivo categorias_gasto (RF-05.2) -- ON DELETE RESTRICT es '
  'defensa en profundidad (en la práctica nunca se dispara porque '
  'categorias_gasto no tiene política DELETE para ningún rol). updated_at '
  'permite corregir un gasto mal digitado sin perder cuándo se creó '
  'originalmente (igual que productos/insumos, sin trigger automático '
  'todavía -- ver BD-10.1, fn_set_updated_at_trigger, pendiente).';

create index ix_gastos_fecha on public.gastos (fecha);
create index ix_gastos_categoria_id on public.gastos (categoria_id);

alter table public.gastos enable row level security;

create policy gastos_select on public.gastos
  for select
  using (
    public.fn_check_permission(auth.uid(), 'gastos', 'select')
  );

create policy gastos_insert on public.gastos
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'gastos', 'insert')
  );

create policy gastos_update on public.gastos
  for update
  using (
    public.fn_check_permission(auth.uid(), 'gastos', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'gastos', 'update')
  );

-- Deliberadamente sin política DELETE (🚫 total, ni Administrador): un gasto
-- mal digitado se corrige vía UPDATE, nunca se borra físicamente -- mismo
-- criterio de integridad histórica que ventas/cierres_caja.
