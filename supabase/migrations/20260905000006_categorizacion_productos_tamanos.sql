-- Migración 22: Categorización de productos (ceviches, bebidas en ml, otros con precio)
-- y ampliación de tamaños para mililitros.

-- 1. Tabla productos: agregar categoria, descripcion y precio directo
alter table public.productos
  add column if not exists categoria text not null default 'ceviche' check (categoria in ('ceviche', 'bebida', 'otro')),
  add column if not exists descripcion text,
  add column if not exists precio numeric(12, 2) check (precio is null or precio > 0);

comment on column public.productos.categoria is 'Clasificación del producto: ceviche (vasos en oz), bebida (presentaciones en ml), o otro (precio directo).';
comment on column public.productos.precio is 'Precio de venta directo para productos de categoría otro (sin combinaciones de tamaño).';

-- 2. Tabla tamanos_vaso: soporte para bebidas en mililitros
alter table public.tamanos_vaso
  add column if not exists tipo text not null default 'vaso' check (tipo in ('vaso', 'bebida')),
  add column if not exists mililitros integer check (mililitros is null or mililitros > 0);

alter table public.tamanos_vaso alter column onzas drop not null;
alter table public.tamanos_vaso alter column insumo_id drop not null;

-- Sembrar presentaciones base para bebidas
insert into public.tamanos_vaso (etiqueta, tipo, mililitros, onzas, insumo_id, activo)
values
  ('250ml', 'bebida', 250, null, null, true),
  ('350ml', 'bebida', 350, null, null, true),
  ('400ml', 'bebida', 400, null, null, true),
  ('500ml', 'bebida', 500, null, null, true)
on conflict (etiqueta) do update
  set tipo = excluded.tipo, mililitros = excluded.mililitros;

-- 3. Tabla ventas: permitir tamano_vaso_id nulo para productos de categoría otro
alter table public.ventas alter column tamano_vaso_id drop not null;