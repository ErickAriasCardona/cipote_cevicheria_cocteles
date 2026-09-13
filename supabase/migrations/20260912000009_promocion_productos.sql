-- Migración (ticket post-MVP "Carta/Promociones", TAREA A, ticket 1/2).
-- Tabla `promocion_productos`: junction que define de qué productos se
-- compone cada promoción y en qué cantidad (ej. "Combo Pareja" = 2x
-- "Ceviche Mixto" + 2x "Coca-Cola"). Depende de `promociones` (migración
-- anterior) y `productos` (20260904000001), ya existentes.
--
-- Decisión de diseño 1 (on delete): `promocion_id` usa CASCADE (borrar una
-- promoción borra su composición, no tiene sentido dejarla huérfana).
-- `producto_id` usa RESTRICT: si un producto está referenciado por al menos
-- una promoción, no se puede borrar físicamente ese producto sin antes
-- quitarlo de la(s) promoción(es) que lo usan — mismo criterio ya usado en
-- `producto_receta.insumo_id` (20260904000004) y `producto_tamano_precio.
-- tamano_vaso_id` (20260905000001): nunca dejar una fila "fantasma"
-- apuntando a un producto que ya no existe, porque `registrar-venta`
-- necesita poder resolver categoría/receta de cada componente en el momento
-- de la venta. La UI del ticket 2 deberá guiar al Administrador a quitar el
-- producto de sus promociones antes de poder borrarlo (mismo patrón de
-- error ya visible hoy al intentar borrar un insumo en uso).
--
-- Decisión de diseño 2 (unicidad): PK compuesta (promocion_id, producto_id)
-- — un producto no puede aparecer dos veces como fila distinta dentro de la
-- misma promoción; si la promoción necesita 2 unidades del mismo producto,
-- eso se expresa con `cantidad = 2` en una sola fila, no con dos filas.
-- Limitación conocida y aceptada: esta PK no permite que la MISMA promoción
-- incluya el mismo producto dos veces con dos tamaños de vaso DISTINTOS
-- (ej. "1x Coca-Cola 300ml + 1x Coca-Cola 500ml" en el mismo combo) — no es
-- un caso de uso pedido hoy; si se necesita en el futuro, requeriría
-- cambiar la PK a un id propio + UNIQUE(promocion_id, producto_id,
-- tamano_vaso_id), fuera de alcance de este ticket.
--
-- Decisión de diseño 3 (tamano_vaso_id): columna nullable adicional,
-- resuelta UNA SOLA VEZ al armar la promoción (no en cada venta). Motivo:
-- productos de categoría 'ceviche'/'granizado'/'bebida' SIEMPRE requieren un
-- tamaño de vaso para poder calcular su receta de insumo-vaso (igual que ya
-- exige `registrar-venta` para una venta individual); como una promoción no
-- permite al Cajero elegir presentación por componente en el momento de la
-- venta (el combo es un paquete fijo a precio fijo), el tamaño de cada
-- componente que lo necesite debe quedar fijado de antemano por el
-- Administrador al crear la promoción (ticket 2, UI). Para productos de
-- categoría 'otro' (precio directo, sin tamaño) esta columna debe quedar
-- NULL — responsabilidad de la UI del ticket 2 (no expresable como CHECK de
-- una sola fila sin mirar `productos.categoria` de otra tabla, mismo tipo de
-- limitación ya documentada para el 1:1 tamaño↔insumo-vaso en
-- 20260904000003_catalogo_tamanos_vaso.sql). `registrar-venta` (ver
-- migración/función actualizada en este mismo ticket) valida en tiempo de
-- venta que, si el producto componente no es 'otro', esta columna no sea
-- NULL — si lo es, rechaza la venta completa de la promoción (409) en vez
-- de vender con datos incompletos.

create table public.promocion_productos (
  promocion_id uuid not null references public.promociones (id) on delete cascade,
  producto_id uuid not null references public.productos (id) on delete restrict,
  cantidad integer not null default 1 check (cantidad > 0),
  tamano_vaso_id uuid null references public.tamanos_vaso (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (promocion_id, producto_id)
);

comment on table public.promocion_productos is
  'Composición de cada promoción (ticket post-MVP Carta/Promociones): qué '
  'productos incluye, cuántas unidades de cada uno (cantidad) y, si el '
  'producto lo requiere (categoría ceviche/granizado/bebida), qué tamaño de '
  'vaso fijo usa dentro del combo (tamano_vaso_id). registrar-venta recorre '
  'esta tabla para descontar exactamente los mismos insumos que se '
  'descontarían si cada producto componente se vendiera por separado '
  '(receta de producto_receta + insumo-vaso de tamano_vaso_id), '
  'multiplicando por cantidad y por las unidades de promoción vendidas.';

create index ix_promocion_productos_producto on public.promocion_productos (producto_id);
create index ix_promocion_productos_tamano_vaso on public.promocion_productos (tamano_vaso_id);

drop trigger if exists tr_promocion_productos_updated_at on public.promocion_productos;
create trigger tr_promocion_productos_updated_at
  before update on public.promocion_productos
  for each row
  execute function public.set_updated_at();

-- RLS: mismo patrón que producto_tamano_precio/producto_receta (recurso
-- exclusivo de configuración del Administrador). El Cajero recibe SELECT
-- (igual que en producto_receta se le niega porque no necesita ver
-- insumos/cantidades técnicas, PERO aquí sí necesita poder listar de qué
-- productos se compone una promoción para mostrarla en el punto de venta —
-- futura Carta, ticket 2 — así que el criterio correcto es el de
-- `producto_tamano_precio`/`tamanos_vaso`: cajero select=true).

alter table public.promocion_productos enable row level security;

create policy promocion_productos_select on public.promocion_productos
  for select
  using (
    public.fn_check_permission(auth.uid(), 'promocion_productos', 'select')
  );

create policy promocion_productos_insert on public.promocion_productos
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'promocion_productos', 'insert')
  );

create policy promocion_productos_update on public.promocion_productos
  for update
  using (
    public.fn_check_permission(auth.uid(), 'promocion_productos', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'promocion_productos', 'update')
  );

create policy promocion_productos_delete on public.promocion_productos
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'promocion_productos', 'delete')
  );

insert into public.rol_permisos (rol, recurso, accion, permitido) values
  ('administrador', 'promocion_productos', 'select', true),
  ('administrador', 'promocion_productos', 'insert', true),
  ('administrador', 'promocion_productos', 'update', true),
  ('administrador', 'promocion_productos', 'delete', true),
  ('cajero',        'promocion_productos', 'select', true),
  ('cajero',        'promocion_productos', 'insert', false),
  ('cajero',        'promocion_productos', 'update', false),
  ('cajero',        'promocion_productos', 'delete', false)
on conflict (rol, recurso, accion) do nothing;
