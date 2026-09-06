-- Migración: Categorización de vasos (Ceviches/Cócteles y Granizados) y productos
-- 1. Ampliar categorias de productos
alter table public.productos drop constraint if exists productos_categoria_check;
alter table public.productos add constraint productos_categoria_check check (categoria in ('ceviche', 'granizado', 'bebida', 'otro'));

-- 2. Columna categoria en tamanos_vaso
alter table public.tamanos_vaso
  add column if not exists categoria text check (categoria in ('ceviche', 'granizado', 'bebida'));

update public.tamanos_vaso
set categoria = case
  when etiqueta in ('7oz', '9oz') then 'ceviche'
  when etiqueta in ('12oz', '16oz') then 'granizado'
  when tipo = 'bebida' then 'bebida'
  else 'ceviche'
end
where categoria is null;

-- 3. Columna categoria_vaso en insumos
alter table public.insumos
  add column if not exists categoria_vaso text check (categoria_vaso is null or categoria_vaso in ('ceviche', 'granizado'));

update public.insumos
set categoria_vaso = 'ceviche'
where nombre in ('Vaso 7oz', 'Vaso 9oz');

update public.insumos
set categoria_vaso = 'granizado'
where nombre in ('Vaso 12oz', 'Vaso 16oz');
