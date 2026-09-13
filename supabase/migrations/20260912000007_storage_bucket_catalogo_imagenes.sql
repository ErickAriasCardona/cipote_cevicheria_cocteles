-- Migración (ticket post-MVP "Carta/Promociones", parte 2/2 de BASE DE
-- DATOS): bucket de Supabase Storage para imágenes de productos y
-- promociones. Revisado antes de crear esta migración: ni
-- `supabase/config.toml` (sección [storage.buckets.*], comentada/vacía) ni
-- ninguna migración previa (`grep storage.buckets supabase/migrations` sin
-- resultados) configuran un bucket todavía — este es el primero del
-- proyecto.
--
-- Nombre elegido: `catalogo-imagenes` (kebab-case, válido como bucket id de
-- Storage; describe su propósito: imágenes del catálogo de venta —
-- productos y promociones — no solo productos, para que el ticket 2 de
-- Carta/Promociones no necesite un segundo bucket).
--
-- Diseño de acceso:
--   - Lectura: público total, sin autenticación (`bucket.public = true` +
--     política SELECT abierta sobre `storage.objects` para este bucket).
--     Necesario para la futura landing/Carta pública (RF de ticket 2) y
--     para que `getPublicUrl` funcione sin firmar URLs.
--   - Escritura (insert/update/delete): solo Administrador autenticado y
--     activo, igual criterio que el resto del catálogo (productos,
--     producto_receta, etc. vía `fn_check_permission`). Como `storage.objects`
--     no es una de las 14 tablas de la matriz original de
--     `rol_permisos`/`fn_check_permission` (Poseidon sección 5.3), se agrega
--     un recurso nuevo `storage_catalogo_imagenes` para reutilizar
--     exactamente el mismo punto único de decisión de acceso en vez de
--     inventar un mecanismo de autorización distinto solo para Storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalogo-imagenes',
  'catalogo-imagenes',
  true,
  5242880, -- 5 MiB por archivo, suficiente para una foto de producto/promoción
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Seed de rol_permisos para el recurso nuevo (mismo patrón que
-- producto_tamano_precio en 20260905000001_producto_tamano_precio.sql: tabla
-- que no existía en el seed original de BD-01).
insert into public.rol_permisos (rol, recurso, accion, permitido) values
  ('administrador', 'storage_catalogo_imagenes', 'select', true),
  ('administrador', 'storage_catalogo_imagenes', 'insert', true),
  ('administrador', 'storage_catalogo_imagenes', 'update', true),
  ('administrador', 'storage_catalogo_imagenes', 'delete', true),
  ('cajero',        'storage_catalogo_imagenes', 'select', true),
  ('cajero',        'storage_catalogo_imagenes', 'insert', false),
  ('cajero',        'storage_catalogo_imagenes', 'update', false),
  ('cajero',        'storage_catalogo_imagenes', 'delete', false)
on conflict (rol, recurso, accion) do nothing;

-- RLS de storage.objects para este bucket. `storage.objects` ya tiene RLS
-- habilitado por Supabase de fábrica; solo se agregan las políticas propias
-- de este bucket (scopeadas por `bucket_id`, sin afectar otros buckets
-- futuros).

create policy catalogo_imagenes_select on storage.objects
  for select
  using (bucket_id = 'catalogo-imagenes');

create policy catalogo_imagenes_insert on storage.objects
  for insert
  with check (
    bucket_id = 'catalogo-imagenes'
    and public.fn_check_permission(auth.uid(), 'storage_catalogo_imagenes', 'insert')
  );

create policy catalogo_imagenes_update on storage.objects
  for update
  using (
    bucket_id = 'catalogo-imagenes'
    and public.fn_check_permission(auth.uid(), 'storage_catalogo_imagenes', 'update')
  )
  with check (
    bucket_id = 'catalogo-imagenes'
    and public.fn_check_permission(auth.uid(), 'storage_catalogo_imagenes', 'update')
  );

create policy catalogo_imagenes_delete on storage.objects
  for delete
  using (
    bucket_id = 'catalogo-imagenes'
    and public.fn_check_permission(auth.uid(), 'storage_catalogo_imagenes', 'delete')
  );
