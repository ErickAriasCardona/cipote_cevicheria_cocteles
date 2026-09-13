-- Migración (ticket post-MVP "Carta/Promociones", TAREA A, ticket 1/2).
-- Extiende `ventas` para poder registrar la venta de una promoción completa
-- (combo) además de un producto individual, sin romper ninguna fila
-- existente ni el camino de venta de producto individual (fase "expand" del
-- patrón expand-contract, mismo criterio que
-- 20260905000001_producto_tamano_precio.sql).
--
-- Decisión de diseño (evaluada contra la alternativa de "1 fila de ventas
-- por cada producto componente de la promoción"): se elige agregar una sola
-- columna `promocion_id` nullable + volver `producto_id` nullable, con un
-- CHECK que exige EXACTAMENTE uno de los dos no-nulo por fila. Se descarta
-- la alternativa de generar N filas (una por producto componente) porque:
--   1. El precio de una promoción es único y fijo (ej. $20.000 por el
--      combo completo) — repartirlo entre N filas de producto individual
--      requeriría prorratear un precio que en realidad no existe por
--      producto dentro del combo, inventando un dato falso.
--   2. Rompería la relación 1:1 "un clic de Registrar venta = una fila de
--      ventas" que ya asumen los reportes existentes (BD-09,
--      ReportesVentasPage/agregarVentasPorPeriodo) y el listado
--      administrativo (BD-07.2, VentasAdminTable) — con N filas, "cuántas
--      ventas se hicieron hoy" dejaría de significar lo mismo.
--   3. Complicaría el soft-delete (RF-03.6): eliminar/restablecer una venta
--      de promoción tendría que operar sobre N filas atómicamente en vez de
--      una sola, para no dejar el combo "parcialmente eliminado".
-- Con una sola fila (producto_id=null, promocion_id=<id>), el precio_unitario/
-- total ya reflejan el precio real cobrado (el de la promoción) y todo el
-- resto de la infraestructura (soft-delete, reportes, listados) sigue
-- funcionando sin cambios: sigue siendo "una fila de ventas = un clic de
-- Registrar venta", solo que ese clic ahora puede representar un producto
-- individual O una promoción completa.

alter table public.ventas alter column producto_id drop not null;

alter table public.ventas
  add column promocion_id uuid references public.promociones (id) on delete restrict;

alter table public.ventas
  add constraint ck_ventas_producto_o_promocion check (
    (producto_id is not null and promocion_id is null)
    or (producto_id is null and promocion_id is not null)
  );

comment on constraint ck_ventas_producto_o_promocion on public.ventas is
  'Exactamente uno de producto_id/promocion_id debe estar presente por fila '
  '(RN-005/RN-006 extendidas a Promociones, ticket post-MVP Carta). Nunca '
  'ambos ni ninguno.';

create index ix_ventas_promocion on public.ventas (promocion_id);

comment on column public.ventas.promocion_id is
  'Promoción vendida (ticket post-MVP Carta/Promociones), si esta fila '
  'representa la venta de un combo en vez de un producto individual. '
  'precio_unitario/total en ese caso son el snapshot del precio de la '
  'promoción (promociones.precio), NUNCA la suma de precios individuales de '
  'sus componentes. tamano_vaso_id queda NULL en estas filas: el/los '
  'tamaño(s) de cada componente viven en promocion_productos.tamano_vaso_id, '
  'fijados al armar la promoción, no en la venta.';
