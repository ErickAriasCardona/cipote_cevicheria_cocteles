-- Migración 4 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- fn_check_permission: punto único de decisión de acceso llamado por las
-- políticas RLS de las 14 tablas del modelo (ARQUITECTURA_MVP_1.0_2026-08-30.md
-- sección 6.1). Resuelve rol desde usuarios_perfil y consulta rol_permisos.
-- Deniega por defecto (false) si no hay fila. SECURITY DEFINER porque una
-- política RLS normal no puede leer usuarios_perfil de otro usuario bajo su
-- propio RLS sin esta elevación controlada; STABLE porque no muta datos y su
-- resultado es estable dentro de una misma sentencia.

create or replace function public.fn_check_permission(
  uid uuid,
  recurso text,
  accion text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select rp.permitido
      from public.usuarios_perfil up
      join public.rol_permisos rp
        on rp.rol = up.rol
       and rp.recurso = fn_check_permission.recurso
       and rp.accion = fn_check_permission.accion
      where up.id = fn_check_permission.uid
        and up.activo = true
    ),
    false
  );
$$;

comment on function public.fn_check_permission(uuid, text, text) is
  'Único punto de decisión de acceso (RF-01.2). Resuelve rol en usuarios_perfil '
  'y consulta rol_permisos. Deniega por defecto. Un usuario inactivo (activo=false) '
  'nunca recibe permiso, aunque su rol lo tuviera, sin necesitar tocar rol_permisos.';
