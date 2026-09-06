-- Migración de ajuste incremental (Poseidon, corrección RF-03.1/RN-011,
-- quinta ronda 2026-09-05). Ver DOCUMENTACIÓN/Product Backlog/Catalogo-Productos/
-- MODELO_DATOS_2026-09-05_precio-producto-tamano.md para el diseño completo y
-- la justificación de cada decisión.
--
-- Corrige el modelo de precios: deja de ser productos.precio (valor único por
-- producto) y pasa a definirse por cada combinación producto x tamaño de vaso
-- (RN-011, nueva). Depende de productos (20260904000001) y tamanos_vaso
-- (20260904000003), ya existentes.
--
-- Fase "expand" del patrón expand-contract: esta migración SOLO agrega y
-- relaja constraints, nunca borra datos. productos.precio se renombra a
-- precio_legado y se vuelve nullable (deja de ser el precio de venta, queda
-- solo como referencia visual del valor previo a esta corrección para el
-- Administrador). El DROP de esa columna queda para una migración futura
-- separada (fase "contract"), gateada a que Vulcano confirme que ningún
-- código de aplicación ya la lee ni la escribe — fuera de alcance aquí.

create table public.producto_tamano_precio (
  producto_id uuid not null references public.productos (id) on delete cascade,
  tamano_vaso_id uuid not null references public.tamanos_vaso (id) on delete restrict,
  precio numeric(12, 2) not null check (precio > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (producto_id, tamano_vaso_id)
);

comment on table public.producto_tamano_precio is
  'Precio vigente por combinación producto x tamaño de vaso (RF-03.1, RN-011). '
  'Un producto se considera "configurado" (RF-03.1) solo si tiene al menos una '
  'fila activa=true aquí. ventas.precio_unitario (BD-04) guarda un snapshot '
  'histórico independiente tomado de esta tabla al momento de la venta; '
  'desactivar o borrar una fila aquí nunca reescribe ventas ya registradas.';

create index ix_producto_tamano_precio_tamano
  on public.producto_tamano_precio (tamano_vaso_id);

-- RLS (mismo patrón que producto_receta: recurso nuevo, sin política DELETE
-- para ningún rol -- la "quita" de un tamaño de un producto se modela como
-- UPDATE activo=false, nunca como borrado físico).

alter table public.producto_tamano_precio enable row level security;

create policy producto_tamano_precio_select on public.producto_tamano_precio
  for select
  using (
    public.fn_check_permission(auth.uid(), 'producto_tamano_precio', 'select')
  );

create policy producto_tamano_precio_insert on public.producto_tamano_precio
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'producto_tamano_precio', 'insert')
  );

create policy producto_tamano_precio_update on public.producto_tamano_precio
  for update
  using (
    public.fn_check_permission(auth.uid(), 'producto_tamano_precio', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'producto_tamano_precio', 'update')
  );

-- Deliberadamente sin política DELETE (igual que producto_receta): sin
-- política, PostgREST rechaza el borrado físico para cualquier rol de
-- aplicación; la "baja" de un tamaño se hace con UPDATE activo=false.

-- Seed de rol_permisos para el recurso nuevo (no estaba en el seed original
-- de BD-01 porque esta tabla no existía en el modelo de datos original).
insert into public.rol_permisos (rol, recurso, accion, permitido) values
  ('administrador', 'producto_tamano_precio', 'select', true),
  ('administrador', 'producto_tamano_precio', 'insert', true),
  ('administrador', 'producto_tamano_precio', 'update', true),
  ('administrador', 'producto_tamano_precio', 'delete', false),
  ('cajero',        'producto_tamano_precio', 'select', true),
  ('cajero',        'producto_tamano_precio', 'insert', false),
  ('cajero',        'producto_tamano_precio', 'update', false),
  ('cajero',        'producto_tamano_precio', 'delete', false);

-- Ajuste de productos.precio (fase "expand" -- ver sección 2 del documento
-- de diseño). No se borra ningún dato: se renombra y se relaja el NOT NULL
-- para no bloquear los INSERT nuevos que ya no envían precio.
alter table public.productos rename column precio to precio_legado;
alter table public.productos alter column precio_legado drop not null;

comment on column public.productos.precio_legado is
  'DEPRECATED (ajuste RN-011, 2026-09-05). Ya no es el precio de venta: el '
  'precio real vive en producto_tamano_precio, por combinación producto x '
  'tamaño de vaso. Se conserva nullable y sin uso funcional únicamente como '
  'referencia visual del valor previo a esta corrección, para que el '
  'Administrador sepa qué precio tenía el producto antes de reconfigurarlo '
  'por tamaño. Candidata a DROP en una migración de ajuste futura (fase '
  '"contract"), una vez que Vulcano confirme que ningún código de aplicación '
  'ya la lee ni la escribe.';
