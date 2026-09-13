-- Migración (ticket post-MVP, parte 2/3: "Relacionar categoría de producto
-- con tipo de insumo"): para que el módulo Productos pueda, al elegir la
-- categoría (ceviche, granizado, bebida), filtrar las combinaciones de
-- tipo_unidad/valor_unidad disponibles en `insumos` para el tipo de insumo
-- correspondiente, hace falta una relación explícita categoría-producto <->
-- tipo-insumo.
--
-- Investigación previa (ver datos reales del entorno local): los tipos de
-- insumo hoy en uso para estas 3 categorías ya son literalmente 'Ceviche/Coctel',
-- 'Granizado' y 'Bebida' -- el propio texto de `insumos.tipo` ya funciona en
-- la práctica como señal de a qué categoría de producto pertenece. La columna
-- `insumos.categoria_vaso` (20260905000010_categorizacion_vasos_granizados.sql)
-- perseguía una idea similar pero quedó huérfana: su backfill apuntaba a
-- nombres literales ('Vaso 7oz', 'Vaso 9oz'...) que ya no existen en los datos
-- reales (hoy el nombre es simplemente 'Vaso', diferenciado por `tipo`), así
-- que en la práctica esa columna está NULL en todas las filas actuales y no
-- se usa en ningún flujo vivo. No se toca ni se reutiliza esa columna aquí
-- para no interferir con el código que sí la lee (InsumoForm/InsumosTable,
-- exclusivo de insumos tipo='vaso'); se agrega una nueva, de proposito más
-- amplio (cualquier tipo de insumo, no solo 'vaso').
--
-- Decisión de diseño: en vez de exigir que el administrador mantenga a mano
-- una relación separada (más superficie de UI, más riesgo de que se
-- desincronice), `categoria_producto` se implementa como columna GENERATED
-- derivada del propio `tipo` por coincidencia de texto (case-insensitive).
-- Esto refleja fielmente cómo ya se usan los tipos hoy y mantiene la relación
-- siempre sincronizada sin trabajo manual adicional. Si en el futuro se crean
-- tipos de insumo con nombres que no calcen con este patrón (ej. "Cóctel" como
-- tipo separado de "Ceviche/Coctel"), esta expresión deberá ampliarse en una
-- migración de ajuste -- documentado aquí para que quede claro que es un
-- mapeo por convención de nombre, no una FK a un catálogo de tipos separado
-- (no existe tal catálogo: `insumos.tipo` es texto libre dinámico desde
-- 20260905000012_insumos_tipo_dinamico.sql).

alter table public.insumos add column categoria_producto text generated always as (
  case
    when tipo ilike '%ceviche%' or tipo ilike '%coctel%' or tipo ilike '%cóctel%' then 'ceviche'
    when tipo ilike 'granizado' then 'granizado'
    when tipo ilike 'bebida' then 'bebida'
    else null
  end
) stored;

comment on column public.insumos.categoria_producto is
  'Relación categoría-producto <-> tipo-insumo (ticket post-MVP "Tamaños y '
  'Precios"). Derivada de `tipo` por coincidencia de texto: ''ceviche'' si '
  'tipo contiene ceviche/coctel, ''granizado'' si tipo = Granizado, ''bebida'' '
  'si tipo = Bebida; null para tipos que no aplican a ninguna categoría de '
  'producto vendible (ej. Bolsa, Tapa, otro). Es la fuente que usa el módulo '
  'Productos para filtrar, al elegir la categoría, qué combinaciones '
  'tipo_unidad/valor_unidad de `insumos` mostrar como opciones de tamaño o '
  'presentación (ver app/src/utils/unidadMedida.ts).';
