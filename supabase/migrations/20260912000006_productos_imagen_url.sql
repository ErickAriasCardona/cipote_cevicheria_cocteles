-- Migración (ticket post-MVP "Carta/Promociones", parte 1/2 de BASE DE
-- DATOS): agrega `imagen_url` a `productos`. Hoy no existe ninguna columna
-- de imagen para productos (confirmado por consulta directa a la BD local
-- antes de esta migración); la pantalla "Carta" (ticket 2, separado) la
-- necesita para mostrar una foto por producto/promoción en el catálogo
-- público. Se guarda solo la URL pública del objeto en el bucket de Storage
-- (ver 20260912000007_storage_bucket_catalogo_imagenes.sql), nunca el binario.
--
-- Nullable: la mayoría de productos existentes no tendrán imagen de
-- inmediato; no es un dato obligatorio para vender (RF-03.1 no lo exige).

alter table public.productos add column if not exists imagen_url text null;

comment on column public.productos.imagen_url is
  'URL pública del objeto en el bucket de Storage "catalogo-imagenes" '
  '(ticket post-MVP Carta/Promociones). Null si el producto no tiene imagen '
  'configurada; no es obligatoria para vender.';
