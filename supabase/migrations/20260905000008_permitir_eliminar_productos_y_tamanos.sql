-- Migración 23: Habilitar eliminación de productos y presentaciones de tamaño para Administrador

-- 1. Política de eliminación bajo RLS para producto_tamano_precio
create policy producto_tamano_precio_delete on public.producto_tamano_precio
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'producto_tamano_precio', 'delete')
  );

-- 2. Habilitar permiso delete para el rol administrador en productos y producto_tamano_precio
update public.rol_permisos
set permitido = true
where rol = 'administrador'
  and recurso in ('productos', 'producto_tamano_precio')
  and accion = 'delete';
