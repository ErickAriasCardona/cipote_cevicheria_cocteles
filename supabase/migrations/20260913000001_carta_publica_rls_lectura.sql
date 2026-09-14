-- Migración: Políticas RLS de lectura pública para la Carta en la Landing Page
-- Permite que los visitantes no autenticados (rol anon) y usuarios autenticados
-- puedan consultar los productos, tamaños, precios y promociones ACTIVOS en el menú/carta.
-- Las operaciones de mutación (insert, update, delete) siguen restringidas a administradores.

-- 1. Productos activos
drop policy if exists "productos_select_publico" on public.productos;
create policy "productos_select_publico"
  on public.productos
  for select
  to public
  using (activo = true);

-- 2. Tamaños de vaso activos
drop policy if exists "tamanos_vaso_select_publico" on public.tamanos_vaso;
create policy "tamanos_vaso_select_publico"
  on public.tamanos_vaso
  for select
  to public
  using (activo = true);

-- 3. Precios de productos por tamaño activos
drop policy if exists "producto_tamano_precio_select_publico" on public.producto_tamano_precio;
create policy "producto_tamano_precio_select_publico"
  on public.producto_tamano_precio
  for select
  to public
  using (activo = true);

-- 4. Promociones activas
drop policy if exists "promociones_select_publico" on public.promociones;
create policy "promociones_select_publico"
  on public.promociones
  for select
  to public
  using (activo = true);

-- 5. Productos en promociones
drop policy if exists "promocion_productos_select_publico" on public.promocion_productos;
create policy "promocion_productos_select_publico"
  on public.promocion_productos
  for select
  to public
  using (true);
