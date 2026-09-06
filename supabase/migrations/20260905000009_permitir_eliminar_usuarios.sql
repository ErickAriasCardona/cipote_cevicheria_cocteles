-- Migración 20260905000009: Permitir al Administrador eliminar usuarios
--
-- 1. Habilitar permiso 'delete' en usuarios_perfil para rol 'administrador'
--    en public.rol_permisos.
-- 2. Crear función RPC public.fn_eliminar_usuario(p_usuario_id uuid)
--    con validación de seguridad de auto-eliminación prohibida y manejo
--    de restricción referencial.

-- 1. Actualizar public.rol_permisos para administrador
insert into public.rol_permisos (rol, recurso, accion, permitido)
values ('administrador', 'usuarios_perfil', 'delete', true)
on conflict (rol, recurso, accion)
do update set permitido = true;

-- 2. Función segura para eliminar usuarios
create or replace function public.fn_eliminar_usuario(p_usuario_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller_id uuid := auth.uid();
  v_caller_rol text;
  v_caller_activo boolean;
  v_target_nombre text;
begin
  -- A. Validar autenticación
  if v_caller_id is null then
    raise exception 'No autenticado.' using errcode = '42501';
  end if;

  -- B. Validar que el invocador sea administrador activo
  select rol, activo into v_caller_rol, v_caller_activo
  from public.usuarios_perfil
  where id = v_caller_id;

  if v_caller_rol is null or v_caller_rol != 'administrador' or not v_caller_activo then
    raise exception 'Solo un Administrador activo puede eliminar usuarios.' using errcode = '42501';
  end if;

  -- C. Validar auto-eliminación ("menos el mismo")
  if p_usuario_id = v_caller_id then
    raise exception 'No puedes eliminar tu propio usuario administrador.' using errcode = '22023';
  end if;

  -- D. Validar existencia del usuario objetivo
  select nombre_completo into v_target_nombre
  from public.usuarios_perfil
  where id = p_usuario_id;

  if v_target_nombre is null then
    raise exception 'El usuario no existe o ya fue eliminado.' using errcode = 'P0002';
  end if;

  -- E. Proceder con la eliminación de auth.users (en cascada elimina usuarios_perfil)
  -- Si el usuario tiene registros en ventas, turnos_caja, gastos, etc.,
  -- PostgreSQL disparará automáticamente foreign_key_violation (23503)
  begin
    delete from auth.users where id = p_usuario_id;
  exception
    when foreign_key_violation then
      raise exception 'No se puede eliminar a "%" porque tiene registros históricos de ventas, turnos de caja o gastos asociados. Para impedir su acceso, desactívalo usando el icono de apagar.', v_target_nombre
        using errcode = '23503';
  end;

  return json_build_object(
    'ok', true,
    'mensaje', format('Usuario "%s" eliminado exitosamente.', v_target_nombre)
  );
end;
$$;

comment on function public.fn_eliminar_usuario(uuid) is
  'Permite a un administrador activo eliminar usuarios en auth.users y public.usuarios_perfil, prohibiendo auto-eliminación y protegiendo históricos referenciales con mensaje amigable.';
