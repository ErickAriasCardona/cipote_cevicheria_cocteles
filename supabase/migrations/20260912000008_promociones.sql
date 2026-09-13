-- Migración (ticket post-MVP "Carta/Promociones", TAREA A, ticket 1/2 —
-- BASE DE DATOS + extensión de registrar-venta; la UI de Carta/Promociones
-- es el ticket 2, separado y dependiente de este).
--
-- Tabla `promociones`: combos que agrupan varios productos bajo un nombre y
-- precio únicos (ej. "Combo Pareja" = 1 ceviche + 2 bebidas por un precio
-- fijo, menor a la suma de precios individuales). Mismo criterio de
-- unicidad global de nombre que `productos.nombre` (20260904000001): el
-- nombre de una promoción compite en el mismo espacio de nombres visible al
-- Cajero que el de un producto individual (ambos aparecen mezclados en la
-- futura pantalla "Carta"), así que se exige unicidad aquí también para
-- evitar confusión en el punto de venta — aunque técnicamente no hay UNIQUE
-- cruzado entre las dos tablas (no es expresable como constraint sin una
-- tabla paraguas; se documenta como responsabilidad de la futura UI del
-- ticket 2 validar que el nombre no choque con uno de `productos`, igual
-- que ya se documentó la responsabilidad de aplicación para el 1:1
-- tamaño↔insumo-vaso en 20260904000003_catalogo_tamanos_vaso.sql).

create table public.promociones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  precio numeric(12, 2) not null check (precio > 0),
  imagen_url text null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.promociones is
  'Combos de productos (ticket post-MVP Carta/Promociones): agrupan N '
  'productos bajo un nombre y precio únicos. precio es el precio vigente '
  'del combo completo (nunca la suma de precios individuales de sus '
  'componentes); ventas.precio_unitario guarda un snapshot histórico '
  'independiente, igual que ya hace para productos individuales. Los '
  'productos que componen cada promoción viven en promocion_productos.';

create index ix_promociones_activo on public.promociones (activo) where activo = true;

drop trigger if exists tr_promociones_updated_at on public.promociones;
create trigger tr_promociones_updated_at
  before update on public.promociones
  for each row
  execute function public.set_updated_at();

-- RLS: mismo patrón y mismo criterio de acceso que `productos` hoy (revisado
-- en 20260904000001_catalogo_productos.sql + el estado actual real de
-- rol_permisos tras 20260905000008_permitir_eliminar_productos_y_tamanos.sql,
-- que habilitó delete=true para Administrador). El Cajero necesita SELECT
-- para poder vender promociones desde el punto de venta (futura Carta,
-- ticket 2), igual que ya puede leer `productos`.

alter table public.promociones enable row level security;

create policy promociones_select on public.promociones
  for select
  using (
    public.fn_check_permission(auth.uid(), 'promociones', 'select')
  );

create policy promociones_insert on public.promociones
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'promociones', 'insert')
  );

create policy promociones_update on public.promociones
  for update
  using (
    public.fn_check_permission(auth.uid(), 'promociones', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'promociones', 'update')
  );

create policy promociones_delete on public.promociones
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'promociones', 'delete')
  );

insert into public.rol_permisos (rol, recurso, accion, permitido) values
  ('administrador', 'promociones', 'select', true),
  ('administrador', 'promociones', 'insert', true),
  ('administrador', 'promociones', 'update', true),
  ('administrador', 'promociones', 'delete', true),
  ('cajero',        'promociones', 'select', true),
  ('cajero',        'promociones', 'insert', false),
  ('cajero',        'promociones', 'update', false),
  ('cajero',        'promociones', 'delete', false)
on conflict (rol, recurso, accion) do nothing;
