-- Migración: Permitir tipos dinámicos y personalizados en insumos
alter table public.insumos
  drop constraint if exists insumos_tipo_check;

comment on column public.insumos.tipo is
  'Tipo de insumo: vaso, otro, o cualquier tipo personalizado definido por el administrador (ej: empaque, ingrediente).';
