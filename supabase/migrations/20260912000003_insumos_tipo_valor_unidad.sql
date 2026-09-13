-- Migración (ticket post-MVP "Separar tipo de unidad y valor de unidad en
-- Insumos"): hoy `insumos.unidad_medida` guarda un string libre combinado
-- (ej. "9oz", "400ml", "unidad") que mezcla la cantidad y la unidad en un solo
-- texto. Erick pidió separarlo en dos campos reales y consultables:
--   - tipo_unidad: la unidad de medida (ml, gr, kg, lt, oz, unidad...).
--   - valor_unidad: la cantidad numérica (9, 400, 1...).
--
-- Datos reales verificados en el entorno local antes de escribir esta
-- migración (ver `select distinct tipo, unidad_medida from insumos`):
-- '400ml', 'unidad' (x3), '9oz', '12oz', '7oz', '16oz'. Todos son parseables
-- por el patrón "<número><letras>" salvo 'unidad', que se trata como caso
-- especial (valor_unidad=1, tipo_unidad='unidad').
--
-- Decisión sobre la columna vieja `unidad_medida`: NO se elimina por completo.
-- Se reconstruye como columna GENERATED (derivada de valor_unidad+tipo_unidad,
-- almacenada) porque varias pantallas la leen solo para mostrarla en texto
-- (InsumosTable, ConteoInventarioDiarioForm, RecetaForm) y no tiene sentido
-- de negocio propio más allá de ser un resumen legible -- mantenerla evita
-- tocar esas pantallas sin necesidad (KISS) y garantiza que nunca se
-- desincronice del valor real (single source of truth = los dos campos
-- nuevos). Ya no se puede escribir directamente (Postgres lo rechaza en
-- columnas GENERATED): insumosService.ts deja de enviarla en INSERT/UPDATE.

-- 1. Agregar las columnas nuevas (nullable de entrada, para poder backfillear).
alter table public.insumos
  add column valor_unidad numeric(10, 2),
  add column tipo_unidad text;

-- 2. Backfill: separar valor numérico y tipo de unidad desde el string
-- libre existente. Patrón "<número><unidad>" (con o sin espacio en medio).
update public.insumos
set
  valor_unidad = (regexp_match(unidad_medida, '^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)$'))[1]::numeric,
  tipo_unidad = lower((regexp_match(unidad_medida, '^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)$'))[2])
where unidad_medida ~ '^[0-9]+(?:\.[0-9]+)?\s*[a-zA-Z]+$';

-- Caso especial: strings sin número explícito (ej. 'unidad') -> valor=1,
-- tipo_unidad = el string tal cual (en minúsculas).
update public.insumos
set
  valor_unidad = 1,
  tipo_unidad = lower(trim(unidad_medida))
where valor_unidad is null;

-- Salvaguarda: si por algún motivo quedó algo sin parsear (no debería, ya que
-- el caso especial anterior cubre cualquier resto), no dejar filas inválidas
-- antes de aplicar NOT NULL.
update public.insumos
set valor_unidad = 1, tipo_unidad = coalesce(tipo_unidad, 'unidad')
where valor_unidad is null or tipo_unidad is null or trim(tipo_unidad) = '';

-- 3. Reglas de integridad sobre los campos reales.
alter table public.insumos
  alter column valor_unidad set default 1,
  alter column valor_unidad set not null,
  alter column tipo_unidad set default 'unidad',
  alter column tipo_unidad set not null;

alter table public.insumos
  add constraint insumos_valor_unidad_check check (valor_unidad > 0),
  add constraint insumos_tipo_unidad_check check (length(trim(tipo_unidad)) > 0);

comment on column public.insumos.tipo_unidad is
  'Unidad de medida (ml, gr, kg, lt, oz, unidad, o cualquier tipo personalizado '
  'que el administrador agregue desde el formulario -- mismo criterio dinámico '
  'que insumos.tipo, ver 20260905000012_insumos_tipo_dinamico.sql).';

comment on column public.insumos.valor_unidad is
  'Cantidad numérica de la presentación (ej. 9 en "9oz", 400 en "400ml"). '
  'Junto con tipo_unidad reemplaza al string libre unidad_medida.';

-- 4. Quitar la unicidad vieja (nombre, tipo, unidad_medida) -- unidad_medida
-- va a dejar de ser una columna física escribible en el siguiente paso, así
-- que la unicidad real pasa a expresarse sobre las columnas base.
alter table public.insumos
  drop constraint if exists insumos_nombre_tipo_unidad_medida_key;

-- 5. Reconstruir unidad_medida como columna derivada (GENERATED ALWAYS).
-- Postgres no permite "ALTER COLUMN ... ADD GENERATED AS" sobre una columna
-- normal ya existente: hay que dropearla y re-crearla.
alter table public.insumos drop column unidad_medida;

-- Nota de formato: valor_unidad es numeric(10,2), así que un valor entero se
-- guarda como "9.00" y uno fraccionario como "2.50" -- ::text conserva esos
-- ceros. Para enteros se usa trunc()::text ("9"); para fraccionarios se
-- recorta el cero final sobrante con rtrim (nunca de la parte entera, el
-- chequeo `valor_unidad = trunc(valor_unidad)` ya descarta ese caso antes).
-- Así la columna derivada coincide con el mismo criterio de formato que usa
-- el frontend (ver app/src/utils/unidadMedida.ts, formatearUnidad): "2.5kg",
-- no "2.50kg"; "400ml", no "400.00ml".
alter table public.insumos add column unidad_medida text generated always as (
  case
    when tipo_unidad = 'unidad' and valor_unidad = 1 then 'unidad'
    when valor_unidad = trunc(valor_unidad) then trunc(valor_unidad)::text || tipo_unidad
    else rtrim(rtrim(valor_unidad::text, '0'), '.') || tipo_unidad
  end
) stored;

comment on column public.insumos.unidad_medida is
  'DERIVADA (ticket post-MVP, 2026-09-12): ya no es una columna escribible. '
  'Se reconstruye automáticamente desde valor_unidad + tipo_unidad únicamente '
  'para no romper pantallas que la leen como texto de presentación (ej. '
  '"9oz", "400ml", "unidad"). Cualquier INSERT/UPDATE debe escribir '
  'valor_unidad/tipo_unidad, nunca unidad_medida directamente.';

-- 6. Unicidad real de un insumo: nombre + tipo + tipo_unidad + valor_unidad
-- (equivalente en granularidad a la unicidad anterior, pero sobre las
-- columnas base en vez del string derivado).
alter table public.insumos
  add constraint insumos_nombre_tipo_tipounidad_valorunidad_key
    unique (nombre, tipo, tipo_unidad, valor_unidad);

comment on constraint insumos_nombre_tipo_tipounidad_valorunidad_key on public.insumos is
  'Reemplaza a insumos_nombre_tipo_unidad_medida_key: misma granularidad de '
  'unicidad (nombre+tipo+unidad de presentación), expresada sobre las '
  'columnas reales tipo_unidad/valor_unidad en vez del string derivado '
  'unidad_medida.';
