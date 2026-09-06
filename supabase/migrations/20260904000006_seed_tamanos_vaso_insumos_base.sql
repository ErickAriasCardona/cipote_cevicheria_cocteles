-- Migración 12 de este bloque (Poseidon: "seed_tamanos_vaso_insumos_base",
-- MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7, paso 2 del resumen ejecutivo).
-- Seed de arranque (dato técnico, no de negocio, igual criterio que el seed
-- de rol_permisos de BD-01): los 4 insumos-vaso y sus 4 tamaños predefinidos
-- (7/9/12/16 oz), con mapeo 1:1 explícito (insumo_id UNIQUE en tamanos_vaso).
--
-- Nombres literales no especificados textualmente por Poseidon (Riesgo 2 de
-- PLAN_DESARROLLO_2026-09-04_BD-02-catalogos-base.md) — transcritos con
-- criterio razonable, análogo a como Vulcano transcribió el seed de
-- rol_permisos en BD-01: insumos.nombre='Vaso <N>oz', tamanos_vaso.etiqueta='<N>oz'.

with insumos_vaso as (
  insert into public.insumos (nombre, tipo, unidad_medida, stock_actual, activo)
  values
    ('Vaso 7oz', 'vaso', 'unidad', 0, true),
    ('Vaso 9oz', 'vaso', 'unidad', 0, true),
    ('Vaso 12oz', 'vaso', 'unidad', 0, true),
    ('Vaso 16oz', 'vaso', 'unidad', 0, true)
  returning id, nombre
)
insert into public.tamanos_vaso (etiqueta, onzas, insumo_id, activo)
select
  case iv.nombre
    when 'Vaso 7oz' then '7oz'
    when 'Vaso 9oz' then '9oz'
    when 'Vaso 12oz' then '12oz'
    when 'Vaso 16oz' then '16oz'
  end as etiqueta,
  case iv.nombre
    when 'Vaso 7oz' then 7
    when 'Vaso 9oz' then 9
    when 'Vaso 12oz' then 12
    when 'Vaso 16oz' then 16
  end as onzas,
  iv.id,
  true
from insumos_vaso iv;
