-- Migración 12 de Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md sección 2.3 /
-- DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 3), BD-03.1.
--
-- Habilita el ciclo de turno (RF-02.1/HU-02.1): el Cajero abre caja con
-- dinero inicial antes de poder vender. Índice único parcial
-- `ux_turnos_caja_abierto` garantiza a nivel de BD que solo puede existir un
-- turno `abierto` a la vez, de forma global (Erick confirmó explícitamente
-- que es una sola caja física para todo el negocio, no por cajero — ver
-- MODELO_DATOS_MVP_1.0_2026-08-30.md, Riesgo R-3 resuelto y Decisión D-1).
--
-- Las filas de `rol_permisos` para este recurso YA existen desde el seed de
-- BD-01 (20260831000006_seed_rol_permisos.sql, sección "turnos_caja (RF-02.1,
-- tabla física en BD-03)"): administrador select=true/insert=false, cajero
-- select=false (+ propio turno, RLS)/insert=true (+ WITH CHECK
-- cajero_id=auth.uid()). No se requiere una migración nueva de rol_permisos
-- para este bloque — el seed ya anticipó exactamente esta matriz, sin
-- inconsistencia detectada contra el modelo de datos de Poseidon.
--
-- update/delete quedan sin política para ningún rol (🚫): el cierre de turno
-- (UPDATE a estado='cerrado') es exclusivo de la futura Edge Function
-- `cerrar-caja` (BD-06) vía service_role, y no existe ningún RF/RN que
-- contemple borrar un turno (mismo criterio ya documentado en el seed de
-- BD-01 para `turnos_caja.delete`).

create table public.turnos_caja (
  id uuid primary key default gen_random_uuid(),
  cajero_id uuid not null references public.usuarios_perfil (id) on delete restrict,
  fecha_apertura timestamptz not null default now(),
  dinero_inicial numeric(12, 2) not null check (dinero_inicial >= 0),
  estado text not null default 'abierto' check (estado in ('abierto', 'cerrado')),
  created_at timestamptz not null default now()
);

comment on table public.turnos_caja is
  'Ciclo de turno de caja (RF-02.1/HU-02.1). cajero_id se resuelve siempre '
  'desde auth.uid() (HU-02.1 CA-02: asociado automáticamente al usuario '
  'autenticado), nunca elegido por el Cajero en el formulario. Solo puede '
  'existir un turno abierto a la vez (ux_turnos_caja_abierto).';

create index ix_turnos_caja_cajero on public.turnos_caja (cajero_id);

-- Índice único parcial: impide una segunda apertura simultánea (HU-02.1
-- CA-04). A diferencia del índice de inventario inicial de BD-02.1, esta
-- expresión (solo la columna `estado`, sin función sobre timestamptz) no
-- requiere ningún wrapper IMMUTABLE.
create unique index ux_turnos_caja_abierto
  on public.turnos_caja (estado)
  where estado = 'abierto';

alter table public.turnos_caja enable row level security;

-- SELECT: Administrador ve todos los turnos (fn_check_permission); el
-- Cajero no tiene el permiso genérico (fila 'select'=false del seed) pero sí
-- puede ver su propio turno, mismo patrón de doble capa "propio registro"
-- (🔑) ya usado en usuarios_perfil_select (BD-01).
create policy turnos_caja_select on public.turnos_caja
  for select
  using (
    public.fn_check_permission(auth.uid(), 'turnos_caja', 'select')
    or cajero_id = auth.uid()
  );

-- INSERT: el Administrador NO puede abrir caja (fila 'insert'=false del
-- seed — abrir turno es una operación exclusiva del Cajero, coherente con
-- RF-02.1 "el Cajero abre caja"). El Cajero sí puede, siempre que el
-- cajero_id insertado sea su propio auth.uid() (HU-02.1 CA-02) — el índice
-- único parcial de arriba es quien realmente impide la doble apertura
-- (a nivel de BD, inmune a condiciones de carrera), esta política solo
-- decide quién puede intentarlo y sobre qué fila.
create policy turnos_caja_insert on public.turnos_caja
  for insert
  with check (
    public.fn_check_permission(auth.uid(), 'turnos_caja', 'insert')
    and cajero_id = auth.uid()
  );
