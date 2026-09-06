-- Migración 5 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Habilita RLS y políticas de usuarios_perfil y rol_permisos según la matriz
-- de acceso de la sección 5.3 del modelo de datos.
--
-- Patrón (sección 5.1/5.2 de Poseidon): todas las políticas llaman a
-- fn_check_permission(auth.uid(), recurso, accion); usuarios_perfil además
-- aplica el patrón de doble capa "propio registro" (🔑) para que el Cajero
-- pueda ver su propio perfil aunque el permiso genérico de select le sea
-- negado por rol_permisos.
--
-- Ningún rol de aplicación tiene DELETE real: la política existe (mismo
-- patrón uniforme para las 14 tablas) pero rol_permisos.permitido queda en
-- false para 'delete' en ambos roles (migración 6) — "eliminar usuario" no
-- es un flujo soportado, solo desactivar vía UPDATE activo=false.

alter table public.usuarios_perfil enable row level security;
alter table public.rol_permisos enable row level security;

-- usuarios_perfil ------------------------------------------------------

create policy usuarios_perfil_select on public.usuarios_perfil
  for select
  using (
    public.fn_check_permission(auth.uid(), 'usuarios_perfil', 'select')
    or id = auth.uid()
  );

create policy usuarios_perfil_insert on public.usuarios_perfil
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'usuarios_perfil', 'insert')
  );

create policy usuarios_perfil_update on public.usuarios_perfil
  for update
  using (
    public.fn_check_permission(auth.uid(), 'usuarios_perfil', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'usuarios_perfil', 'update')
  );

create policy usuarios_perfil_delete on public.usuarios_perfil
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'usuarios_perfil', 'delete')
  );

-- rol_permisos -----------------------------------------------------------
-- Solo lectura para Administrador en el MVP (sección 5.3: "Nadie edita
-- permisos vía RLS en el MVP; Root los administra por consola/service_role").

create policy rol_permisos_select on public.rol_permisos
  for select
  using (
    public.fn_check_permission(auth.uid(), 'rol_permisos', 'select')
  );

create policy rol_permisos_insert on public.rol_permisos
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'rol_permisos', 'insert')
  );

create policy rol_permisos_update on public.rol_permisos
  for update
  using (
    public.fn_check_permission(auth.uid(), 'rol_permisos', 'update')
  )
  with check (
    public.fn_check_permission(auth.uid(), 'rol_permisos', 'update')
  );

create policy rol_permisos_delete on public.rol_permisos
  for delete
  using (
    public.fn_check_permission(auth.uid(), 'rol_permisos', 'delete')
  );
