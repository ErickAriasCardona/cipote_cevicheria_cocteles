-- Migración: Agregar columna stock_minimo a public.insumos
alter table public.insumos
  add column if not exists stock_minimo numeric(12, 2) not null default 0 check (stock_minimo >= 0);

comment on column public.insumos.stock_minimo is
  'Nivel de stock mínimo deseado. Cuando stock_actual <= stock_minimo y stock_minimo > 0, se alerta bajo stock.';
