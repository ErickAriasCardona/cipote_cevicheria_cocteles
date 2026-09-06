-- Migración: Soporte para Conteo General de Insumos (Apertura y Cierre) y Stock Mínimo Diario

-- 1. Agregar stock_minimo_diario a public.insumos
alter table public.insumos
  add column if not exists stock_minimo_diario numeric(12, 2) not null default 0 check (stock_minimo_diario >= 0);

comment on column public.insumos.stock_minimo_diario is
  'Nivel de stock mínimo diario/operativo (ej: 10 bolsas por día en caja frente a 50 general en bodega).';

-- Configurar valores de ejemplo para Bolsas si existe
update public.insumos
set stock_minimo = 50.00,
    stock_minimo_diario = 10.00
where nombre ilike '%bolsas%';

-- 2. Modificar restricciones en public.movimientos_inventario
alter table public.movimientos_inventario
  drop constraint if exists movimientos_inventario_tipo_movimiento_check;

alter table public.movimientos_inventario
  add constraint movimientos_inventario_tipo_movimiento_check
  check (tipo_movimiento in ('venta', 'ajuste_manual', 'inventario_inicial', 'conteo_apertura', 'conteo_cierre'));

alter table public.movimientos_inventario
  drop constraint if exists movimientos_inventario_cantidad_check;

alter table public.movimientos_inventario
  add constraint movimientos_inventario_cantidad_check
  check (cantidad <> 0 or tipo_movimiento in ('inventario_inicial', 'conteo_apertura', 'conteo_cierre'));

-- 3. Actualizar política RLS para permitir inserción de conteos de apertura y cierre por el administrador
drop policy if exists movimientos_inventario_insert_inicial on public.movimientos_inventario;
drop policy if exists movimientos_inventario_insert_admin on public.movimientos_inventario;

create policy movimientos_inventario_insert_admin on public.movimientos_inventario
  for insert
  with check (
    tipo_movimiento in ('inventario_inicial', 'conteo_apertura', 'conteo_cierre', 'ajuste_manual')
    and public.fn_check_permission(auth.uid(), 'movimientos_inventario', 'insert')
  );

comment on policy movimientos_inventario_insert_admin on public.movimientos_inventario is
  'Permite al administrador registrar conteos de apertura, cierre, inventario inicial o ajuste manual.';

-- 4. Actualizar índices: eliminar índice restrictivo de 1 solo inventario_inicial por día y crear índice por fecha y tipo
drop index if exists public.ux_movimientos_inventario_inicial_dia;

create index if not exists ix_movimientos_inventario_fecha_tipo
  on public.movimientos_inventario (insumo_id, public.fn_date_utc(created_at), tipo_movimiento);
