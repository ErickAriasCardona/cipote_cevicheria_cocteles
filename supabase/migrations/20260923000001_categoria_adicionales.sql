-- Migración: Soporte para nueva categoría 'adicionales'
-- Productos con precio fijo directo sin control de stock de vasos/insumos (igual a 'otro')

alter table public.productos drop constraint if exists productos_categoria_check;
alter table public.productos add constraint productos_categoria_check 
  check (categoria in ('ceviche', 'granizado', 'bebida', 'otro', 'adicionales', 'adicional'));

comment on column public.productos.categoria is 'Clasificación del producto: ceviche, granizado, bebida, otro, adicionales.';
