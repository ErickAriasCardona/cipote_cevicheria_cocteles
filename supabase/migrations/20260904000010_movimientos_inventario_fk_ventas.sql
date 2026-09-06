-- Migración 14 de Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección 5.3 /
-- DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 11), BD-04.1.
--
-- Cierra el pendiente dejado deliberadamente abierto en
-- `20260904000005_movimientos_inventario.sql` (ver cabecera de ese archivo):
-- ahora que `ventas` ya existe (migración anterior de este mismo bloque),
-- se agrega la FK real que faltaba. No se toca ninguna otra columna, índice
-- ni política RLS de `movimientos_inventario` — todo lo demás ya quedó
-- completo y final desde BD-02.1.

alter table public.movimientos_inventario
  add constraint fk_movimientos_inventario_venta
  foreign key (venta_id) references public.ventas (id) on delete restrict;

comment on constraint fk_movimientos_inventario_venta on public.movimientos_inventario is
  'FK real hacia ventas(id), pendiente desde BD-02.1 (Mejora propuesta 1) '
  'hasta que la tabla ventas existiera (BD-04.1). ON DELETE RESTRICT: no '
  'aplica en la práctica porque ventas no tiene política DELETE para ningún '
  'rol (ni siquiera service_role la usa; el soft-delete de BD-07 es un '
  'UPDATE, nunca un DELETE físico), pero es el mismo patrón ya usado en el '
  'resto de FKs de auditoría/trazabilidad del modelo.';
