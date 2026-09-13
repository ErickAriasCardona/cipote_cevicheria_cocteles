-- Migración: corrige la unicidad de public.insumos para permitir distintas
-- presentaciones reales del mismo insumo (ticket post-MVP).
--
-- Antes: `nombre text not null unique` bloqueaba CUALQUIER insumo con el
-- mismo nombre, sin importar tipo ni unidad de medida. Esto impedía casos
-- de negocio válidos como "Limón" (tipo 'fruta') en unidad 'kg' Y "Limón"
-- (tipo 'fruta') en unidad 'unidad' coexistiendo como dos filas distintas
-- (cada una con su propio stock_actual/stock_minimo y su propia fila en
-- producto_receta vía insumo_id, ver 20260904000004_catalogo_producto_receta.sql).
--
-- Después: la unicidad real pasa a ser la combinación (nombre, tipo,
-- unidad_medida). Dos insumos con el mismo nombre y tipo pero distinta
-- unidad de medida son presentaciones distintas y pueden coexistir.
-- No afecta RN-005 (descuento de inventario por receta) ni RN-008 (stock
-- no negativo), que operan sobre insumo_id / stock_actual por fila.

alter table public.insumos
  drop constraint if exists insumos_nombre_key;

alter table public.insumos
  add constraint insumos_nombre_tipo_unidad_medida_key
    unique (nombre, tipo, unidad_medida);

comment on constraint insumos_nombre_tipo_unidad_medida_key on public.insumos is
  'Unicidad real de un insumo: mismo nombre + mismo tipo pueden coexistir '
  'como filas distintas si su unidad_medida difiere (distintas presentaciones '
  'del mismo insumo, ej. Limón/fruta en kg y Limón/fruta en unidad).';
