-- Migración 20260905000005_fn_set_updated_at_trigger.sql (BD-10.1, RNF-005)
-- Función técnica y triggers automáticos para refrescar la columna `updated_at`
-- en todas las tablas del MVP que la poseen.
--
-- Nota técnica: como quedó formalizado en la cuarta ronda de requisitos
-- (MATRIZ_REQUISITOS_2026-08-30.md y MODELO_DATOS_MVP_1.0_2026-08-30.md sección 6),
-- este trigger es infraestructura puramente técnica (estampado de auditoría temporal,
-- sin cálculo ni regla de negocio), por lo que respeta plenamente la directriz PD-011.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function public.set_updated_at() is
  'Trigger técnico genérico que actualiza automáticamente updated_at en cada UPDATE (BD-10.1).';

-- 1. usuarios_perfil
drop trigger if exists tr_usuarios_perfil_updated_at on public.usuarios_perfil;
create trigger tr_usuarios_perfil_updated_at
  before update on public.usuarios_perfil
  for each row
  execute function public.set_updated_at();

-- 2. rol_permisos
drop trigger if exists tr_rol_permisos_updated_at on public.rol_permisos;
create trigger tr_rol_permisos_updated_at
  before update on public.rol_permisos
  for each row
  execute function public.set_updated_at();

-- 3. productos
drop trigger if exists tr_productos_updated_at on public.productos;
create trigger tr_productos_updated_at
  before update on public.productos
  for each row
  execute function public.set_updated_at();

-- 4. insumos
drop trigger if exists tr_insumos_updated_at on public.insumos;
create trigger tr_insumos_updated_at
  before update on public.insumos
  for each row
  execute function public.set_updated_at();

-- 5. producto_receta
drop trigger if exists tr_producto_receta_updated_at on public.producto_receta;
create trigger tr_producto_receta_updated_at
  before update on public.producto_receta
  for each row
  execute function public.set_updated_at();

-- 6. producto_tamano_precio
drop trigger if exists tr_producto_tamano_precio_updated_at on public.producto_tamano_precio;
create trigger tr_producto_tamano_precio_updated_at
  before update on public.producto_tamano_precio
  for each row
  execute function public.set_updated_at();

-- 7. venta_pagos
drop trigger if exists tr_venta_pagos_updated_at on public.venta_pagos;
create trigger tr_venta_pagos_updated_at
  before update on public.venta_pagos
  for each row
  execute function public.set_updated_at();

-- 8. gastos
drop trigger if exists tr_gastos_updated_at on public.gastos;
create trigger tr_gastos_updated_at
  before update on public.gastos
  for each row
  execute function public.set_updated_at();
