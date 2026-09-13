-- Migración (ticket post-MVP, parte 2/3): el selector de "Tamaños y Precios"
-- en Productos ahora deriva sus opciones de `insumos` (tipo_unidad +
-- valor_unidad por tipo de insumo relacionado a la categoría, ver
-- 20260912000004_insumos_categoria_producto.sql) en vez de un catálogo
-- fijo previamente curado a mano. Cuando el administrador elige una
-- combinación que todavía no tiene fila en `tamanos_vaso` (porque antes solo
-- se habían sembrado 4 tamaños: 7/9oz para ceviche y 12/16oz para
-- granizado), la aplicación crea esa fila de una vez (ver
-- app/src/services/tamanoVasoService.ts).
--
-- Blocker real detectado con datos existentes: `tamanos_vaso.etiqueta` es
-- UNIQUE a nivel global (sin importar categoría). Los insumos reales de tipo
-- 'Granizado' incluyen presentaciones de 7oz y 9oz (además de 12oz y 16oz) --
-- exactamente las mismas etiquetas que ya usan las filas de categoría
-- 'ceviche'. Con la unicidad actual, crear la fila "7oz"/granizado o
-- "9oz"/granizado fallaría por choque con la fila "7oz"/"9oz" ya existente
-- de categoría 'ceviche'. Esto bloquea por completo poder ofrecer todas las
-- combinaciones reales de insumos para Granizado.
--
-- Resolución: la unicidad correcta ya no es la etiqueta por sí sola, sino la
-- combinación (etiqueta, categoría) -- dos categorías distintas pueden
-- compartir el mismo valor nominal (ej. "12oz" para ceviche Y granizado, cada
-- una con su propia fila/precio/insumo). No es una migración destructiva:
-- todas las filas actuales (0 con categoria null, verificado antes de esta
-- migración) ya cumplen unicidad por (etiqueta, categoria).

alter table public.tamanos_vaso alter column categoria set not null;

alter table public.tamanos_vaso drop constraint if exists tamanos_vaso_etiqueta_key;

alter table public.tamanos_vaso
  add constraint tamanos_vaso_etiqueta_categoria_key unique (etiqueta, categoria);

comment on constraint tamanos_vaso_etiqueta_categoria_key on public.tamanos_vaso is
  'Reemplaza la unicidad global de etiqueta: dos categorías de producto '
  'distintas (ceviche, granizado, bebida) pueden compartir el mismo valor '
  'nominal de tamaño (ej. "12oz"), cada una como fila independiente. Ver '
  '20260912000005_tamanos_vaso_unico_por_categoria.sql para el detalle del '
  'bloqueo de datos reales que motivó este cambio.';
